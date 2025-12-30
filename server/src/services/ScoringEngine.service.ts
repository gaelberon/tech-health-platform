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
import { HostingModel, IHosting } from '../models/Hosting.model.js';
import { ICalculationDetails, ICalculationCategory, ICalculationComponent } from '../models/ScoringSnapshot.model.js';

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
     * Calcule le score de la catégorie Sécurité (30%) avec détails. [4]
     * Basé sur SecurityProfile (P1/P2) [7, 8].
     */
    private calculateSecurityScoreWithDetails(securityProfile: ISecurityProfile): { score: number; details: ICalculationCategory } {
        let score = 0;
        const components: ICalculationComponent[] = [];
        
        // 1. Authentification forte (MFA/SSO) : Max 4 points [4]
        let authScore = 0;
        let authReason = '';
        switch (securityProfile.auth) {
            case 'SSO': 
                authScore = 4; 
                authReason = 'SSO configuré';
                break;
            case 'MFA': 
                authScore = 4; 
                authReason = 'MFA configuré';
                break;
            case 'Passwords': 
                authScore = 2; 
                authReason = 'Authentification par mots de passe uniquement';
                break;
            case 'None': 
                authScore = 0; 
                authReason = 'Aucune authentification configurée';
                break;
            default: 
                authScore = 0; 
                authReason = `Type d'authentification non reconnu: ${securityProfile.auth}`;
                break;
        }
        score += authScore;
        components.push({ name: 'Authentification', value: authScore, max: 4, reason: authReason });

        // 2. Chiffrement (in_transit & at_rest) : Max 4 points [4]
        let encryptionScore = 0;
        let encryptionReason = '';
        if (securityProfile.encryption.in_transit && securityProfile.encryption.at_rest) {
            encryptionScore = 4;
            encryptionReason = 'Chiffrement en transit ET au repos configurés';
        } else if (securityProfile.encryption.in_transit || securityProfile.encryption.at_rest) {
            encryptionScore = 2;
            encryptionReason = securityProfile.encryption.in_transit 
                ? 'Chiffrement en transit uniquement'
                : 'Chiffrement au repos uniquement';
        } else {
            encryptionScore = 0;
            encryptionReason = 'Aucun chiffrement configuré';
        }
        score += encryptionScore;
        components.push({ name: 'Chiffrement', value: encryptionScore, max: 4, reason: encryptionReason });

        // 3. Patching : Max 4 points [4]
        let patchingScore = 0;
        let patchingReason = '';
        switch (securityProfile.patching) {
            case 'automated': 
                patchingScore = 4; 
                patchingReason = 'Patching automatisé';
                break;
            case 'scheduled': 
                patchingScore = 2; 
                patchingReason = 'Patching planifié';
                break;
            case 'ad_hoc': 
                patchingScore = 0; 
                patchingReason = 'Patching ad-hoc (non planifié)';
                break;
            default: 
                patchingScore = 0; 
                patchingReason = `Type de patching non reconnu: ${securityProfile.patching || 'N/A'}`;
                break;
        }
        score += patchingScore;
        components.push({ name: 'Gestion des patches', value: patchingScore, max: 4, reason: patchingReason });

        // 4. Pentest & vuln scans (pentest_freq) : Max 4 points [4]
        let pentestScore = 0;
        let pentestReason = '';
        switch (securityProfile.pentest_freq) {
            case 'quarterly': 
                pentestScore = 4; 
                pentestReason = 'Tests d\'intrusion trimestriels';
                break;
            case 'annual': 
                pentestScore = 2; 
                pentestReason = 'Tests d\'intrusion annuels';
                break;
            case 'never': 
                pentestScore = 0; 
                pentestReason = 'Aucun test d\'intrusion effectué';
                break;
            default: 
                pentestScore = 0; 
                pentestReason = `Fréquence de pentest non reconnue: ${securityProfile.pentest_freq || 'N/A'}`;
                break;
        }
        score += pentestScore;
        components.push({ name: 'Tests d\'intrusion', value: pentestScore, max: 4, reason: pentestReason });
        
        // 5. Access control & PAM (via access_control, assumé simple boolean/string check) : Max 4 points [4]
        let accessControlScore = 0;
        let accessControlReason = '';
        if (securityProfile.centralized_monitoring) {
            accessControlScore = 4;
            accessControlReason = 'Monitoring centralisé activé';
        } else if (securityProfile.access_control) {
            accessControlScore = 2;
            accessControlReason = 'Contrôle d\'accès basique configuré';
        } else {
            accessControlScore = 0;
            accessControlReason = 'Aucun contrôle d\'accès centralisé configuré';
        }
        score += accessControlScore;
        components.push({ name: 'Contrôle d\'accès & Monitoring', value: accessControlScore, max: 4, reason: accessControlReason });

        // Normalisation (Conversion de 0-20 points en 0-100% de la catégorie)
        const normalizedScore = Math.min(score, MAX_SCORES.SECURITY) / MAX_SCORES.SECURITY * 100;
        const contribution = normalizedScore * WEIGHTS.SECURITY;

        return {
            score: normalizedScore,
            details: {
                category: 'Sécurité',
                weight: WEIGHTS.SECURITY,
                rawScore: score,
                maxRawScore: MAX_SCORES.SECURITY,
                percentage: normalizedScore,
                contribution: contribution,
                components: components
            }
        };
    }

    /**
     * Calcule le score de la catégorie Sécurité (30%). [4]
     * Basé sur SecurityProfile (P1/P2) [7, 8].
     * @deprecated Utiliser calculateSecurityScoreWithDetails à la place
     */
    private calculateSecurityScore(securityProfile: ISecurityProfile): number {
        return this.calculateSecurityScoreWithDetails(securityProfile).score;
    }


    /**
     * Calcule le score de la catégorie Résilience & Continuity (20%) avec détails. [4]
     * Basé sur Environment (P1) [9, 10].
     */
    private calculateResilienceScoreWithDetails(environment: IEnvironment): { score: number; details: ICalculationCategory } {
        let score = 0;
        const components: ICalculationComponent[] = [];

        // 1. Backup exist & RTO/RPO adéquats : Max 8 points [11]
        let backupScore = 0;
        let backupReason = '';
        if (environment.backup.exists && environment.backup.rto <= 24 && environment.backup.rpo <= 4) {
            backupScore = 8;
            backupReason = `Sauvegarde active avec RTO=${environment.backup.rto}h <= 24h et RPO=${environment.backup.rpo}h <= 4h`;
        } else if (environment.backup.exists) {
            backupScore = 4;
            const rto = environment.backup.rto || 'N/A';
            const rpo = environment.backup.rpo || 'N/A';
            backupReason = `Sauvegarde active mais RTO=${rto}h > 24h ou RPO=${rpo}h > 4h`;
        } else {
            backupScore = 0;
            backupReason = 'Aucune sauvegarde configurée';
        }
        score += backupScore;
        components.push({ name: 'Sauvegarde (Backup RTO/RPO)', value: backupScore, max: 8, reason: backupReason });

        // 2. Redundancy (P1) : Max 6 points [11]
        let redundancyScore = 0;
        let redundancyReason = '';
        switch (environment.redundancy) {
            case 'geo-redundant': 
                redundancyScore = 6; 
                redundancyReason = 'Redondance géographique configurée';
                break;
            case 'high': 
                redundancyScore = 6; 
                redundancyReason = 'Redondance élevée configurée';
                break;
            case 'minimal': 
                redundancyScore = 3; 
                redundancyReason = 'Redondance minimale configurée';
                break;
            case 'none': 
                redundancyScore = 0; 
                redundancyReason = 'Aucune redondance configurée';
                break;
            default: 
                redundancyScore = 0; 
                redundancyReason = `Type de redondance non reconnu: ${environment.redundancy || 'N/A'}`;
                break;
        }
        score += redundancyScore;
        components.push({ name: 'Redondance', value: redundancyScore, max: 6, reason: redundancyReason });
        
        // 3. SLA offered : Max 6 points (SLA >= 99.9%) [9, 11]
        let slaScore = 0;
        let slaReason = '';
        const slaString = environment.sla_offered || '';
        // Essayer de parser le premier nombre dans la chaîne (gérer "99,5%" ou "99.5%" ou "Disponibilité 99,5%")
        const slaMatch = slaString.match(/(\d+[,.]?\d*)/);
        let slaValue = 0;
        if (slaMatch && slaMatch[1]) {
            slaValue = parseFloat(slaMatch[1].replace(',', '.'));
        }
        if (slaValue >= 99.9) {
            slaScore = 6;
            slaReason = `SLA excellent: ${slaValue}% >= 99.9%`;
        } else if (slaValue >= 99.5) {
            slaScore = 3;
            slaReason = `SLA acceptable: ${slaValue}% >= 99.5% mais < 99.9%`;
        } else if (slaValue > 0) {
            slaScore = 0;
            slaReason = `SLA insuffisant: ${slaValue}% < 99.5%`;
        } else {
            slaScore = 0;
            slaReason = `SLA non défini ou non parsable: "${slaString}"`;
        }
        score += slaScore;
        components.push({ name: 'SLA offert', value: slaScore, max: 6, reason: slaReason });
        
        // Normalisation (Conversion de 0-20 points en 0-100% de la catégorie)
        const normalizedScore = Math.min(score, MAX_SCORES.RESILIENCE) / MAX_SCORES.RESILIENCE * 100;
        const contribution = normalizedScore * WEIGHTS.RESILIENCE;

        return {
            score: normalizedScore,
            details: {
                category: 'Résilience & Continuité',
                weight: WEIGHTS.RESILIENCE,
                rawScore: score,
                maxRawScore: MAX_SCORES.RESILIENCE,
                percentage: normalizedScore,
                contribution: contribution,
                components: components
            }
        };
    }

    /**
     * Calcule le score de la catégorie Résilience & Continuity (20%). [4]
     * Basé sur Environment (P1) [9, 10].
     * @deprecated Utiliser calculateResilienceScoreWithDetails à la place
     */
    private calculateResilienceScore(environment: IEnvironment): number {
        return this.calculateResilienceScoreWithDetails(environment).score;
    }

    /**
     * Calcule le score de la catégorie Observabilité & Opérations (15%) avec détails. [4]
     * Basé sur MonitoringObservability (P2) et DevelopmentMetrics (P3) [12-14].
     */
    private calculateObservabilityScoreWithDetails(
        monitoring: IMonitoringObservability, 
        metrics: IDevelopmentMetrics
    ): { score: number; details: ICalculationCategory } {
        let score = 0;
        const components: ICalculationComponent[] = [];
        
        // 1. Perf monitoring : Max 5 points [11]
        let perfMonitoringScore = 0;
        let perfMonitoringReason = '';
        if (monitoring.perf_monitoring === 'Yes') {
            perfMonitoringScore = 5;
            perfMonitoringReason = 'Monitoring de performance complet activé';
        } else if (monitoring.perf_monitoring === 'Partial') {
            perfMonitoringScore = 2;
            perfMonitoringReason = 'Monitoring de performance partiel';
        } else {
            perfMonitoringScore = 0;
            perfMonitoringReason = `Monitoring de performance: ${monitoring.perf_monitoring || 'N/A'}`;
        }
        score += perfMonitoringScore;
        components.push({ name: 'Monitoring de performance', value: perfMonitoringScore, max: 5, reason: perfMonitoringReason });

        // 2. Log centralization : Max 5 points [11]
        let logCentralizationScore = 0;
        let logCentralizationReason = '';
        if (monitoring.log_centralization === 'Yes') {
            logCentralizationScore = 5;
            logCentralizationReason = 'Centralisation des logs complète activée';
        } else if (monitoring.log_centralization === 'Partial') {
            logCentralizationScore = 2;
            logCentralizationReason = 'Centralisation des logs partielle';
        } else {
            logCentralizationScore = 0;
            logCentralizationReason = `Centralisation des logs: ${monitoring.log_centralization || 'N/A'}`;
        }
        score += logCentralizationScore;
        components.push({ name: 'Centralisation des logs', value: logCentralizationScore, max: 5, reason: logCentralizationReason });
        
        // 3. Outils modernes (Ex: Prometheus/Grafana/ELK/Datadog) : Max 5 points [11, 15]
        let toolsScore = 0;
        let toolsReason = '';
        const modernTools = ['Prometheus', 'Grafana', 'ELK Stack', 'Datadog', 'Splunk'];
        const foundModernTools = monitoring.tools.filter(tool => modernTools.includes(tool));
        if (foundModernTools.length > 0) {
            toolsScore = 5;
            toolsReason = `Outils modernes détectés: ${foundModernTools.join(', ')}`;
        } else {
            toolsScore = 0;
            toolsReason = `Aucun outil moderne détecté. Outils configurés: ${monitoring.tools.join(', ') || 'Aucun'}`;
        }
        score += toolsScore;
        components.push({ name: 'Outils de monitoring modernes', value: toolsScore, max: 5, reason: toolsReason });

        // Normalisation (Conversion de 0-15 points en 0-100% de la catégorie)
        const normalizedScore = Math.min(score, MAX_SCORES.OBSERVABILITY) / MAX_SCORES.OBSERVABILITY * 100;
        const contribution = normalizedScore * WEIGHTS.OBSERVABILITY;

        return {
            score: normalizedScore,
            details: {
                category: 'Observabilité & Opérations',
                weight: WEIGHTS.OBSERVABILITY,
                rawScore: score,
                maxRawScore: MAX_SCORES.OBSERVABILITY,
                percentage: normalizedScore,
                contribution: contribution,
                components: components
            }
        };
    }

    /**
     * Calcule le score de la catégorie Observabilité & Opérations (15%). [4]
     * Basé sur MonitoringObservability (P2) et DevelopmentMetrics (P3) [12-14].
     * @deprecated Utiliser calculateObservabilityScoreWithDetails à la place
     */
    private calculateObservabilityScore(
        monitoring: IMonitoringObservability, 
        metrics: IDevelopmentMetrics
    ): number {
        return this.calculateObservabilityScoreWithDetails(monitoring, metrics).score;
    }

    /**
     * Calcule le score de la catégorie Architecture & Scalabilité (15%) avec détails. [4]
     * Basé sur Environment (P2) et CodeBase (P2) [9, 16].
     */
    private calculateArchitectureScoreWithDetails(environment: IEnvironment, codeBase: ICodeBase): { score: number; details: ICalculationCategory } {
        let score = 0;
        const components: ICalculationComponent[] = [];

        // 1. Deployment type (microservices/k8s) : Max 6 points [11]
        let deploymentScore = 0;
        let deploymentReason = '';
        if (environment.deployment_type === 'microservices' && environment.virtualization === 'k8s') {
            deploymentScore = 6;
            deploymentReason = 'Architecture microservices avec Kubernetes';
        } else if (environment.virtualization === 'VM') {
            deploymentScore = 3;
            deploymentReason = 'Virtualisation par machines virtuelles';
        } else if (environment.deployment_type === 'monolith') {
            deploymentScore = 1;
            deploymentReason = 'Architecture monolithique';
        } else {
            deploymentScore = 0;
            deploymentReason = `Type de déploiement: ${environment.deployment_type || 'N/A'}, Virtualisation: ${environment.virtualization || 'N/A'}`;
        }
        score += deploymentScore;
        components.push({ name: 'Type de déploiement & Virtualisation', value: deploymentScore, max: 6, reason: deploymentReason });

        // 2. Scaling capability (db_scaling_mechanism/network_security_mechanisms - Horizontale vs Verticale) : Max 6 points [10, 11]
        let scalingScore = 0;
        let scalingReason = '';
        const scalingMechanism = environment.db_scaling_mechanism || '';
        if (typeof scalingMechanism === 'string' && scalingMechanism.includes('Horizontal')) {
            scalingScore = 6;
            scalingReason = 'Scaling horizontal configuré';
        } else if (typeof scalingMechanism === 'string' && scalingMechanism.includes('Verticale')) {
            scalingScore = 3;
            scalingReason = 'Scaling vertical configuré';
        } else {
            scalingScore = 0;
            scalingReason = `Mécanisme de scaling: ${scalingMechanism || 'Aucun'}`;
        }
        score += scalingScore;
        components.push({ name: 'Capacité de scaling', value: scalingScore, max: 6, reason: scalingReason });

        // 3. Qualité du code (Documentation/Dette technique) : Max 3 points [11]
        let codeQualityScore = 0;
        let codeQualityReason = '';
        if (codeBase.documentation_level === 'High' && codeBase.technical_debt_known === 'Low') {
            codeQualityScore = 3;
            codeQualityReason = 'Documentation élevée et dette technique faible';
        } else {
            codeQualityScore = 0;
            codeQualityReason = `Documentation: ${codeBase.documentation_level || 'N/A'}, Dette technique: ${codeBase.technical_debt_known || 'N/A'}`;
        }
        score += codeQualityScore;
        components.push({ name: 'Qualité du code (Documentation & Dette technique)', value: codeQualityScore, max: 3, reason: codeQualityReason });

        // Normalisation (Conversion de 0-15 points en 0-100% de la catégorie)
        const normalizedScore = Math.min(score, MAX_SCORES.ARCHITECTURE) / MAX_SCORES.ARCHITECTURE * 100;
        const contribution = normalizedScore * WEIGHTS.ARCHITECTURE;

        return {
            score: normalizedScore,
            details: {
                category: 'Architecture & Scalabilité',
                weight: WEIGHTS.ARCHITECTURE,
                rawScore: score,
                maxRawScore: MAX_SCORES.ARCHITECTURE,
                percentage: normalizedScore,
                contribution: contribution,
                components: components
            }
        };
    }

    /**
     * Calcule le score de la catégorie Architecture & Scalabilité (15%). [4]
     * Basé sur Environment (P2) et CodeBase (P2) [9, 16].
     * @deprecated Utiliser calculateArchitectureScoreWithDetails à la place
     */
    private calculateArchitectureScore(environment: IEnvironment, codeBase: ICodeBase): number {
        return this.calculateArchitectureScoreWithDetails(environment, codeBase).score;
    }

    /**
     * Calcule le score de la catégorie Conformité & Certifications (20%) avec détails. [4]
     * Basé sur Hosting (P2) et les données sensibles (P1) [8, 9].
     * Le barème est basé sur les certifications critiques (ISO27001, HDS, SOC2, etc.) [6, 8].
     */
    private calculateComplianceScoreWithDetails(environment: IEnvironment, hosting: IHosting | null): { score: number; details: ICalculationCategory } {
        let score = 0;
        const components: ICalculationComponent[] = [];
        
        // 1. Certifications importantes : Max 16 points [6]
        const rawCerts = hosting?.certifications || [];
        const certifications = rawCerts.map(c => c.toUpperCase());
        
        let certScore = 0;
        const foundCerts: string[] = [];
        
        if (certifications.some(c => c.includes('ISO 27001'))) {
            certScore += 8;
            foundCerts.push('ISO 27001');
        }
        if (certifications.some(c => c.includes('HDS'))) {
            certScore += 8;
            foundCerts.push('HDS');
        }
        if (certifications.some(c => c.includes('SOC 2'))) {
            certScore += 6;
            foundCerts.push('SOC 2');
        }
        if (certifications.some(c => c.includes('PCI'))) {
            certScore += 4;
            foundCerts.push('PCI DSS');
        }
        if (certifications.some(c => c.includes('SOC 1'))) {
            certScore += 3;
            foundCerts.push('SOC 1');
        }
        if (certifications.some(c => c.includes('ISAE 3402'))) {
            certScore += 3;
            foundCerts.push('ISAE 3402');
        }
        
        // Cumuls plafonnés à 16 pour cette sous-section
        certScore = Math.min(certScore, 16);
        score += certScore;
        
        const certReason = foundCerts.length > 0 
            ? `Certifications détectées: ${foundCerts.join(', ')}`
            : `Aucune certification critique détectée. Certifications configurées: ${rawCerts.join(', ') || 'Aucune'}`;
        components.push({ name: 'Certifications critiques', value: certScore, max: 16, reason: certReason });

        // 2. RGPD / Données sensibles : Max 4 points [6]
        let rgpdScore = 0;
        let rgpdReason = '';
        const hasSensitiveData = environment.data_types.includes('Health') || environment.data_types.includes('Financial');
        if (hasSensitiveData) {
            const hasStrongCert = certifications.some(c => c.includes('ISO 27001') || c.includes('HDS') || c.includes('SOC 2'));
            if (hasStrongCert) {
                rgpdScore = 4;
                rgpdReason = `Données sensibles (${environment.data_types.filter(d => d === 'Health' || d === 'Financial').join(', ')}) avec certifications fortes (ISO 27001/HDS/SOC 2)`;
            } else {
                rgpdScore = 0;
                rgpdReason = `Données sensibles (${environment.data_types.filter(d => d === 'Health' || d === 'Financial').join(', ')}) mais pas de certification forte (ISO 27001/HDS/SOC 2)`;
            }
        } else {
            rgpdScore = 0;
            rgpdReason = `Pas de données sensibles (Health/Financial). Types de données: ${environment.data_types.join(', ') || 'N/A'}`;
        }
        score += rgpdScore;
        components.push({ name: 'RGPD / Données sensibles', value: rgpdScore, max: 4, reason: rgpdReason });
        
        // Normalisation (Conversion de 0-20 points en 0-100% de la catégorie)
        const normalizedScore = Math.min(score, MAX_SCORES.COMPLIANCE) / MAX_SCORES.COMPLIANCE * 100;
        const contribution = normalizedScore * WEIGHTS.COMPLIANCE;

        return {
            score: normalizedScore,
            details: {
                category: 'Conformité & Certifications',
                weight: WEIGHTS.COMPLIANCE,
                rawScore: score,
                maxRawScore: MAX_SCORES.COMPLIANCE,
                percentage: normalizedScore,
                contribution: contribution,
                components: components
            }
        };
    }

    /**
     * Calcule le score de la catégorie Conformité & Certifications (20%). [4]
     * Basé sur Hosting (P2) et les données sensibles (P1) [8, 9].
     * Le barème est basé sur les certifications critiques (ISO27001, HDS, SOC2, etc.) [6, 8].
     * @deprecated Utiliser calculateComplianceScoreWithDetails à la place
     */
    private calculateComplianceScore(environment: IEnvironment, hosting: IHosting | null): number {
        return this.calculateComplianceScoreWithDetails(environment, hosting).score;
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
     * Génère un rapport détaillé du calcul du score en langage naturel, basé sur les calculationDetails.
     * Ce rapport explique la formule, son application et les résultats obtenus.
     */
    private generateCalculationReport(details: ICalculationDetails): string {
        let report = '';
        
        // 1. Introduction : Rappel de la logique de scoring
        report += '=== RAPPORT DE CALCUL DU SCORE ===\n\n';
        report += '1. LOGIQUE DE SCORING\n';
        report += 'Le score global est calculé comme la moyenne pondérée de 5 catégories (toutes sur 0-100%) :\n';
        details.categories.forEach((cat, idx) => {
            report += `   - ${cat.category} (${(cat.weight * 100).toFixed(0)}%)\n`;
        });
        report += `\nLe niveau de risque est déterminé selon les seuils suivants :\n`;
        report += `   - >= 85 : Low (risque faible)\n`;
        report += `   - 70-84 : Medium (risque moyen)\n`;
        report += `   - 50-69 : High (risque élevé)\n`;
        report += `   - < 50 : Critical (risque critique)\n\n`;
        
        // 2. Détail par catégorie
        report += '2. DÉTAIL PAR CATÉGORIE\n\n';
        details.categories.forEach((category, catIdx) => {
            report += `${String.fromCharCode(97 + catIdx)}) ${category.category} (${(category.weight * 100).toFixed(0)}% du score global)\n`;
            report += `   Calculé sur ${category.maxRawScore} points maximum.\n`;
            report += `   Score brut obtenu : ${category.rawScore.toFixed(1)}/${category.maxRawScore} points.\n`;
            report += `   Pourcentage de la catégorie : ${category.percentage.toFixed(1)}%.\n`;
            report += `   Contribution au score global : ${category.contribution.toFixed(1)} points (${category.percentage.toFixed(1)}% × ${(category.weight * 100).toFixed(0)}%).\n\n`;
            
            report += `   Composantes évaluées :\n`;
            category.components.forEach((component, compIdx) => {
                const status = component.value === component.max ? '✓' : 
                              component.value === 0 ? '✗' : '⚠';
                report += `   ${compIdx + 1}. ${component.name} : ${component.value.toFixed(1)}/${component.max} points ${status}\n`;
                report += `      → ${component.reason}\n`;
            });
            report += '\n';
        });
        
        // 3. Synthèse du calcul
        report += '3. SYNTHÈSE DU CALCUL\n';
        report += `Score global = `;
        const contributions = details.categories.map(cat => `${cat.contribution.toFixed(1)}`);
        report += contributions.join(' + ') + ` = ${details.globalScore.toFixed(1)}/100\n\n`;
        
        report += 'Détail des contributions :\n';
        details.categories.forEach(cat => {
            report += `   - ${cat.category} : ${cat.percentage.toFixed(1)}% × ${(cat.weight * 100).toFixed(0)}% = ${cat.contribution.toFixed(1)} points\n`;
        });
        report += `\n   TOTAL = ${details.globalScore.toFixed(1)}/100\n\n`;
        
        // 4. Niveau de risque
        report += '4. NIVEAU DE RISQUE\n';
        report += `Score global : ${details.globalScore.toFixed(1)}/100\n`;
        report += `Niveau de risque déterminé : ${details.riskLevel}\n`;
        
        // 5. Points forts et points à améliorer
        report += '\n5. ANALYSE\n';
        const strongCategories = details.categories.filter(cat => cat.percentage >= 70);
        const weakCategories = details.categories.filter(cat => cat.percentage < 50);
        
        if (strongCategories.length > 0) {
            report += 'Points forts :\n';
            strongCategories.forEach(cat => {
                report += `   - ${cat.category} : ${cat.percentage.toFixed(1)}% (${cat.rawScore.toFixed(1)}/${cat.maxRawScore} points)\n`;
            });
            report += '\n';
        }
        
        if (weakCategories.length > 0) {
            report += 'Points à améliorer :\n';
            weakCategories.forEach(cat => {
                report += `   - ${cat.category} : ${cat.percentage.toFixed(1)}% (${cat.rawScore.toFixed(1)}/${cat.maxRawScore} points)\n`;
                // Identifier les composantes à 0 point
                const zeroComponents = cat.components.filter(comp => comp.value === 0);
                if (zeroComponents.length > 0) {
                    report += `     Composantes non satisfaites : ${zeroComponents.map(c => c.name).join(', ')}\n`;
                }
            });
        }
        
        return report;
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
        const hosting = environment ? await HostingModel.findOne({ hostingId: environment.hostingId }).exec() : null;

        // 2. Vérification de l'existence des données essentielles
        if (!environment || !securityProfile || !monitoring || !codeBase || !metrics) {
            console.warn(`Données manquantes pour le scoring de l'environnement ${envId}. Calcul annulé.`);
            // Vous pourriez ici enregistrer un snapshot avec un score critique ou 0.
            return null; 
        }

        // 3. Calcul des sous-scores avec détails (Résultats en % de la catégorie, i.e., 0-100)
        const securityResult = this.calculateSecurityScoreWithDetails(securityProfile);
        const resilienceResult = this.calculateResilienceScoreWithDetails(environment);
        const observabilityResult = this.calculateObservabilityScoreWithDetails(monitoring, metrics);
        const architectureResult = this.calculateArchitectureScoreWithDetails(environment, codeBase);
        const complianceResult = this.calculateComplianceScoreWithDetails(environment, hosting);

        const securityScore = securityResult.score;
        const resilienceScore = resilienceResult.score;
        const observabilityScore = observabilityResult.score;
        const architectureScore = architectureResult.score;
        const complianceScore = complianceResult.score;

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

        // 7. Construction des détails de calcul
        const calculationDetails: ICalculationDetails = {
            categories: [
                securityResult.details,
                resilienceResult.details,
                observabilityResult.details,
                architectureResult.details,
                complianceResult.details
            ],
            globalScore: global_score,
            riskLevel: risk_level
        };

        // 8. Génération du rapport détaillé du calcul
        const calculationReport = this.generateCalculationReport(calculationDetails);

        // 9. Création et enregistrement du snapshot (P1)
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
            scores: categoryScores, // Utilisation de l'objet complet
            calculationDetails: calculationDetails, // Détails détaillés du calcul
            calculationReport: calculationReport // Rapport détaillé du calcul en langage naturel
        };

        const newSnapshot = await ScoringSnapshotModel.create(snapshotInput);

        console.log(`✅ ScoringSnapshot enregistré pour Env ${envId}. Score: ${global_score}, Risque: ${risk_level}`);
        
        // Le Moteur de Scoring est le point d'ancrage de la traçabilité [5].
        return newSnapshot;
    }
}