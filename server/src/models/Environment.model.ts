import { Schema, model, Document, Types } from 'mongoose';

const BackupSchema = new Schema({
    exists: { type: Boolean, required: true },
    schedule: { type: String },
    rto: { type: Number }, // RTO en heures
    rpo: { type: Number }, // RPO en heures
    restoration_test_frequency: { type: String, enum: ['Annual', 'Quarterly', 'Never'] } // Sous-champ de backup
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
}

const EnvironmentSchema = new Schema<IEnvironment>({
    solutionId: { type: Schema.Types.ObjectId, ref: 'Solution', required: true },
    env_type: { type: String, enum: ['production', 'test', 'dev', 'backup'], required: true },
    deployment_type: { type: String, enum: ['monolith', 'microservices', 'hybrid'] },
    tech_stack: [{ type: String }],
    redundancy: { type: String, enum: ['none', 'minimal', 'geo-redundant', 'high'] },
    backup: { type: BackupSchema, required: true }, // Utilisation du schéma imbriqué
    disaster_recovery_plan: { type: String, enum: ['Documented', 'Tested', 'None'] }, // Donnée DD
    // Les références aux collections SecurityProfile, Monitoring, Costs peuvent être gérées comme des FK, ou des sous-documents si 1:1.
    // hostingId: { type: Schema.Types.ObjectId, ref: 'Hosting', required: true }, // Exemple de FK
});

export const EnvironmentModel = model<IEnvironment>('Environment', EnvironmentSchema, 'environments');