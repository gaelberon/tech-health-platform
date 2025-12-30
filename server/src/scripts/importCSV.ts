/**
 * Script d'import des données depuis le fichier CSV "Editeurs-Overview - Data.csv"
 * 
 * Usage: 
 *   npm run import-csv
 *   ou
 *   npx ts-node --esm src/scripts/importCSV.ts
 * 
 * Ce script:
 * 1. Se connecte à MongoDB
 * 2. Parse le fichier CSV
 * 3. Crée/mise à jour les entités dans l'ordre hiérarchique:
 *    - Editor
 *    - Solution
 *    - Hosting
 *    - Environment
 *    - SecurityProfile (optionnel)
 *    - MonitoringObservability (optionnel)
 *    - EntityCost (optionnel)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';
import { EditorModel } from '../models/Editor.model.js';
import { SolutionModel } from '../models/Solution.model.js';
import { HostingModel } from '../models/Hosting.model.js';
import { EnvironmentModel } from '../models/Environment.model.js';
import { SecurityProfileModel } from '../models/SecurityProfile.model.js';
import { MonitoringObservabilityModel } from '../models/MonitoringObservability.model.js';
import { EntityCostModel } from '../models/EntityCost.model.js';

// Types pour les valeurs manquantes
const MISSING_VALUES = ['MANQUANT (a completer manuellement)', 'TBD', 'N/A', '#ERROR!', ''];

/**
 * Nettoie une valeur du CSV (supprime les valeurs manquantes)
 */
function cleanValue(value: string | undefined): string | undefined {
  if (!value || MISSING_VALUES.includes(value.trim())) {
    return undefined;
  }
  return value.trim();
}

/**
 * Convertit le type de solution du CSV vers le format attendu
 */
function mapSolutionType(csvType: string | undefined): 'SaaS' | 'OnPrem' | 'Hybrid' | 'ClientHeavy' {
  if (!csvType) return 'ClientHeavy';
  const type = csvType.toLowerCase();
  if (type.includes('saas') || type.includes('cloud')) return 'SaaS';
  if (type.includes('on-prem') || type.includes('on-premises') || type.includes('client lourd')) return 'ClientHeavy';
  if (type.includes('hybrid')) return 'Hybrid';
  return 'ClientHeavy'; // Par défaut
}

/**
 * Convertit le type d'environnement du CSV vers le format attendu
 */
function mapEnvironmentType(csvType: string | undefined): 'production' | 'test' | 'dev' | 'backup' | 'recette' {
  if (!csvType) return 'production';
  const type = csvType.toLowerCase();
  if (type.includes('production') || type.includes('prod')) return 'production';
  if (type.includes('test')) return 'test';
  if (type.includes('dev') || type.includes('développement')) return 'dev';
  if (type.includes('backup')) return 'backup';
  if (type.includes('recette') || type.includes('staging') || type.includes('preprod')) return 'recette';
  if (type.includes('infrastructure interne')) return 'production'; // Par défaut pour infrastructure
  return 'production';
}

/**
 * Convertit le type d'hébergement du CSV vers le format attendu
 */
function mapHostingTier(csvType: string | undefined): 'datacenter' | 'private' | 'public' | 'cloud' {
  if (!csvType) return 'cloud';
  const type = csvType.toLowerCase();
  if (type.includes('datacenter') || type.includes('on-premises') || type.includes('en interne')) return 'datacenter';
  if (type.includes('private')) return 'private';
  if (type.includes('public') || type.includes('cloud')) return 'cloud';
  if (type.includes('hébergeur tiers') || type.includes('ovh') || type.includes('bleu') || type.includes('scaleway')) return 'cloud';
  return 'cloud';
}

/**
 * Convertit la redondance du CSV vers le format attendu
 */
function mapRedundancy(csvValue: string | undefined): 'none' | 'minimal' | 'geo-redundant' | 'high' {
  if (!csvValue) return 'none';
  const value = csvValue.toLowerCase();
  if (value.includes('haute') || value.includes('high')) return 'high';
  if (value.includes('geo') || value.includes('géographique')) return 'geo-redundant';
  if (value.includes('minimal')) return 'minimal';
  return 'none';
}

/**
 * Parse les données de sauvegarde depuis le CSV
 */
