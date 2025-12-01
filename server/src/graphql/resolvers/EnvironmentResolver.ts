// Fichier : /server/src/graphql/resolvers/EnvironmentResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Interfaces et Modèles de l'environnement et de ses relations (avec .js)
import { EnvironmentModel, IEnvironment } from '../../models/Environment.model.js'; 
import { HostingModel, IHosting } from '../../models/Hosting.model.js';
import { SecurityProfileModel, ISecurityProfile } from '../../models/SecurityProfile.model.js';
import { MonitoringObservabilityModel, IMonitoringObservability } from '../../models/MonitoringObservability.model.js';
import { EntityCostModel, IEntityCost } from '../../models/EntityCost.model.js';
import { PerformanceMetricsModel, IPerformanceMetrics } from '../../models/PerformanceMetrics.model.js';
import { RoadmapItemModel, IRoadmapItem } from '../../models/RoadmapItem.model.js';
import { DocumentModel, IDocument } from '../../models/Document.model.js';


// ------------------ INTERFACES DE TYPAGE ------------------

// Type de l'objet imbriqué Backup (P1)
interface BackupInput {
    exists: boolean; 
    schedule: string;
    rto_hours: number | null; // Recovery Time Objective (en heures) [2]
    rpo_hours: number | null; // Recovery Point Objective (en heures) [2]
    restoration_test_frequency?: string; // Fréquence des tests de restauration [3]
}

// 1. Interface pour les arguments de la Query getEnvironment
interface GetEnvironmentArgs {
    envId: string; // ID de l'environnement (PK)
}

// 2. Interface pour l'Input de la Mutation updateEnvironment
export interface UpdateEnvironmentInput {
    // Clés
    envId: string; 
    solutionId: Types.ObjectId; 
    hostingId?: Types.ObjectId; // FK vers Hosting
    
    // Champs P1/P2
    env_type?: 'production' | 'test' | 'dev' | 'backup'; // P1 [2]
    deployment_type?: 'monolith' | 'microservices' | 'hybrid'; // P2 [2]
    virtualization?: 'physical' | 'VM' | 'container' | 'k8s'; // P2 [2]
    tech_stack?: string[]; // P2 [2, 3]
    data_types?: string[]; // P1 [2]
    redundancy?: 'none' | 'minimal' | 'geo-redundant' | 'high'; // P1 [2]
    backup?: BackupInput; // Objet de sauvegarde P1 [2]
    sla_offered?: string; // P3 [2]

    // Champs DD (Réseau, Bases de données, DR) [3, 5, 6]
    network_security_mechanisms?: string[]; // VPN, pare-feux, IDS/IPS [3, 6]
    db_scaling_mechanism?: string; // Comment les bases de données évoluent [3, 5]
    disaster_recovery_plan?: string; // Plan de reprise après sinistre documenté et testé [3, 7]
}

// ------------------ RESOLVER ------------------

const EnvironmentResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query 1: Récupérer un environnement par son ID (Vue DD Environnement)
        getEnvironment: async (_: any, args: GetEnvironmentArgs, ctx: any) => { 
            const { envId } = args;
            // envId est P1 [2]
            const filter: any = { envId: envId };

            // RBAC minimal : restriction par éditeur pour certains rôles.
            // NOTE: nécessite que l'Environment stocke editorId ou que le filtrage soit fait en amont.
            if (ctx.user && (ctx.user.role === 'EntityDirector' || ctx.user.role === 'Editor')) {
                // Ici on pourrait joindre avec Solution si nécessaire.
            }

            return await EnvironmentModel.findOne(filter);
        },

        // Query 2: Lister tous les environnements pour une Solution (Peut être géré par Field Resolver Solution:environments, mais utile en Query racine)
        listEnvironmentsForSolution: async (_: any, { solutionId }: { solutionId: string }, ctx: any) => {
            
            // Plutôt que de créer un nouvel ObjectId, utilisez la chaîne de caractères brute.
            // Mongoose est souvent intelligent pour caster la chaîne en ObjectId lors de l'exécution
            // et le typage TypeScript peut être plus souple avec string ici.
            const filter: any = { solutionId: solutionId as any };

            if (ctx.user && (ctx.user.role === 'EntityDirector' || ctx.user.role === 'Editor')) {
                // un filtrage plus fin pourrait être ajouté ici si l'environnement encode l'éditeur
            }

            return await EnvironmentModel.find(filter);
            
            // OU, si vous voulez éviter 'as any' et si l'erreur était dans l'objet de recherche :
            // return await EnvironmentModel.find({ solutionId: solutionId }); 

            // OU, Conversion en Types.ObjectId (comme vous l'avez déjà fait)
            // const solutionObjectId = new Types.ObjectId(solutionId);
            
            // // 1. Définir le filtre en utilisant FilterQuery (le type Mongoose attendu pour les requêtes)
            // // Et le typer explicitement pour l'interface IEnvironment
            // const filter: FilterQuery<IEnvironment> = { 
            //     solutionId: solutionObjectId 
            // };
    
            // // 2. Exécuter la requête
            // return await EnvironmentModel.find(filter);
        },
    },

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation pour créer ou mettre à jour les données d'un environnement (P1-P3)
        updateEnvironment: async (_: any, { input }: { input: UpdateEnvironmentInput }, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'updateEnvironment');

            // Mise à jour de l'environnement (essentiel pour les données de Résilience/Sécurité)
            const updatedEnvironment = await EnvironmentModel.findOneAndUpdate(
                { envId: input.envId },
                { $set: input },
                { new: true, upsert: true } // Crée ou met à jour
            );
            
            // NOTE : Une mise à jour de l'environnement (sauvegarde, redondance)
            // devrait déclencher une nouvelle évaluation du Scoring Engine, 
            // notamment pour les catégories Résilience (20%) et Sécurité (30%) [8].
            // scoringService.calculateScore(updatedEnvironment.solutionId, updatedEnvironment._id); 
            
            return updatedEnvironment;
        },
    },
    
    // Résolveurs de CHAMP (Field Resolvers) : Pour lier les entités associées à Environment
    Environment: {
        
        // Relation 1:1 vers Hosting
        hosting: async (parent: IEnvironment & Document) => {
            // L'hébergement est P1 [9]
            return await HostingModel.findOne({ hostingId: parent.hostingId });
        },

        // Relation 1:1 vers SecurityProfile
        securityProfile: async (parent: IEnvironment & Document) => {
            // Le profil de sécurité est P1 et crucial pour le scoring [9]
            return await SecurityProfileModel.findOne({ envId: parent._id });
        },
        
        // Relation 1:1 vers MonitoringObservability
        monitoringObservability: async (parent: IEnvironment & Document) => {
            // Le monitoring est P2 et crucial pour le scoring Observabilité (15%) [10, 11]
            return await MonitoringObservabilityModel.findOne({ envId: parent._id });
        },

        // Relation 1:1 vers EntityCost
        costs: async (parent: IEnvironment & Document) => {
            // Les coûts sont P4 [10, 12]
            return await EntityCostModel.findOne({ envId: parent._id });
        },

        // Relation 0..N (Timeseries) vers PerformanceMetrics
        performanceMetrics: async (parent: IEnvironment & Document) => {
            // Les métriques de performance sont P3 [10, 13]
            return await PerformanceMetricsModel.find({ envId: parent._id }).sort({ date: -1 }); // Tri par date récente
        },

        // Relation 0..N vers RoadmapItem (si lié à l'environnement spécifique, ex: "Migration Prod OVH")
        roadmapItems: async (parent: IEnvironment & Document) => {
            // Les éléments de roadmap sont P3 [13, 14]
            return await RoadmapItemModel.find({ parentId: parent._id, linkedTo: 'Environment' });
        },

        // Relation 0..N vers Document (Pentests, schémas d'architecture)
        documents: async (parent: IEnvironment & Document) => {
            // Les documents sont P4 [14, 15]
            return await DocumentModel.find({ 
                parentId: parent._id, 
                linkedTo: 'Environment' 
            });
        }
    }
};

export default EnvironmentResolver;