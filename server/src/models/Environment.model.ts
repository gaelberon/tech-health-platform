import { Schema, model, Document, Types } from 'mongoose';

const BackupSchema = new Schema({
    exists: { type: Boolean, required: true },
    schedule: { type: String },
    rto: { type: Number }, // RTO en heures
    rpo: { type: Number }, // RPO en heures
    restoration_test_frequency: { type: String, enum: ['annual', 'quarterly', 'never'] } // Sous-champ de backup
}, { _id: false });

export interface IEnvironment extends Document {
    // Champs P1 (Architecture) qui doivent être présents :
    envId: string; // Clé Primaire (P1)
    solutionId: Schema.Types.ObjectId; // FK vers Solution
    // solutionId: Types.ObjectId;
    hostingId: string; // FK vers Hosting (P1)
    env_type: 'production' | 'test' | 'dev' | 'backup'; // P1
    // env_type: EnvType;
    tech_stack: string[]; // Languages, BDD, framework
    data_types: ('Personal' | 'Sensitive' | 'Health' | 'Financial' | 'Synthetic')[] | string[];
    redundancy: 'none' | 'minimal' | 'geo-redundant' | 'high'; // P1
    // redundancy: RedundancyType;
    backup: {
        exists: boolean,
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

    // ... Autres champs D.D.

    // Ajout ou vérification de la présence de ce champ P3 :
    sla_offered: string; // Doit être de type string ou string | null
    
    // Champs d'archivage
    archived?: boolean;
    archivedAt?: Date;
    archivedBy?: string; // userId de l'admin/supervisor qui a archivé
}

const EnvironmentSchema = new Schema<IEnvironment>({
    envId: { type: String, required: true, unique: true }, // PK
    solutionId: { type: Schema.Types.ObjectId, ref: 'Solution', required: true },
    hostingId: { type: String, required: true }, // FK vers Hosting (string, pas ObjectId)
    env_type: { type: String, enum: ['production', 'test', 'dev', 'backup'], required: true },
    data_types: [{ type: String }], // Array of strings
    deployment_type: { type: String, enum: ['monolith', 'microservices', 'hybrid'] },
    virtualization: { type: String, enum: ['physical', 'VM', 'container', 'k8s'] },
    tech_stack: [{ type: String }],
    redundancy: { type: String, enum: ['none', 'minimal', 'geo-redundant', 'high'], required: true },
    backup: { type: BackupSchema, required: true }, // Utilisation du schéma imbriqué
    disaster_recovery_plan: { type: String, enum: ['Documented', 'Tested', 'None'] }, // Donnée DD
    db_scaling_mechanism: { type: String },
    sla_offered: { type: String },
    
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