function parseBackup(csvValue: string | undefined): { exists: boolean; schedule?: string | undefined; rto?: number | undefined; rpo?: number | undefined; restoration_test_frequency?: string | undefined } {
  if (!csvValue || MISSING_VALUES.includes(csvValue)) {
    return { exists: false };
  }
  
  const exists = !csvValue.toLowerCase().includes('none') && !csvValue.toLowerCase().includes('aucune');
  const schedule: string | undefined = csvValue.includes('quotidien') || csvValue.includes('daily') ? 'daily' : 
                   csvValue.includes('hebdomadaire') || csvValue.includes('weekly') ? 'weekly' :
                   csvValue.includes('mensuel') || csvValue.includes('monthly') ? 'monthly' : undefined;
  
  // Extraction RTO/RPO si présent (format: "RTO: X heures, RPO: Y heures")
  const rtoMatch = csvValue.match(/rto[:\s]+(\d+)/i);
  const rpoMatch = csvValue.match(/rpo[:\s]+(\d+)/i);
  
  const result: { exists: boolean; schedule?: string | undefined; rto?: number | undefined; rpo?: number | undefined; restoration_test_frequency?: string | undefined } = {
    exists,
    rto: rtoMatch && rtoMatch[1] ? parseFloat(rtoMatch[1]) : undefined,
    rpo: rpoMatch && rpoMatch[1] ? parseFloat(rpoMatch[1]) : undefined,
    restoration_test_frequency: undefined
  };
  
  if (schedule) {
    result.schedule = schedule;
  }
  
  return result;
}

/**
 * Parse le tech stack depuis le CSV (peut contenir plusieurs technologies séparées par des virgules)
 */
function parseTechStack(csvValue: string | undefined): string[] {
  if (!csvValue || MISSING_VALUES.includes(csvValue)) return [];
  
  // Sépare par virgule et nettoie
  return csvValue.split(',').map(t => t.trim()).filter(t => t && !MISSING_VALUES.includes(t));
}

/**
 * Génère un ID unique à partir d'un nom
 */
function generateId(name: string | undefined, prefix: string): string {
  if (!name) {
    return `${prefix}-${Date.now()}`;
  }
  return `${prefix}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`;
}

/**
 * Fonction principale d'import
 */
