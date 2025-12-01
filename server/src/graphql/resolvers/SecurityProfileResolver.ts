// Fichier : /server/src/graphql/resolvers/SecurityProfileResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Import du modèle et de l'interface SecurityProfile (avec .js pour la résolution ESM)
import { SecurityProfileModel, ISecurityProfile } from '../../models/SecurityProfile.model.js'; 

// ------------------ TYPES ENUMÉRÉS & OBJETS IMBRIQUÉS ------------------

// Types pour les champs P1/P2 [1, 2]
type AuthType = 'None' | 'Passwords' | 'MFA' | 'SSO';
type PatchingType = 'ad_hoc' | 'scheduled' | 'automated';
type PentestFreqType = 'never' | 'annual' | 'quarterly';

// Structure de l'objet imbriqué 'encryption' (P1) [1]
interface EncryptionInput {
    in_transit: boolean;
    at_rest: boolean;
    details?: string;
}

// ------------------ INTERFACES DE TYPAGE ------------------

// 1. Interface pour les arguments de la Query getSecurityProfile
interface GetSecurityProfileArgs {
    // envId est nécessaire car SecurityProfile est lié à Environment (1:1)
    envId: string; 
}

// 2. Interface pour l'Input de la Mutation updateSecurityProfile
// Basée sur les champs de la Due Diligence Section 3 [4]
export interface UpdateSecurityProfileInput {
    // Clé étrangère nécessaire pour identifier l'enregistrement à mettre à jour/créer (P1)
    envId: Types.ObjectId; 
    
    // Champs P1 (Critique pour le scoring Sécurité 30%)
    auth?: AuthType;
    encryption?: EncryptionInput;
    
    // Champs P2
    patching?: PatchingType;
    vuln_mgmt?: string; // Gestion des vulnérabilités [1]
    access_control?: string; // Ex: PAM used? [1]
    centralized_monitoring?: boolean; // Monitoring de sécurité centralisé [4]
    
    // Champs P3/DD (Audits et Pentests)
    pentest_freq?: PentestFreqType; 
    internal_audits_recent?: string; // Audits récents [4]
    pentest_results_summary?: string; // Résumé des derniers pentests [4]
    known_security_flaws?: string; // Failles connues [4]
    incident_reporting_process?: string; // Processus de résolution des incidents [4]
}

// ------------------ RESOLVER ------------------

const SecurityProfileResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query pour récupérer le profil de sécurité d'un environnement spécifique
        getSecurityProfile: async (_: any, args: GetSecurityProfileArgs) => { 
            // Utilisation de '_: any' pour satisfaire noImplicitAny
            const { envId } = args;
            
            // Relation 1:1 vers Environment
            return await SecurityProfileModel.findOne({ envId: envId });
        },
    },

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation pour créer ou mettre à jour le profil de sécurité (P1)
        updateSecurityProfile: async (_: any, { input }: { input: UpdateSecurityProfileInput }, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'updateSecurityProfile');

            // La mise à jour est CRITIQUE, car elle affecte la catégorie de scoring la plus importante (Sécurité, 30%) [2]
            const updatedProfile = await SecurityProfileModel.findOneAndUpdate(
                { envId: input.envId },
                { $set: input },
                { new: true, upsert: true } // Crée si n'existe pas, retourne la nouvelle version
            );

            // NOTE : Le Scoring Engine DOIT être notifié ici pour recalculer le score de sécurité.
            // (Exemple : scoringService.calculateSecurityScore(input.envId);)
            
            return updatedProfile;
        },
    },
    
    // Résolveurs de CHAMP (Field Resolvers)
    // Non requis ici, car SecurityProfile est un nœud 'feuille' de Environment.
};

export default SecurityProfileResolver;