// Fichier : /server/src/graphql/resolvers/MonitoringObservabilityResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Import du modèle et de l'interface MonitoringObservability (avec .js pour la résolution ESM)
import { MonitoringObservabilityModel, IMonitoringObservability } from '../../models/MonitoringObservability.model.js';
import { EnvironmentModel } from '../../models/Environment.model.js'; 

// ------------------ INTERFACES DE TYPAGE ------------------

// Types pour les énumérations (basés sur le dictionnaire synthétique P2)
type MonitoringStatus = 'Yes' | 'Partial' | 'No'; 

// 1. Interface pour les arguments de la Query getMonitoringObservability
interface GetMonitoringArgs {
    // envId est nécessaire car MonitoringObservability est lié à Environment (1:1) [3, 6]
    envId: string; 
}

// 2. Interface pour l'Input de la Mutation updateMonitoringObservability
export interface UpdateMonitoringObservabilityInput {
    // Clé étrangère nécessaire pour identifier l'enregistrement à mettre à jour/créer [6]
    // Peut être une string (envId) ou un ObjectId
    envId: string | Types.ObjectId; 
    
    // Suivi de la performance (P2) [1, 6]
    perf_monitoring?: MonitoringStatus; 
    
    // Centralisation des logs (P2) [1, 6]
    log_centralization?: MonitoringStatus; 
    
    // Outils utilisés (P2) [1, 6] - Basé sur les listes exhaustives (Prometheus, Grafana, ELK, Datadog, etc.) [4, 5]
    tools?: string[];
    
    // Stratégie d'alerting (DD Section 5a)
    alerting_strategy?: string;
}

// ------------------ RESOLVER ------------------

const MonitoringObservabilityResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query pour récupérer le profil de monitoring d'un environnement spécifique
        getMonitoringObservability: async (_: any, args: GetMonitoringArgs) => { 
            // Utilisation de '_: any' pour satisfaire noImplicitAny dans la Root Query [Previous Conversation]
            const { envId } = args;
            
            // Le monitoring est crucial pour le diagnostic des problèmes d'infrastructure (Technocarte/CSWIN) [5, 7]
            return await MonitoringObservabilityModel.findOne({ envId: envId });
        },
    },

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation pour créer ou mettre à jour le profil de monitoring et d'observabilité (P2)
        updateMonitoringObservability: async (_: any, { input }: { input: UpdateMonitoringObservabilityInput }, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'updateMonitoringObservability');

            // Convertir envId (string) en ObjectId si nécessaire
            let envIdObjectId: Types.ObjectId;
            if (typeof input.envId === 'string') {
                // Si c'est une string (envId externe), trouver l'environnement pour obtenir son ObjectId MongoDB
                if (Types.ObjectId.isValid(input.envId)) {
                    // Si c'est déjà un ObjectId valide en string, le convertir
                    envIdObjectId = new Types.ObjectId(input.envId);
                } else {
                    // Sinon, chercher l'environnement par son envId (string)
                    const environment = await EnvironmentModel.findOne({ envId: input.envId });
                    if (!environment) {
                        throw new Error(`Environnement avec envId "${input.envId}" non trouvé`);
                    }
                    envIdObjectId = environment._id;
                }
            } else {
                envIdObjectId = input.envId;
            }

            // Préparer les données de mise à jour avec l'ObjectId correct
            const updateData: any = {
                ...input,
                envId: envIdObjectId,
            };

            // Générer un monId si c'est une création (upsert)
            const existingMonitoring = await MonitoringObservabilityModel.findOne({ envId: envIdObjectId });
            if (!existingMonitoring) {
                const monitoringCount = await MonitoringObservabilityModel.countDocuments();
                updateData.monId = `mon-${String(monitoringCount + 1).padStart(4, '0')}`;
            }

            // Mise à jour de l'entité
            const updatedMonitoring = await MonitoringObservabilityModel.findOneAndUpdate(
                { envId: envIdObjectId },
                { $set: updateData },
                { new: true, upsert: true } // Crée si n'existe pas, retourne la nouvelle version
            );

            // NOTE : Une mise à jour du monitoring (centralisation des logs, outils) 
            // est essentielle pour la catégorie Scoring Observabilité (15%) [2, 8].
            // scoringService.calculateObservabilityScore(envIdObjectId); 
            
            return updatedMonitoring;
        },
    },
    
    // Résolveurs de CHAMP (Field Resolvers)
    // Non requis ici, car MonitoringObservability est un nœud 'feuille' de Environment [3].
};

export default MonitoringObservabilityResolver;