async function importCSV() {
  try {
    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    const MONGO_URI = process.env.MONGO_URI;
    
    if (!MONGO_URI) {
      console.error("❌ ERREUR FATALE: La variable d'environnement MONGO_URI n'est pas définie.");
      process.exit(1);
    }
    
    await mongoose.connect(MONGO_URI);
    console.log(`✅ Connecté à MongoDB: ${mongoose.connection.host}`);

    // Lecture du fichier CSV
    // Le fichier est dans le répertoire data/ à la racine du projet
    // process.cwd() sera le répertoire server/ lors de l'exécution depuis npm run
    const csvPath = join(process.cwd(), '..', 'data', 'Editeurs-Overview - Data.csv');
    console.log(`📖 Lecture du fichier CSV: ${csvPath}`);
    
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    // Parse du CSV (skip les 2 premières lignes qui sont les en-têtes)
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true
    });

    console.log(`📊 ${records.length} lignes trouvées dans le CSV`);

    // Compteurs
    let editorsCreated = 0;
    let editorsUpdated = 0;
    let solutionsCreated = 0;
    let solutionsUpdated = 0;
    let hostingsCreated = 0;
    let hostingsUpdated = 0;
    let environmentsCreated = 0;
    let environmentsUpdated = 0;

    // Traitement ligne par ligne
    for (let i = 0; i < records.length; i++) {
      const row = records[i] as Record<string, string>;
      
      // Ignorer les lignes d'en-tête ou vides
      if (!row['A1. Éditeur'] || row['A1. Éditeur'].includes('Priorité')) {
        continue;
      }

      try {
        // 1. Editor
        const editorName = cleanValue(row['A1. Éditeur']);
        if (!editorName) {
          console.warn(`⚠️  Ligne ${i + 1}: Éditeur manquant, ignorée`);
          continue;
        }

        const editorId = generateId(editorName, 'editor');
        let editor = await EditorModel.findOne({ editorId });
        
        if (!editor) {
          editor = new EditorModel({
            editorId,
            name: editorName,
            country: cleanValue(row['B3. Localisation']),
            size: undefined, // Pas dans le CSV
            business_criticality: 'High', // Par défaut
            internal_it_systems: [],
            it_security_strategy: undefined,
            contracts_for_review: []
          });
          await editor.save();
          editorsCreated++;
          console.log(`✅ Editor créé: ${editorName}`);
        } else {
          // Mise à jour si nécessaire
          const country = cleanValue(row['B3. Localisation']);
          if (country && !editor.country) {
            editor.country = country;
            await editor.save();
            editorsUpdated++;
          }
        }

        // 2. Solution
        const solutionName = cleanValue(row['A2. Solution']);
        if (!solutionName) {
          console.warn(`⚠️  Ligne ${i + 1}: Solution manquante, ignorée`);
          continue;
        }

        // Gérer les solutions multiples séparées par des virgules
        const solutionNames = solutionName.split(',').map(s => s.trim());
        
        for (const solName of solutionNames) {
          const solutionId = generateId(`${editorName}-${solName}`, 'solution');
          let solution = await SolutionModel.findOne({ solutionId });
          
          if (!solution) {
            solution = new SolutionModel({
              solutionId,
              editorId: editor._id,
              name: solName,
              description: cleanValue(row['A4. Fonction principale']) || undefined,
              main_use_case: cleanValue(row['A4. Fonction principale']) || 'Non spécifié',
              type: mapSolutionType(row['A5. Type de Solution Logicielle']),
              product_criticality: 'High', // Par défaut
              ip_ownership_clear: true, // Par défaut
              api_robustness: undefined,
              api_documentation_quality: undefined,
              licensing_model: undefined,
              license_compliance_assured: undefined
            });
            await solution.save();
            solutionsCreated++;
            console.log(`✅ Solution créée: ${solName} (${editorName})`);
          } else {
            solutionsUpdated++;
          }
        }

        // Utiliser la première solution pour l'environnement
        const firstSolutionName = solutionNames[0];
        const solutionId = generateId(`${editorName}-${firstSolutionName}`, 'solution');
        const solution = await SolutionModel.findOne({ solutionId });
        
        if (!solution) {
          console.warn(`⚠️  Solution non trouvée pour ${firstSolutionName}, passage à la ligne suivante`);
          continue;
        }

        // 3. Hosting
        const hostingProvider = cleanValue(row['B2. Hébergeur']) || cleanValue(row['B1. Type d\'hébergement']) || 'Non spécifié';
        const hostingId = generateId(`${editorName}-${firstSolutionName}-${hostingProvider}`, 'hosting');
        let hosting = await HostingModel.findOne({ hostingId });
        
        if (!hosting) {
          hosting = new HostingModel({
            hostingId,
            provider: hostingProvider,
            region: cleanValue(row['B3. Localisation']) || 'Non spécifié',
            tier: mapHostingTier(row['B1. Type d\'hébergement']),
            certifications: [], // À extraire depuis D2 si disponible
            contact: {
              name: undefined,
              email: undefined
            }
          });
          await hosting.save();
          hostingsCreated++;
          console.log(`✅ Hosting créé: ${hostingProvider}`);
        } else {
          hostingsUpdated++;
        }

        // 4. Environment
        const envType = mapEnvironmentType(row['A3. Environnement']);
        const envId = generateId(`${editorName}-${firstSolutionName}-${envType}`, 'env');
        let environment = await EnvironmentModel.findOne({ envId });
        
        const backupData = parseBackup(row['D3. Sauvegarde (RTO/RPO)']);
        
        if (!environment) {
          environment = new EnvironmentModel({
            envId,
            solutionId: solution._id,
            hostingId: hosting.hostingId,
            env_type: envType,
            tech_stack: parseTechStack(row['B8. Tech Stack (Langages/BDD)']),
            data_types: [], // À extraire depuis D1 si disponible
            redundancy: mapRedundancy(row['D4. Redondance']),
            backup: {
              exists: backupData.exists,
              schedule: backupData.schedule,
              rto: backupData.rto,
              rpo: backupData.rpo,
              restoration_test_frequency: backupData.restoration_test_frequency
            },
            deployment_type: undefined, // À mapper depuis B4
            virtualization: undefined, // À mapper depuis B5
            db_scaling_mechanism: cleanValue(row['B6. Montée en charge']) || undefined,
            disaster_recovery_plan: undefined,
            network_security_mechanisms: [],
            sla_offered: undefined
          });
          await environment.save();
          environmentsCreated++;
          console.log(`✅ Environment créé: ${envType} (${editorName} - ${firstSolutionName})`);
        } else {
          environmentsUpdated++;
        }

        // 5. SecurityProfile (optionnel - créer seulement si des données sont disponibles)
        const hasSecurityData = cleanValue(row['D5. Cybersécurité']) || cleanValue(row['D2. Conformité & Réglementation']);
        if (hasSecurityData && environment) {
          let securityProfile = await SecurityProfileModel.findOne({ envId: environment._id });
          
          if (!securityProfile) {
            const secId = generateId(`${envId}-security`, 'sec');
            securityProfile = new SecurityProfileModel({
              secId,
              envId: environment._id,
              auth: 'Passwords', // Par défaut
              encryption: {
                in_transit: false,
                at_rest: false
              },
              patching: 'ad_hoc',
              pentest_freq: 'never',
              vuln_mgmt: 'none',
              access_control: undefined,
              internal_audits_recent: undefined,
              centralized_monitoring: false,
              pentest_results_summary: undefined,
              known_security_flaws: undefined,
              incident_reporting_process: undefined
            });
            await securityProfile.save();
            console.log(`✅ SecurityProfile créé pour ${envId}`);
          }
        }

        // 6. MonitoringObservability (optionnel)
        const hasMonitoringData = cleanValue(row['C1. Monitoring de la performance']) || 
                                   cleanValue(row['C2. Centralisation des logs']) ||
                                   cleanValue(row['C3. Outils utilisés']);
        if (hasMonitoringData && environment) {
          let monitoring = await MonitoringObservabilityModel.findOne({ envId: environment._id });
          
          if (!monitoring) {
            const monId = generateId(`${envId}-monitoring`, 'mon');
            monitoring = new MonitoringObservabilityModel({
              monId,
              envId: environment._id,
              perf_monitoring: cleanValue(row['C1. Monitoring de la performance']) === 'Oui' ? 'Yes' : 
                              cleanValue(row['C1. Monitoring de la performance']) === 'Partiel' ? 'Partial' : 'No',
              log_centralization: cleanValue(row['C2. Centralisation des logs']) === 'Oui' ? 'Yes' :
                                 cleanValue(row['C2. Centralisation des logs']) === 'Partiel' ? 'Partial' : 'No',
              tools: parseTechStack(row['C3. Outils utilisés']),
              alerting_strategy: undefined
            });
            await monitoring.save();
            console.log(`✅ MonitoringObservability créé pour ${envId}`);
          }
        }

        // 7. EntityCost (optionnel)
        const hasCostData = cleanValue(row['E5. Coût d\'hébergement (annuel)']) || 
                           cleanValue(row['E6. Coût des licences PaaS / IaaS (annuel)']);
        if (hasCostData && environment) {
          let cost = await EntityCostModel.findOne({ envId: environment._id });
          
          if (!cost) {
            const costId = generateId(`${envId}-cost`, 'cost');
            const hostingAnnual = cleanValue(row['E5. Coût d\'hébergement (annuel)']);
            const licensesAnnual = cleanValue(row['E6. Coût des licences PaaS / IaaS (annuel)']);
            
            cost = new EntityCostModel({
              costId,
              envId: environment._id,
              hosting_monthly: hostingAnnual ? parseFloat(hostingAnnual) / 12 : undefined,
              licenses_monthly: licensesAnnual ? parseFloat(licensesAnnual) / 12 : undefined,
              ops_hours_monthly_equiv: undefined,
              comments: cleanValue(row['G3. Notes générales']) || undefined,
              hidden_costs: undefined,
              cost_evolution_factors: undefined,
              modernization_investment_needs: undefined
            });
            await cost.save();
            console.log(`✅ EntityCost créé pour ${envId}`);
          }
        }

      } catch (error: any) {
        console.error(`❌ Erreur lors du traitement de la ligne ${i + 1}:`, error.message);
        continue;
      }
    }

    // Résumé
    console.log('\n📊 Résumé de l\'import:');
    console.log(`   Editors: ${editorsCreated} créés, ${editorsUpdated} mis à jour`);
    console.log(`   Solutions: ${solutionsCreated} créées, ${solutionsUpdated} mises à jour`);
    console.log(`   Hostings: ${hostingsCreated} créés, ${hostingsUpdated} mis à jour`);
    console.log(`   Environments: ${environmentsCreated} créés, ${environmentsUpdated} mis à jour`);

    // Fermeture de la connexion
    await mongoose.connection.close();
    console.log('✅ Import terminé avec succès');

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'import:', error);
    process.exit(1);
  }
}

// Exécution du script
importCSV();

