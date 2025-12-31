import { Schema, model, Document, Types } from 'mongoose';

// Types Enum pour la notation de sécurité
type AuthType = 'None' | 'Passwords' | 'MFA' | 'SSO'; // P1
type PatchingFreq = 'ad_hoc' | 'scheduled' | 'automated'; // P2
type PentestFreq = 'never' | 'annual' | 'quarterly'; // P3
type VulnMgmt = 'none' | 'manual' | 'automated'; // P2

// Structure pour le chiffrement
interface IEncryption {
    in_transit: boolean; // P1
    at_rest: boolean; // P1
    details?: string; // Information DD
}

// 1. Définition de l'Interface TypeScript pour l'entité SecurityProfile
export interface ISecurityProfile extends Document {
    secId: string; // Identifiant unique (PK) [3]
    envId: Types.ObjectId; // Lien vers l'environnement (FK) [3]
    
    // Champs P1 (Scoring Sécurité)
    auth: AuthType; // Authentification (MFA, SSO, etc.) [3, 4]
    encryption: IEncryption; // Chiffrement (in_transit, at_rest) [3, 4]
    
    // Champs P2 et P3 (Gestion des risques)
    patching: PatchingFreq; // Gestion des patchs [4]
    pentest_freq: PentestFreq; // Fréquence des tests d'intrusion [3, 4]
    vuln_mgmt: VulnMgmt; // Gestion des vulnérabilités [3, 4]
    access_control: string; // Contrôle d'accès (e.g., PAM used?) [4]
    
    // Champs DD spécifiques (3.a, 3.b, 3.c, 3.d)
    internal_audits_recent: string; // Audits internes/externes récents et mesures prises [3]
    centralized_monitoring: boolean; // Monitoring centralisé pour les événements de sécurité [3]
    pentest_results_summary: string; // Résumé des derniers résultats de pentests [3]
    known_security_flaws: string; // Failles de sécurité actuellement connues [3]
    incident_reporting_process: string; // Processus de signalement et de résolution des incidents [3]
    
    // Champs AISA supplémentaires
    change_management?: string; // AISA 5.2.1 - Changes managed
    malware_protection?: string; // AISA 5.2.3 - IT systems protected against malware
    key_management?: string; // ISO 27001 A.10.2 / AISA 5.1.2 - Key management for cryptographic controls
}

// 2. Définition du Schéma Mongoose
const SecurityProfileSchema = new Schema<ISecurityProfile>({
    
    // Clé Primaire (P1)
    secId: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    
    // Clé Étrangère vers Environment (Relation 1:1)
    envId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Environment', 
        required: true,
        unique: true // Un seul profil de sécurité par environnement
    },

    // ------------------ P1 & P2 (Critères de Scoring) ------------------
    
    auth: { 
        type: String, 
        enum: ['None', 'Passwords', 'MFA', 'SSO'], 
        required: true,
        description: "Authentification (P1, DD 3.a.1, 9.b.1, AISA 4.1.1, 4.1.2). Critère de scoring Security +4 pts pour MFA/SSO." 
    },
    
    encryption: {
        type: Object, // Peut être défini comme un sous-schéma strict si l'on souhaite plus de contrôle
        in_transit: { 
            type: Boolean, 
            required: true,
            description: "Chiffrement en transit (P1, DD 3.a.1, AISA 5.1.1, 5.1.2, ISO 27001 A.10.1, A.10.2)"
        },
        at_rest: { 
            type: Boolean, 
            required: true,
            description: "Chiffrement au repos (P1, DD 3.a.1, AISA 5.1.1, 5.1.2, ISO 27001 A.10.1, A.10.2)"
        },
        details: { 
            type: String, 
            required: false,
            description: "Détails du chiffrement (DD 3.a.1, AISA 5.1.1, 5.1.2, ISO 27001 A.10.1, A.10.2)"
        }
    },

    patching: { 
        type: String, 
        enum: ['ad_hoc', 'scheduled', 'automated'], 
        required: true,
        description: "Gestion des mises à jour (P2, DD 3.b.2, AISA 5.2.5, 12.1, 12.2). Critère de scoring Security +4 pts pour Automated."
    },
    
    pentest_freq: { 
        type: String, 
        enum: ['never', 'annual', 'quarterly'], 
        required: true,
        description: "Fréquence des tests d'intrusion (P3, DD 3.c.1, AISA 5.2.6, ISO 27001 A.12.7)" 
    },
    
    vuln_mgmt: { 
        type: String, 
        enum: ['none', 'manual', 'automated'], 
        required: true,
        description: "Gestion des vulnérabilités (P2, DD 3.b.2, AISA 5.2.5, ISO 27001 A.12.1, A.12.2, A.12.3)"
    },

    access_control: {
        type: String,
        required: false,
        description: "Contrôle d'accès (e.g., utilisation de PAM) (P2, DD 9.b.2, AISA 4.1.3, 4.2.1, ISO 27001 A.9.1, A.9.2, A.9.5)"
    },

    // ------------------ Champs DD (Information détaillée) ------------------
    
    internal_audits_recent: {
        type: String,
        required: false,
        description: "Audits internes ou externes récents et mesures prises (DD 3.c.2, AISA 1.5.2, ISO 27001 A.18.1, A.18.2)"
    },
    
    centralized_monitoring: {
        type: Boolean,
        required: false,
        description: "Monitoring centralisé pour les événements de sécurité (DD 3.a.2, AISA 5.2.4, ISO 27001 A.12.4, A.12.5)"
    },
    
    pentest_results_summary: {
        type: String,
        required: false,
        description: "Résumé des derniers résultats de tests d'intrusion (DD 3.c.1, AISA 5.2.6, ISO 27001 A.12.7)"
    },
    
    known_security_flaws: {
        type: String,
        required: false,
        description: "Failles de sécurité actuellement connues (DD 3.b.1, AISA 5.2.5, ISO 27001 A.12.1, A.12.2, A.12.3)"
    },
    
    incident_reporting_process: {
        type: String,
        required: false,
        description: "Processus de signalement et de résolution des incidents (DD 3.b.3, 5.a.1, AISA 1.6.1, 1.6.2, ISO 27001 A.16.1, A.16.2, A.16.3)"
    },
    
    // Champs AISA supplémentaires
    change_management: {
        type: String,
        required: false,
        description: "Gestion des changements (AISA 5.2.1)"
    },
    malware_protection: {
        type: String,
        required: false,
        description: "Protection des systèmes IT contre les malwares (AISA 5.2.3)"
    },
    key_management: {
        type: String,
        required: false,
        description: "Gestion des clés cryptographiques (ISO 27001 A.10.2 / AISA 5.1.2)"
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// 3. Exportation du Modèle
export const SecurityProfileModel = model<ISecurityProfile>('SecurityProfile', SecurityProfileSchema, 'securityprofiles');