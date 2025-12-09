// Fichier : /server/src/services/ScoringEngine.service.ts

// ------------------ IMPORTS ET TYPES (Basés sur le MCD) ------------------

import { Types } from 'mongoose'; 
// Import des modèles Mongoose critiques (Assurez-vous qu'ils existent)
import { SecurityProfileModel, ISecurityProfile } from '../models/SecurityProfile.model.js'; 
import { EnvironmentModel, IEnvironment } from '../models/Environment.model.js'; 
import { ScoringSnapshotModel, IScoringSnapshot } from '../models/ScoringSnapshot.model.js'; 
import { MonitoringObservabilityModel, IMonitoringObservability } from '../models/MonitoringObservability.model.js';
import { CodeBaseModel, ICodeBase } from '../models/CodeBase.model.js';
import { DevelopmentMetricsModel, IDevelopmentMetrics } from '../models/DevelopmentMetrics.model.js';

// Types d'entrée définis dans les resolvers précédents
import { CreateScoringSnapshotInput } from '../graphql/resolvers/ScoringSnapshotResolver.js'; 
// Type RiskLevel défini dans le schéma GQL
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'; 

// Définitions des pondérations (P1) [4]
const WEIGHTS = {
    SECURITY: 0.30,      // Sécurité (30%)
    RESILIENCE: 0.20,    // Résilience & Continuity (20%)
    OBSERVABILITY: 0.15, // Observabilité & Opérations (15%)
    ARCHITECTURE: 0.15,  // Architecture & Scalabilité (15%)
    COMPLIANCE: 0.20,    // Conformité & Certifications (20%)
};

// Scores maximums par catégorie [4]
const MAX_SCORES = {
    SECURITY: 20,
    RESILIENCE: 20,
    OBSERVABILITY: 15,
    ARCHITECTURE: 15,
    COMPLIANCE: 20,
};

/**
 * Interface garantissant que les cinq scores de catégorie sont toujours présents.
 * Correspond aux 'scores (object with category scores)' de ScoringSnapshot (P1) [1, 2].
 */
interface CategoryScoresStrict {
    security: number;
    resilience: number;
    observability: number;
    architecture: number; // Important : ce score n'était pas listé dans l'erreur, mais il est obligatoire pour le calcul [3]
    compliance: number;
}

// ------------------ CLASSE SCORING ENGINE ------------------

export class ScoringEngineService {

    /**
     * Calcule le score de la catégorie Sécurité (30%). [4]
     * Basé sur SecurityProfile (P1/P2) [7, 8].
     */
    private calculateSecurityScore(securityProfile: ISecurityProfile): number {
        let score = 0;
        
        // 1. Authentification forte (MFA/SSO) : Max 4 points [4]
        switch (securityProfile.auth) {
            case 'SSO': score += 4; break;
            case 'MFA': score += 4; break;
            case 'Passwords': score += 2; break;
            case 'None': score += 0; break;
            default: break;
        }

        // 2. Chiffrement (in_transit & at_rest) : Max 4 points [4]
        if (securityProfile.encryption.in_transit && securityProfile.encryption.at_rest) {
            score += 4;
        } else if (securityProfile.encryption.in_transit || securityProfile.encryption.at_rest) {
            score += 2;
        }

        // 3. Patching : Max 4 points [4]
        switch (securityProfile.patching) {
            case 'automated': score += 4; break;
            case 'scheduled': score += 2; break;
            case 'ad_hoc': score += 0; break;
            default: break;
        }

        // 4. Pentest & vuln scans (pentest_freq) : Max 4 points [4]
        switch (securityProfile.pentest_freq) {
            case 'quarterly': score += 4; break;
            case 'annual': score += 2; break;
            case 'never': score += 0; break;
            default: break;
        }
        
        // 5. Access control & PAM (via access_control, assumé simple boolean/string check) : Max 4 points [4]
        // Si access_control est mentionné comme "PAM used", ou si centralized_monitoring est true [8]:
        if (securityProfile.centralized_monitoring) {
            score += 4; 
        } else if (securityProfile.access_control) {
            score += 2;
        } else {
             score += 0;
        }

        // Normalisation (Conversion de 0-20 points en 0-100% de la catégorie)
        return Math.min(score, MAX_SCORES.SECURITY) / MAX_SCORES.SECURITY * 100;
    }


