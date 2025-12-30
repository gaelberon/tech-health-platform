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
        description: "Authentification (P1). Critère de scoring Security +4 pts pour MFA/SSO." 
    },
    
    encryption: {
        type: Object, // Peut être défini comme un sous-schéma strict si l'on souhaite plus de contrôle
        in_transit: { type: Boolean, required: true }, // P1 [3]
        at_rest: { type: Boolean, required: true }, // P1 [3]
        details: { type: String, required: false } // Détails DD [3]
    },

    patching: { 
        type: String, 
        enum: ['ad_hoc', 'scheduled', 'automated'], 
        required: true,
        description: "Gestion des mises à jour (P2). Critère de scoring Security +4 pts pour Automated."
    },
    
    pentest_freq: { 
        type: String, 
        enum: ['never', 'annual', 'quarterly'], 
        required: true,
        description: "Fréquence des tests d'intrusion (P3)." 
    },
    
    vuln_mgmt: { 
        type: String, 
        enum: ['none', 'manual', 'automated'], 
        required: true,
        description: "Gestion des vulnérabilités (P2)."
    },

    access_control: {
        type: String,
        required: false,
        description: "Contrôle d'accès (e.g., utilisation de PAM) (P2)." [4]
    },

    // ------------------ Champs DD (Information détaillée) ------------------
    
    internal_audits_recent: {
        type: String,
        required: false,
        description: "Audits internes ou externes récents et mesures prises (DD 3.c.2)."
    },
    
    centralized_monitoring: {
        type: Boolean,
        required: false,
        description: "Monitoring centralisé pour les événements de sécurité (DD 3.a.2)."
    },
    
    pentest_results_summary: {
        type: String,
        required: false,
        description: "Résumé des derniers résultats de tests d'intrusion (DD 3.c.1)."
    },
    
    known_security_flaws: {
        type: String,
        required: false,
        description: "Failles de sécurité actuellement connues (DD 3.b.1)."
    },
    
    incident_reporting_process: {
        type: String,
        required: false,
        description: "Processus de signalement et de résolution des incidents (DD 3.b.3, 5.a.1)."
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// 3. Exportation du Modèle
export const SecurityProfileModel = model<ISecurityProfile>('SecurityProfile', SecurityProfileSchema, 'securityprofiles');