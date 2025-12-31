import { Schema, model, Document } from 'mongoose';

// 1. Définir l'interface TypeScript (optionnel mais fortement recommandé avec TS)
export interface IEditor extends Document {
    editorId: string;
    name: string;
    country: string;
    size: 'Micro' | 'SME' | 'Mid' | 'Enterprise';
    business_criticality: 'Low' | 'Medium' | 'High' | 'Critical';
    internal_it_systems: string[]; // Donnée DD
    it_security_strategy: string[]; // Donnée DD - Array de stratégies
    contracts_for_review: string[]; // Donnée DD (stockée comme texte libre "Type - Résumé")
    
    // Champs AISA - Organisation et Gouvernance
    information_security_policy?: string; // AISA 1.1.1
    information_security_roles?: string; // AISA 1.2.2
    information_security_in_projects?: string; // AISA 1.2.3
    external_it_service_provider_responsibilities?: string; // AISA 1.2.4
    external_it_service_evaluation?: string; // AISA 1.3.3 - Only evaluated and approved external IT services are used
    information_security_risk_management?: string; // AISA 1.4.1
    information_security_compliance_procedures?: string; // AISA 1.5.1 - Compliance with information security in procedures and processes
    isms_reviewed_by_independent_authority?: string; // AISA 1.5.2
    security_incident_management?: string; // AISA 1.6.1, 1.6.2, 1.6.3
    employee_qualification_for_sensitive_work?: string; // AISA 2.1.1
    staff_contractually_bound_to_security_policies?: string; // AISA 2.1.2
    security_awareness_training?: string; // AISA 2.1.3
    mobile_work_policy?: string; // AISA 2.1.4
    supplier_security_management?: string; // AISA 6.1.1, 6.1.2
    compliance_with_regulatory_provisions?: string; // AISA 7.1.1
    personal_data_protection?: string; // AISA 7.1.2
}

// 2. Définir le Schéma Mongoose
const EditorSchema = new Schema<IEditor>({
    editorId: { type: String, required: true, unique: true }, // PK
    name: { type: String, required: true }, // P1
    country: { type: String, required: false }, // P2
    size: { type: String, enum: ['Micro', 'SME', 'Mid', 'Enterprise'], required: false }, // P2
    business_criticality: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true }, // P1

    // Nouveaux champs DD
    // Note: internal_it_systems a été remplacé par l'entité Asset (AISA 3.1)
    it_security_strategy: [{ 
        type: String,
        description: "Stratégies de sécurité IT (DD 9.a.2, AISA 1.2.1, 1.4.1, 5.1.1, 5.2.1)"
    }], // Array de strings - Stratégies de sécurité IT
    contracts_for_review: [{ 
        type: String,
        description: "Contrats à réviser (DD 4.c.1, AISA 6.1.1, 6.1.2)"
    }], // Stockage texte libre "Type - Résumé"
    
    // Champs AISA - Organisation et Gouvernance
    information_security_policy: { 
        type: String, 
        required: false,
        description: "Politique de sécurité de l'information (AISA 1.1.1)"
    },
    information_security_roles: { 
        type: String, 
        required: false,
        description: "Rôles et responsabilités en sécurité de l'information (AISA 1.2.2)"
    },
    information_security_in_projects: { 
        type: String, 
        required: false,
        description: "Considération des exigences de sécurité dans les projets (AISA 1.2.3)"
    },
    external_it_service_provider_responsibilities: { 
        type: String, 
        required: false,
        description: "Définition des responsabilités entre fournisseurs IT externes et l'organisation (AISA 1.2.4)"
    },
    external_it_service_evaluation: { 
        type: String, 
        required: false,
        description: "Évaluation et approbation des services IT externes utilisés (AISA 1.3.3)"
    },
    information_security_risk_management: { 
        type: String, 
        required: false,
        description: "Gestion des risques de sécurité de l'information (AISA 1.4.1)"
    },
    information_security_compliance_procedures: { 
        type: String, 
        required: false,
        description: "Conformité avec la sécurité de l'information dans les procédures et processus (AISA 1.5.1)"
    },
    isms_reviewed_by_independent_authority: { 
        type: String, 
        required: false,
        description: "ISMS révisé par une autorité indépendante (AISA 1.5.2)"
    },
    security_incident_management: { 
        type: String, 
        required: false,
        description: "Gestion des incidents de sécurité (AISA 1.6.1, 1.6.2, 1.6.3)"
    },
    employee_qualification_for_sensitive_work: { 
        type: String, 
        required: false,
        description: "Qualification des employés pour travaux sensibles (AISA 2.1.1)"
    },
    staff_contractually_bound_to_security_policies: { 
        type: String, 
        required: false,
        description: "Personnel contractuellement lié aux politiques de sécurité (AISA 2.1.2)"
    },
    security_awareness_training: { 
        type: String, 
        required: false,
        description: "Sensibilisation et formation à la sécurité (AISA 2.1.3)"
    },
    mobile_work_policy: { 
        type: String, 
        required: false,
        description: "Politique de télétravail (AISA 2.1.4)"
    },
    supplier_security_management: { 
        type: String, 
        required: false,
        description: "Gestion de la sécurité des fournisseurs et partenaires (AISA 6.1.1, 6.1.2)"
    },
    compliance_with_regulatory_provisions: { 
        type: String, 
        required: false,
        description: "Conformité aux dispositions réglementaires et contractuelles (AISA 7.1.1)"
    },
    personal_data_protection: { 
        type: String, 
        required: false,
        description: "Protection des données personnelles (AISA 7.1.2)"
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// 3. Exporter le Modèle
export const EditorModel = model<IEditor>('Editor', EditorSchema, 'editors');