    /**
     * Calcule le score de la catégorie Résilience & Continuity (20%). [4]
     * Basé sur Environment (P1) [9, 10].
     */
    private calculateResilienceScore(environment: IEnvironment): number {
        let score = 0;

        // 1. Backup exist & RTO/RPO adéquats : Max 8 points [11]
        // Critère : RTO<=24h et RPO<=4h (pour les données P1) [9]
        // if (environment.backup.exists && environment.backup.rto_hours <= 24 && environment.backup.rpo_hours <= 4) {
        //      score += 8;
        // } else if (environment.backup.exists) {
        //     score += 4;
        // } // Si backup.exists = false, score = 0.
        // CORRECTION APPLIQUÉE : Utilisation de .rto et .rpo
        if (environment.backup.exists && environment.backup.rto <= 24 && environment.backup.rpo <= 4) {
             score += 8;
        } else if (environment.backup.exists) {
            score += 4;
        } // Si backup.exists = false, score = 0.

        // 2. Redundancy (P1) : Max 6 points [11]
        switch (environment.redundancy) {
            case 'geo-redundant': score += 6; break; 
            case 'minimal': score += 3; break;
            case 'none': score += 0; break;
            case 'high': score += 6; break; // Assumé comme geo-redundant ou supérieur
            default: break;
        }
        
        // 3. SLA offered : Max 6 points (SLA >= 99.9%) [9, 11]
        // Conversion de SLA string en float (Simplification : on suppose que '99.5%' = 99.5)
        const slaValue = parseFloat(environment.sla_offered || '0');
        if (slaValue >= 99.9) {
            score += 6;
        } else if (slaValue >= 99.5) {
            score += 3;
        } // else 0
        
        // Normalisation (Conversion de 0-20 points en 0-100% de la catégorie)
        return Math.min(score, MAX_SCORES.RESILIENCE) / MAX_SCORES.RESILIENCE * 100;
    }

    /**
     * Calcule le score de la catégorie Observabilité & Opérations (15%). [4]
     * Basé sur MonitoringObservability (P2) et DevelopmentMetrics (P3) [12-14].
     */
    private calculateObservabilityScore(
        monitoring: IMonitoringObservability, 
        metrics: IDevelopmentMetrics
    ): number {
        let score = 0;
        
        // 1. Perf monitoring : Max 5 points [11]
        if (monitoring.perf_monitoring === 'Yes') score += 5;
        else if (monitoring.perf_monitoring === 'Partial') score += 2;

        // 2. Log centralization : Max 5 points [11]
        if (monitoring.log_centralization === 'Yes') score += 5;
        else if (monitoring.log_centralization === 'Partial') score += 2;
        
        // 3. Outils modernes (Ex: Prometheus/Grafana/ELK/Datadog) : Max 5 points [11, 15]
        // Nous allons donner 5 points si au moins un outil fondamental (Catégorie A ou B) est listé [15]
        const modernTools = ['Prometheus', 'Grafana', 'ELK Stack', 'Datadog', 'Splunk'];
        if (monitoring.tools.some(tool => modernTools.includes(tool))) {
             score += 5;
        }

        // 4. Métriques de performance (basé sur DORA metrics, P3)
        // MTTR faible (< 1 heure) indique une bonne Observabilité/Opérations
        // if (metrics.mttr_hours < 1) score += 5; // Ajout d'une pondération additionnelle si les métriques sont excellentes

        // Normalisation (Conversion de 0-15 points en 0-100% de la catégorie)
        return Math.min(score, MAX_SCORES.OBSERVABILITY) / MAX_SCORES.OBSERVABILITY * 100;
    }

