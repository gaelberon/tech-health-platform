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
import { SolutionModel } from '../../models/Solution.model.js';
import { ScoringSnapshotModel } from '../../models/ScoringSnapshot.model.js';
import { validateLookupValue } from '../../utils/validateLookupValue.js';


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
    env_type?: string; // P1 [2] - Validé contre la Value List "ENVIRONMENT_TYPES"
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
    
    // Champs AISA
    security_zones_managed?: string; // AISA 3.1.1
    network_services_requirements?: string; // AISA 5.3.2
    information_assets_removal_policy?: string; // AISA 5.3.3
    shared_external_it_services_protection?: string; // AISA 5.3.4
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

            // Valider env_type contre les Value Lists si fourni
            if (input.env_type) {
                const isValid = await validateLookupValue('ENVIRONMENT_TYPES', input.env_type);
                if (!isValid) {
                    throw new Error(`Le type d'environnement "${input.env_type}" n'est pas valide. Veuillez utiliser une valeur de la liste "ENVIRONMENT_TYPES".`);
                }
            }

            // Préparer les données de mise à jour
            const updateData: any = { ...input };
            
            // Mapper la redondance : "geo_redundant" (GraphQL) -> "geo-redundant" (Mongoose)
            if (updateData.redundancy === 'geo_redundant') {
                updateData.redundancy = 'geo-redundant';
            }
            
            // Si solutionId est fourni comme string (solutionId externe), trouver l'ObjectId MongoDB
            if (input.solutionId && typeof input.solutionId === 'string' && !Types.ObjectId.isValid(input.solutionId)) {
                const solution = await SolutionModel.findOne({ solutionId: input.solutionId });
                if (!solution) {
                    throw new Error(`Solution avec solutionId "${input.solutionId}" non trouvée`);
                }
                updateData.solutionId = solution._id;
            }

            // Mise à jour de l'environnement (essentiel pour les données de Résilience/Sécurité)
            const updatedEnvironment = await EnvironmentModel.findOneAndUpdate(
                { envId: input.envId },
                { $set: updateData },
                { new: true, upsert: true } // Crée ou met à jour
            );
            
            // NOTE : Une mise à jour de l'environnement (sauvegarde, redondance)
            // devrait déclencher une nouvelle évaluation du Scoring Engine, 
            // notamment pour les catégories Résilience (20%) et Sécurité (30%) [8].
            // scoringService.calculateScore(updatedEnvironment.solutionId, updatedEnvironment._id); 
            
            return updatedEnvironment;
        },
        
        // Mutation pour créer un nouvel environnement (Data Management)
        createEnvironment: async (_: any, { input }: { input: any }, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'createEnvironment');
            
            // Vérifier que l'utilisateur a le droit (Admin ou Supervisor)
            if (ctx.user.role !== 'Admin' && ctx.user.role !== 'Supervisor') {
                throw new Error('Seuls les administrateurs et superviseurs peuvent créer des environnements');
            }

            // Valider env_type contre les Value Lists
            if (input.env_type) {
                const isValid = await validateLookupValue('ENVIRONMENT_TYPES', input.env_type);
                if (!isValid) {
                    throw new Error(`Le type d'environnement "${input.env_type}" n'est pas valide. Veuillez utiliser une valeur de la liste "ENVIRONMENT_TYPES".`);
                }
            }
            
            // Trouver la Solution par son solutionId (string) pour obtenir son ObjectId MongoDB
            const solution = await SolutionModel.findOne({ solutionId: input.solutionId });
            if (!solution) {
                throw new Error(`Solution avec solutionId "${input.solutionId}" non trouvée`);
            }
            
            // Mapper la redondance : "geo_redundant" (GraphQL) -> "geo-redundant" (Mongoose)
            const mappedRedundancy = input.redundancy === 'geo_redundant' 
                ? 'geo-redundant' 
                : input.redundancy;
            
            // Générer un envId unique
            const envCount = await EnvironmentModel.countDocuments();
            const envId = `env-${String(envCount + 1).padStart(4, '0')}`;
            
            // Convertir backup.rto_hours et backup.rpo_hours en backup.rto et backup.rpo
            const backupData = input.backup ? {
                ...input.backup,
                rto: input.backup.rto_hours,
                rpo: input.backup.rpo_hours,
                restoration_test_frequency: input.backup.restoration_test_frequency || 'never'
            } : {
                exists: false,
                rto: 24,
                rpo: 4,
                restoration_test_frequency: 'never'
            };
            
            const newEnvironment = await EnvironmentModel.create({
                ...input,
                solutionId: solution._id, // Utiliser l'ObjectId MongoDB de la Solution
                redundancy: mappedRedundancy, // Utiliser la valeur mappée
                envId,
                backup: backupData,
                archived: false
            });
            
            return newEnvironment;
        },
        
        // Mutation pour archiver/Désarchiver un environnement (Data Management)
        archiveEnvironment: async (_: any, { input }: { input: { id: string; archived: boolean } }, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'archiveEnvironment');
            
            // Vérifier que l'utilisateur a le droit (Admin ou Supervisor)
            if (ctx.user.role !== 'Admin' && ctx.user.role !== 'Supervisor') {
                throw new Error('Seuls les administrateurs et superviseurs peuvent archiver des environnements');
            }
            
            const updateData: any = {
                archived: input.archived,
                archivedBy: ctx.user.userId || ctx.user._id?.toString()
            };
            
            if (input.archived) {
                updateData.archivedAt = new Date();
            } else {
                updateData.archivedAt = null;
            }
            
            const updatedEnvironment = await EnvironmentModel.findOneAndUpdate(
                { envId: input.id },
                { $set: updateData },
                { new: true }
            );
            
            if (!updatedEnvironment) {
                throw new Error('Environnement non trouvé');
            }
            
            return updatedEnvironment;
        }
    },
    
    // Résolveurs de CHAMP (Field Resolvers) : Pour lier les entités associées à Environment
    Environment: {
        
        // Field resolver pour redundancy : convertir "geo-redundant" (MongoDB) vers "geo_redundant" (GraphQL)
        redundancy: (parent: IEnvironment & Document) => {
            // Convertir "geo-redundant" (MongoDB) vers "geo_redundant" (GraphQL enum)
            if (parent.redundancy === 'geo-redundant') {
                return 'geo_redundant';
            }
            return parent.redundancy;
        },
        
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
        },

        // Relation 0..N vers ScoringSnapshot (Historique des scores pour cet environnement)
        scoringSnapshots: async (parent: IEnvironment & Document) => {
            // Les snapshots sont P1 et liés à un environnement spécifique via envId
            return await ScoringSnapshotModel.find({ envId: parent._id }).sort({ date: -1 }); // Tri par date récente
        }
    }
};

export default EnvironmentResolver;