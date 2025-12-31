import { Schema, model, Document, Types } from 'mongoose';

const BackupSchema = new Schema({
    exists: { 
        type: Boolean, 
        required: true,
        description: "Existence de sauvegarde (DD 2.b.2, 5.c.3, AISA 5.2.8, 5.2.9)"
    },
    schedule: { 
        type: String,
        description: "Planification des sauvegardes (DD 2.b.2, 5.c.3, AISA 5.2.8, 5.2.9)"
    },
    rto: { 
        type: Number,
        description: "Recovery Time Objective en heures (DD 2.b.2, 5.c.3, AISA 5.2.8, 5.2.9)"
    }, // RTO en heures
    rpo: { 
        type: Number,
        description: "Recovery Point Objective en heures (DD 2.b.2, 5.c.3, AISA 5.2.8, 5.2.9)"
    }, // RPO en heures
    restoration_test_frequency: { 
        type: String, 
        enum: ['annual', 'quarterly', 'never'],
        description: "Fréquence des tests de restauration (DD 2.b.2, 5.c.3, AISA 5.2.8, 5.2.9)"
    } // Sous-champ de backup
}, { _id: false });

export interface IEnvironment extends Document {
    // Champs P1 (Architecture) qui doivent être présents :
    envId: string; // Clé Primaire (P1)
    solutionId: Schema.Types.ObjectId; // FK vers Solution
    // solutionId: Types.ObjectId;
    hostingId: string; // FK vers Hosting (P1)
    env_type: string; // P1 - Validé contre la Value List "ENVIRONMENT_TYPES"
    // env_type: EnvType;
    tech_stack: string[]; // Languages, BDD, framework
    data_types: ('Personal' | 'Sensitive' | 'Health' | 'Financial' | 'Synthetic')[] | string[];
    redundancy: 'none' | 'minimal' | 'geo-redundant' | 'high'; // P1
    // redundancy: RedundancyType;
    backup: {
        exists: boolean,
        schedule?: string,
        rto: number,
        rpo: number,
        restoration_test_frequency: string
    }; // Objet imbriqué
    // backup: Backup; // Inclut rto et rpo (qui sont bien des nombres)
    disaster_recovery_plan: string; // Documenté/Testé

    // Champs P2 (Architecture) qui doivent être présents :
    deployment_type: 'monolith' | 'microservices' | 'hybrid'; // [2]
    virtualization: 'physical' | 'VM' | 'container' | 'k8s'; // [2]
    db_scaling_mechanism: 'Verticale' | 'Horizontale' | 'Non supportée' | string;
    network_security_mechanisms?: string[];
    security_zones_managed?: string; // AISA 3.1.1 - Security zones managed
    network_services_requirements?: string; // AISA 5.3.2 - Requirements for network services defined
    information_assets_removal_policy?: string; // AISA 5.3.3 - Return and secure removal of information assets
    shared_external_it_services_protection?: string; // AISA 5.3.4 - Information protected in shared external IT services

    // ... Autres champs D.D.

    // Ajout ou vérification de la présence de ce champ P3 :
    sla_offered: string; // Doit être de type string ou string | null
    
    // Champs d'archivage
    archived?: boolean;
    archivedAt?: Date;
    archivedBy?: string; // userId de l'admin/supervisor qui a archivé
}

const EnvironmentSchema = new Schema<IEnvironment>({
    envId: { 
        type: String, 
        required: true, 
        unique: true,
        description: "Identifiant unique de l'environnement (P1)"
    }, // PK
    solutionId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Solution', 
        required: true,
        description: "Référence vers la solution (P1)"
    },
    hostingId: { 
        type: String, 
        required: true,
        description: "Référence vers l'hébergement (P1)"
    }, // FK vers Hosting (string, pas ObjectId)
    // env_type n'a plus de contrainte d'enum stricte pour permettre des valeurs dynamiques depuis les Value Lists
    // La validation est effectuée côté GraphQL resolver contre la Value List "ENVIRONMENT_TYPES"
    env_type: { 
        type: String, 
        required: true,
        description: "Type d'environnement (P1, AISA 5.2.2)"
    },
    data_types: [{ 
        type: String,
        description: "Types de données traitées (P1, AISA 1.3.2, 8.2)"
    }], // Array of strings
    deployment_type: { 
        type: String, 
        enum: ['monolith', 'microservices', 'hybrid'],
        description: "Type de déploiement (P2, DD 1.b.1, AISA 5.3.1)"
    },
    virtualization: { 
        type: String, 
        enum: ['physical', 'VM', 'container', 'k8s'],
        description: "Type de virtualisation (P2, AISA 3.1.3, 3.1.4)"
    },
    tech_stack: [{ 
        type: String,
        description: "Stack technique (P2, DD 1.a.1)"
    }],
    redundancy: { 
        type: String, 
        enum: ['none', 'minimal', 'geo-redundant', 'high'], 
        required: true,
        description: "Niveau de redondance (P1, AISA 5.2.7, 5.2.8, 7.1, 7.2)"
    },
    backup: { 
        type: BackupSchema, 
        required: true,
        description: "Détails de sauvegarde (P1, DD 2.b.2, 5.c.3, AISA 5.2.8, 5.2.9, 12.3)"
    }, // Utilisation du schéma imbriqué
    disaster_recovery_plan: { 
        type: String, 
        enum: ['Documented', 'Tested', 'None'],
        description: "Plan de reprise après sinistre (DD 5.c.1, AISA 5.2.7, 5.2.8, 7.1, 12.3)"
    }, // Donnée DD
    db_scaling_mechanism: { 
        type: String,
        description: "Mécanisme de scaling de la base de données (DD 2.b.1)"
    },
    network_security_mechanisms: [{ 
        type: String,
        description: "Mécanismes de sécurité réseau (DD 2.c.2, AISA 5.2.6, 6.1, 6.2, 9.1)"
    }],
    security_zones_managed: { 
        type: String,
        required: false,
        description: "Gestion des zones de sécurité pour protéger les actifs d'information (AISA 3.1.1)"
    },
    network_services_requirements: { 
        type: String,
        required: false,
        description: "Définition des exigences pour les services réseau (AISA 5.3.2)"
    },
    information_assets_removal_policy: { 
        type: String,
        required: false,
        description: "Réglementation du retour et de la suppression sécurisée des actifs d'information depuis les services IT externes (AISA 5.3.3)"
    },
    shared_external_it_services_protection: { 
        type: String,
        required: false,
        description: "Protection de l'information dans les services IT externes partagés (AISA 5.3.4)"
    },
    sla_offered: { 
        type: String,
        description: "SLA offert (P3, DD 5.b.1)"
    },
    
    // Champs d'archivage
    archived: { 
        type: Boolean, 
        default: false, 
        index: true,
        description: "Indique si l'environnement est archivé"
    },
    archivedAt: { 
        type: Date, 
        required: false,
        description: "Date d'archivage"
    },
    archivedBy: { 
        type: String, 
        required: false,
        description: "userId de l'admin/supervisor qui a archivé"
    }
}, {
    timestamps: true
});

export const EnvironmentModel = model<IEnvironment>('Environment', EnvironmentSchema, 'environments');