    /**
     * Calcule le score de la catégorie Architecture & Scalabilité (15%). [4]
     * Basé sur Environment (P2) et CodeBase (P2) [9, 16].
     */
    private calculateArchitectureScore(environment: IEnvironment, codeBase: ICodeBase): number {
        let score = 0;

        // 1. Deployment type (microservices/k8s) : Max 6 points [11]
        if (environment.deployment_type === 'microservices' && environment.virtualization === 'k8s') {
            score += 6;
        } else if (environment.virtualization === 'VM') {
            score += 3;
        } else if (environment.deployment_type === 'monolith') {
            score += 1;
        }

        // 2. Scaling capability (db_scaling_mechanism/network_security_mechanisms - Horizontale vs Verticale) : Max 6 points [10, 11]
        if (environment.db_scaling_mechanism && environment.db_scaling_mechanism.includes('Horizontal')) {
            score += 6;
        } else if (environment.db_scaling_mechanism && environment.db_scaling_mechanism.includes('Verticale')) {
            score += 3;
        }

        // 3. Qualité du code (Documentation/Dette technique) : Max 3 points [11]
        // Simplification : 3 points si documentation jugée bonne et dette technique gérée
        if (codeBase.documentation_level === 'High' && codeBase.technical_debt_known === 'Low') {
            score += 3;
        }

        // Normalisation (Conversion de 0-15 points en 0-100% de la catégorie)
        return Math.min(score, MAX_SCORES.ARCHITECTURE) / MAX_SCORES.ARCHITECTURE * 100;
    }

    /**
     * Calcule le score de la catégorie Conformité & Certifications (20%). [4]
     * Basé sur Hosting (P2) et les données sensibles (P1) [8, 9].
     * Le barème est basé sur les certifications critiques (ISO27001, HDS) [6, 8].
     */
    private calculateComplianceScore(environment: IEnvironment): number {
        let score = 0;
        
        // 1. Certifications importantes (ISO27001, HDS, SOC2) : Max 16 points [6]
        // On suppose que les certifications sont stockées dans l'entité Hosting ou SecurityProfile
        const certifications: string[] = []; // Placeholder : devrait venir de Hosting/SecurityProfile
        
        // Majelis vise ISO 27001/HDS, InterConsult est Ségur/ANS conforme [17, 18]
        if (certifications.includes('ISO 27001')) score += 8;
        if (certifications.includes('HDS')) score += 8;
        if (certifications.includes('SOC 2')) score += 6;
        if (certifications.includes('NF525')) score += 6; // Applicable à 3GWIN [17]
        
        // Cumuls plafonnés à 16 pour cette sous-section
        score = Math.min(score, 16); 

        // 2. RGPD / Data Protection Officer : Max 4 points [6]
        // Si data_types contient des données sensibles (Health, Financial) [9]
        if (environment.data_types.includes('Health') || environment.data_types.includes('Financial')) {
            // Si la conformité est assurée pour les données critiques
            // (Nous devrions chercher la Conformité dans le modèle ComplianceProfile, mais utilisons env.data_types ici)
             score += 4;
        }
        
        // Normalisation (Conversion de 0-20 points en 0-100% de la catégorie)
        return Math.min(score, MAX_SCORES.COMPLIANCE) / MAX_SCORES.COMPLIANCE * 100;
    }


    /**
     * Détermine le niveau de risque basé sur le score global. [6]
     */
    private determineRiskLevel(globalScore: number): RiskLevel {
        if (globalScore >= 85) return 'Low'; // green
        if (globalScore >= 70) return 'Medium'; // amber
        if (globalScore >= 50) return 'High'; // red
        return 'Critical'; // red with priority remediation
    }

    /**
     * Génère les notes et recommandations basées sur les sous-scores faibles. [5]
     */
    // private generateRecommendations(scores: { [key: string]: number }): string {
    private generateRecommendations(scores: CategoryScoresStrict): string {
        let notes = '';
        
        // Les accès scores.security, scores.resilience, etc. sont maintenant garantis comme number.
        // Seuil de recommandation (arbitraire: < 50% de la catégorie)
        if (scores.security < 50) { 
            notes += "Recommander pentest, MFA et patching automatique pour améliorer la sécurité (Sécurité < 50%). ";
        }
        if (scores.resilience < 50) {
            notes += "Nécessité de vérifier l'implémentation de la sauvegarde externe et la renégociation de SLA (Résilience < 50%). ";
        }
        if (scores.observability < 50) {
            notes += "Proposer la centralisation des logs et l'amélioration de l'alerting (Observabilité < 50%). ";
        }
        // Il faut inclure Architecture ici pour un scoring complet [3]
        if (scores.architecture < 50) {
             notes += "Revoir l'architecture pour supporter la scalabilité horizontale ou réduire la dette technique (Architecture < 50%). ";
        }
        if (scores.compliance < 50) {
            notes += "Prioriser l'obtention des certifications clés (HDS/ISO) ou la mise en place de la Facturation Électronique (Conformité < 50%). ";
        }
        
        return notes.trim();
    }


