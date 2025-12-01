// Fichier : /server/src/graphql/resolvers/PerformanceMetricsResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Import du modèle et de l'interface PerformanceMetrics (avec .js pour la résolution ESM)
import { PerformanceMetricsModel, IPerformanceMetrics } from '../../models/PerformanceMetrics.model.js'; 

// ------------------ INTERFACES DE TYPAGE ------------------

// 1. Interface pour les arguments de la Query listPerformanceMetrics
interface ListPerformanceMetricsArgs {
    // envId est nécessaire pour filtrer les métriques par environnement (P3)
    envId: string; 
    // Optionnel : Ajout d'arguments pour la plage de dates si la requête le supporte
    startDate?: Date; 
    endDate?: Date;
}

// 2. Interface pour l'Input de la Mutation recordPerformanceMetric
// Basée sur les champs de l'entité PerformanceMetrics (P3)
export interface CreatePerformanceMetricInput {
    // Clé étrangère
    envId: Types.ObjectId; 
    
    // Date de la mesure (P3)
    date: Date;
    
    // Métriques de performance (P3)
    active_users: number;
    transactions_per_minute: number;
    avg_response_ms: number;
    incident_count: number;
}

// ------------------ RESOLVER ------------------

const PerformanceMetricsResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query pour récupérer l'historique des métriques de performance pour un environnement
        listPerformanceMetrics: async (_: any, args: ListPerformanceMetricsArgs) => { 
            // Utilisation de '_: any' pour satisfaire noImplicitAny
            const { envId, startDate, endDate } = args;
            
            // Construction des critères de filtre
            const filter: any = { envId: envId };
            if (startDate || endDate) {
                filter.date = {};
                if (startDate) filter.date.$gte = startDate;
                if (endDate) filter.date.$lte = endDate;
            }
            
            // Les métriques de performance doivent être retournées dans l'ordre chronologique inverse
            // pour afficher les données les plus récentes en premier (Time-series)
            return await PerformanceMetricsModel.find(filter).sort({ date: -1 });
        },
    },

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation pour enregistrer un nouveau point de donnée de performance (P3)
        recordPerformanceMetric: async (_: any, { input }: { input: CreatePerformanceMetricInput }) => {
            // Utilisation de '_: any' pour satisfaire noImplicitAny
            
            // Création d'une nouvelle entrée dans la série temporelle
            const newMetric = await PerformanceMetricsModel.create(input);
            
            // NOTE : Ce type de donnée est souvent inséré par un service externe (Prometheus, Datadog)
            // et non par un utilisateur UI, mais la mutation est nécessaire pour l'API.
            
            return newMetric;
        },
    },
    
    // Résolveurs de CHAMP (Field Resolvers)
    // Non requis ici, car PerformanceMetrics est un nœud 'feuille' de Environment,
    // conçu pour être historisé et consulté, et non pour se lier à d'autres entités.
};

export default PerformanceMetricsResolver;