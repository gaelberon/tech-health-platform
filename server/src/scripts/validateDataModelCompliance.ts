/**
 * Script de validation de la conformité des données en base avec le modèle de données
 * Vérifie que toutes les entités listées respectent le nouveau modèle de données AISA
 */

import mongoose from 'mongoose';
import { EditorModel } from '../models/Editor.model.js';
import { EnvironmentModel } from '../models/Environment.model.js';
import { SecurityProfileModel } from '../models/SecurityProfile.model.js';
import dotenv from 'dotenv';

dotenv.config();

// Liste des entités à vérifier
const ENTITIES_TO_CHECK = [
  'GI Informatique',
  'CSWIN/ACM2J',
  'Majélis',
  '3GWIN',
  'Equinoxe',
  'Technocarte',
  'InterConsult',
  'BG Info',
  'Cogima',
  'Inedee',
  'Mlog Capital',
];

// Champs AISA à vérifier dans Editor
const EDITOR_AISA_FIELDS = [
  'information_security_policy',
  'information_security_roles',
  'information_security_in_projects',
  'external_it_service_provider_responsibilities',
  'external_it_service_evaluation',
  'information_security_risk_management',
  'information_security_compliance_procedures',
  'isms_reviewed_by_independent_authority',
  'security_incident_management',
  'employee_qualification_for_sensitive_work',
  'staff_contractually_bound_to_security_policies',
  'security_awareness_training',
  'mobile_work_policy',
  'supplier_security_management',
  'compliance_with_regulatory_provisions',
  'personal_data_protection',
];

// Champs AISA à vérifier dans Environment
const ENVIRONMENT_AISA_FIELDS = [
  'security_zones_managed',
  'network_services_requirements',
  'information_assets_removal_policy',
  'shared_external_it_services_protection',
];

// Champs AISA à vérifier dans SecurityProfile
const SECURITY_PROFILE_AISA_FIELDS = [
  'change_management',
  'malware_protection',
  'key_management',
];

interface ValidationResult {
  editorId: string;
  editorName: string;
  hasMissingFields: boolean;
  missingFields: {
    editor: string[];
    environments: Array<{ envId: string; missingFields: string[] }>;
    securityProfiles: Array<{ secId: string; missingFields: string[] }>;
  };
}

async function validateEditorData(editorName: string): Promise<ValidationResult | null> {
  const editor = await EditorModel.findOne({ name: editorName });
  if (!editor) {
    console.log(`⚠️  Éditeur "${editorName}" non trouvé`);
    return null;
  }

  const result: ValidationResult = {
    editorId: editor.editorId,
    editorName: editor.name,
    hasMissingFields: false,
    missingFields: {
      editor: [],
      environments: [],
      securityProfiles: [],
    },
  };

  // Vérifier les champs Editor
  for (const field of EDITOR_AISA_FIELDS) {
    const value = (editor as any)[field];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      result.missingFields.editor.push(field);
      result.hasMissingFields = true;
    }
  }

  // Récupérer toutes les solutions de cet éditeur
  if (!mongoose.connection.db) {
    throw new Error('MongoDB connection not established');
  }
  
  const solutions = await mongoose.connection.db.collection('solutions').find({ editorId: editor._id }).toArray();
  
  // Pour chaque solution, récupérer ses environnements
  for (const solution of solutions) {
    const environments = await mongoose.connection.db!.collection('environments').find({ solutionId: solution._id }).toArray();
    
    for (const env of environments) {
      const envMissingFields: string[] = [];
      
      // Vérifier les champs Environment
      for (const field of ENVIRONMENT_AISA_FIELDS) {
        const value = env[field];
        if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
          envMissingFields.push(field);
        }
      }
      
      if (envMissingFields.length > 0) {
        result.missingFields.environments.push({
          envId: env.envId,
          missingFields: envMissingFields,
        });
        result.hasMissingFields = true;
      }

      // Vérifier SecurityProfile associé
      const securityProfile = await mongoose.connection.db!.collection('securityprofiles').findOne({ envId: env._id });
      if (securityProfile) {
        const secMissingFields: string[] = [];
        
        for (const field of SECURITY_PROFILE_AISA_FIELDS) {
          const value = securityProfile[field];
          if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
            secMissingFields.push(field);
          }
        }
        
        if (secMissingFields.length > 0) {
          result.missingFields.securityProfiles.push({
            secId: securityProfile.secId,
            missingFields: secMissingFields,
          });
          result.hasMissingFields = true;
        }
      }
    }
  }

  return result;
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!mongoUri || typeof mongoUri !== 'string') {
    console.error('❌ MONGODB_URI (ou MONGO_URL) non défini dans les variables d\'environnement.');
    process.exit(1);
  }

  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');

    const results: ValidationResult[] = [];

    for (const entityName of ENTITIES_TO_CHECK) {
      console.log(`\n📋 Validation de "${entityName}"...`);
      const result = await validateEditorData(entityName);
      if (result) {
        results.push(result);
        
        if (result.hasMissingFields) {
          console.log(`❌ "${entityName}" présente des champs manquants:`);
          
          if (result.missingFields.editor.length > 0) {
            console.log(`   Editor: ${result.missingFields.editor.join(', ')}`);
          }
          
          if (result.missingFields.environments.length > 0) {
            console.log(`   Environnements: ${result.missingFields.environments.length} environnement(s) avec champs manquants`);
            result.missingFields.environments.forEach(env => {
              console.log(`     - ${env.envId}: ${env.missingFields.join(', ')}`);
            });
          }
          
          if (result.missingFields.securityProfiles.length > 0) {
            console.log(`   SecurityProfiles: ${result.missingFields.securityProfiles.length} profil(s) avec champs manquants`);
            result.missingFields.securityProfiles.forEach(sec => {
              console.log(`     - ${sec.secId}: ${sec.missingFields.join(', ')}`);
            });
          }
        } else {
          console.log(`✅ "${entityName}" est conforme au modèle de données`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ DE LA VALIDATION');
    console.log('='.repeat(80));
    
    const entitiesWithMissingFields = results.filter(r => r.hasMissingFields);
    const entitiesConform = results.filter(r => !r.hasMissingFields);
    
    console.log(`\n✅ Entités conformes: ${entitiesConform.length}/${results.length}`);
    entitiesConform.forEach(r => console.log(`   - ${r.editorName}`));
    
    console.log(`\n❌ Entités avec champs manquants: ${entitiesWithMissingFields.length}/${results.length}`);
    entitiesWithMissingFields.forEach(r => {
      console.log(`   - ${r.editorName} (${r.missingFields.editor.length + r.missingFields.environments.length + r.missingFields.securityProfiles.length} groupe(s) de champs manquants)`);
    });

    console.log('\n🔌 Déconnexion de MongoDB');
    await mongoose.disconnect();

    if (entitiesWithMissingFields.length > 0) {
      console.log('\n⚠️  Certaines entités présentent des champs manquants.');
      console.log('   Ces champs sont optionnels et peuvent être remplis progressivement.');
      process.exit(0);
    } else {
      console.log('\n✅ Toutes les entités sont conformes au modèle de données');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Erreur pendant la validation:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();