    /**
     * Fonction principale : Calcule le score pour un environnement et crée un ScoringSnapshot. (P1)
     * @param solutionId L'ID de la solution
     * @param envId L'ID de l'environnement (si le score est spécifique à Env)
     */
    public async calculateAndRecordScore(solutionId: Types.ObjectId, envId: Types.ObjectId) {
        
        // 1. Récupération des données critiques (P1/P2/P3)
        // Les erreurs de conversion de type entre string et ObjectId devraient être gérées dans les resolvers.
        const environment = await EnvironmentModel.findOne({ _id: envId }).exec();
        const securityProfile = await SecurityProfileModel.findOne({ envId: envId }).exec();
        const monitoring = await MonitoringObservabilityModel.findOne({ envId: envId }).exec();
        const codeBase = await CodeBaseModel.findOne({ solutionId: solutionId }).exec();
        const metrics = await DevelopmentMetricsModel.findOne({ solutionId: solutionId }).exec();

        // 2. Vérification de l'existence des données essentielles
        if (!environment || !securityProfile || !monitoring || !codeBase || !metrics) {
            console.warn(`Données manquantes pour le scoring de l'environnement ${envId}. Calcul annulé.`);
            // Vous pourriez ici enregistrer un snapshot avec un score critique ou 0.
            return null; 
        }

        // 3. Calcul des sous-scores (Résultats en % de la catégorie, i.e., 0-100)
        const securityScore = this.calculateSecurityScore(securityProfile);
        const resilienceScore = this.calculateResilienceScore(environment);
        const observabilityScore = this.calculateObservabilityScore(monitoring, metrics);
        const architectureScore = this.calculateArchitectureScore(environment, codeBase);
        // NOTE: La conformité est ici partiellement basée sur l'environnement, mais devrait être liée à ComplianceProfile.
        const complianceScore = this.calculateComplianceScore(environment); 

        // 4. Calcul du score global (Pondération) [6]
        const global_score = Math.round(
            securityScore * WEIGHTS.SECURITY +
            resilienceScore * WEIGHTS.RESILIENCE +
            observabilityScore * WEIGHTS.OBSERVABILITY +
            architectureScore * WEIGHTS.ARCHITECTURE +
            complianceScore * WEIGHTS.COMPLIANCE
        );

        // 5. Détermination du niveau de risque (P1) [6]
        const risk_level = this.determineRiskLevel(global_score);
        
        // 6. Génération des recommandations (P1) [5]
        const categoryScores: CategoryScoresStrict = { // Typage de l'objet
            security: securityScore,
            resilience: resilienceScore,
            observability: observabilityScore,
            architecture: architectureScore, // Ajout du score Architecture
            compliance: complianceScore,
        };
        const notes = this.generateRecommendations(categoryScores);

        // 7. Création et enregistrement du snapshot (P1)
        // Générer un scoreId unique et la date
        const snapshotCount = await ScoringSnapshotModel.countDocuments();
        const scoreId = `score-${String(snapshotCount + 1).padStart(6, '0')}`;
        const date = new Date();
        
        const snapshotInput: any = {
            scoreId,
            solutionId,
            envId,
            date,
            collection_type: 'snapshot', // Par défaut, sera écrasé par le script si nécessaire
            global_score,
            risk_level,
            notes,
            scores: categoryScores // Utilisation de l'objet complet
        };

        const newSnapshot = await ScoringSnapshotModel.create(snapshotInput);

        console.log(`✅ ScoringSnapshot enregistré pour Env ${envId}. Score: ${global_score}, Risque: ${risk_level}`);
        
        // Le Moteur de Scoring est le point d'ancrage de la traçabilité [5].
        return newSnapshot;
    }
}