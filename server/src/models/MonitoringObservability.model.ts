import { Schema, model, Document, Types } from 'mongoose';

// Types Enum basés sur le dictionnaire synthétique (P2)
type MonitoringStatus = 'Yes' | 'Partial' | 'No';

// Liste des outils pertinents selon la grille d'analyse (P2) [2, 5]
type MonitoringTools = 'Prometheus' | 'Grafana' | 'ELK Stack' | 'Datadog' | 'Splunk' | 'New Relic' | 'Other';

// 1. Définition de l'Interface TypeScript pour l'entité MonitoringObservability
export interface IMonitoringObservability extends Document {
    monId: string; // Identifiant unique (PK) [4]
    envId: Types.ObjectId; // Lien vers l'environnement (FK) [4]
    
    // Champs P2
    perf_monitoring: MonitoringStatus; // Monitoring de la performance (Oui/Partiel/Non) [2, 4]
    log_centralization: MonitoringStatus; // Centralisation des logs (Oui/Partiel/Non) [2, 4]
    tools: MonitoringTools[]; // Outils utilisés (Prometheus, Grafana, ELK, Datadog, etc.) [2, 4]
    
    // Champ DD additionnel pour détailler la stratégie (5.a.2)
    alerting_strategy: string; // Comment les alertes sont-elles gérées et routées
}

// 2. Définition du Schéma Mongoose
const MonitoringObservabilitySchema = new Schema<IMonitoringObservability>({
    
    // Clé Primaire (P2)
    monId: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    
    // Clé Étrangère vers Environment (Relation 1:1, ou 1:N si on le gère comme timeseries [1, 2])
    envId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Environment', 
        required: true,
        // unique: true // Décommenter si l'on assure 1:1, sinon permettre N
    },

    // Monitoring de la Performance (P2)
    perf_monitoring: { 
        type: String, 
        enum: ['Yes', 'Partial', 'No'], 
        required: true,
        description: "Monitoring de la performance (Oui/Partiel/Non)" 
    },
    
    // Centralisation des Logs (P2)
    log_centralization: { 
        type: String, 
        enum: ['Yes', 'Partial', 'No'], 
        required: true,
        description: "Centralisation des logs (Oui/Partiel/Non)" 
    },
    
    // Outils utilisés (P2)
    tools: [{ 
        type: String, 
        enum: ['Prometheus', 'Grafana', 'ELK Stack', 'Datadog', 'Splunk', 'New Relic', 'Zabbix', 'Graylog', 'Other'],
        description: "Liste des outils utilisés pour l'observabilité"
    }],
    
    // Stratégie d'alerting (Donnée DD/Opérationnelle)
    alerting_strategy: { 
        type: String, 
        required: false,
        description: "Processus et outils pour surveiller l'état de fonctionnement et détecter les erreurs (DD 5.a.2)"
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// 3. Exportation du Modèle
export const MonitoringObservabilityModel = model<IMonitoringObservability>('MonitoringObservability', MonitoringObservabilitySchema, 'monitoring');