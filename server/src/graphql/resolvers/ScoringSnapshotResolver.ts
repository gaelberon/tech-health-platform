// Fichier : /server/src/graphql/resolvers/ScoringSnapshotResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Import du modèle et de l'interface ScoringSnapshot (avec .js pour la résolution ESM)
import { ScoringSnapshotModel, IScoringSnapshot } from '../../models/ScoringSnapshot.model.js'; 

// ------------------ TYPES ENUMÉRÉS & OBJETS IMBRIQUÉS ------------------

// Définition des scores par catégorie (P1) [2, 3]
interface CategoryScores {
    security: number; // 30% [3]
    resilience: number; // 20% [3]
    observability: number; // 15% [3]
    architecture: number; // 15% [3]
    compliance: number; // 20% [3]
}

// Niveau de risque (P1) [1, 2, 6]
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'; 

// ------------------ INTERFACES DE TYPAGE ------------------

// 1. Interface pour les arguments de la Query listScoringSnapshots
interface ListScoringSnapshotsArgs {
    // solutionId est nécessaire pour la recherche (P1)
    solutionId: string; 
    // envId est optionnel (le score peut être global pour la Solution ou spécifique à l'Environnement)
    envId?: string; 
}

// 2. Interface pour l'Input de la Mutation recordScoringSnapshot
export interface CreateScoringSnapshotInput {
    solutionId: Types.ObjectId; // FK vers la Solution (P1) [1]
    envId?: Types.ObjectId; // FK optionnelle vers l'Environnement
    
    // Contenu du snapshot (P1) [1]
    scores: CategoryScores; // Obligatoire
    global_score: number;
    risk_level: RiskLevel;
    notes?: string; // Recommandations automatiques ou manuelles [1]
    // La date est généralement gérée par Mongoose (timestamps) [1]
}

// ------------------ RESOLVER ------------------

const ScoringSnapshotResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query pour récupérer l'historique des scores pour une Solution (P1)
        listScoringSnapshots: async (_: any, args: ListScoringSnapshotsArgs, ctx: any) => { 
            // Utilisation de '_: any' pour satisfaire noImplicitAny [Previous Conversation]
            const { solutionId, envId } = args;
            
            const filter: any = { solutionId: solutionId };

            // RBAC minimal : pour les directeurs/éditeurs d'entité,
            // la vérification plus fine devrait être faite en amont (via Solution),
            // mais on garde ici un hook si nécessaire.
            if (ctx.user && (ctx.user.role === 'EntityDirector' || ctx.user.role === 'Editor')) {
                // on pourrait ici ajouter un filtre supplémentaire si les snapshots stockent editorId
            }
            
            if (envId) {
                // Ajoute le filtre par environnement si spécifié
                filter.envId = envId;
            }
            
            // Les snapshots doivent être retournés dans l'ordre chronologique inverse
            return await ScoringSnapshotModel.find(filter).sort({ date: -1 });
        },
    },
    
    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation pour créer un nouveau snapshot de scoring (P1)
        recordScoringSnapshot: async (_: any, { input }: { input: CreateScoringSnapshotInput }, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'recordScoringSnapshot');

            // 1. Nettoyage de l'Input pour satisfaire le mode strict (P1)
            // Nous utilisons un type plus permissif pour la création
            const inputToSave: any = {};
            
            // Copie de toutes les propriétés définies (y compris les scores, qui ne sont pas undefined)
            for (const key in input) {
                // S'assure de ne pas copier les clés undefined
                if (input[key as keyof CreateScoringSnapshotInput] !== undefined) {
                    inputToSave[key] = input[key as keyof CreateScoringSnapshotInput];
                }
            }
            
            // 2. Création du document avec l'objet nettoyé
            // Mongoose devrait maintenant pouvoir identifier la surcharge correcte pour un document unique
            const newSnapshot = await ScoringSnapshotModel.create(inputToSave);
            
            return newSnapshot;
        },
    },
    
    // Résolveurs de CHAMP (Field Resolvers)
    ScoringSnapshot: {
        // Convertir la date en string ISO pour GraphQL
        date: (parent: IScoringSnapshot & Document) => {
            if (!parent.date) return new Date().toISOString();
            return parent.date instanceof Date 
                ? parent.date.toISOString() 
                : new Date(parent.date).toISOString();
        },
    },
};

export default ScoringSnapshotResolver;