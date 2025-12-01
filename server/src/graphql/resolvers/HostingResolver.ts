// Fichier : /server/src/graphql/resolvers/HostingResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Import du modèle et de l'interface Hosting (avec .js pour la résolution ESM)
import { HostingModel, IHosting } from '../../models/Hosting.model.js'; 

// ------------------ INTERFACES DE TYPAGE ------------------

// Type de l'objet imbriqué ContactDetails (P4)
interface ContactDetailsInput {
    name: string;
    email: string;
}

// 1. Interface pour les arguments de la Query getHostingProfile
interface GetHostingArgs {
    // hostingId est nécessaire car c'est la clé primaire
    hostingId: string; 
}

// 2. Interface pour l'Input de la Mutation updateHostingProfile
// Basée sur les champs de la Due Diligence Section 2a, P1, P2 et P4 [2, 7]
export interface UpdateHostingInput {
    // hostingId est nécessaire pour identifier l'enregistrement à mettre à jour/créer
    hostingId: string; 
    
    // Champs P1 (Critique)
    provider: string; // OVH, Azure, GCP, AWS, Bleu, OnPrem… [2, 5]
    region: string; // Pays/Région (utile pour la conformité RGPD) [2, 7]
    tier: string; // datacenter/private/public/cloud [2]
    
    // Champs P2/P3
    certifications?: string[]; // ISO27001, HDS, SOC2, etc. [2, 8]
    
    // Champ P4
    contact?: ContactDetailsInput;
}

// ------------------ RESOLVER ------------------

const HostingResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query pour récupérer le profil d'hébergement par son ID
        getHostingProfile: async (_: any, args: GetHostingArgs) => { 
            // Utilisation de '_: any' pour satisfaire noImplicitAny
            const { hostingId } = args;
            
            // hostingId est P1 [2]
            return await HostingModel.findOne({ hostingId: hostingId });
        },
    },

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation pour créer ou mettre à jour le profil d'hébergement d'un environnement
        updateHostingProfile: async (_: any, { input }: { input: UpdateHostingInput }, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'updateHostingProfile');

            // La mise à jour de l'hébergement (P1) est essentielle pour l'évaluation de la Résilience [9]
            const updatedHosting = await HostingModel.findOneAndUpdate(
                { hostingId: input.hostingId },
                { $set: input },
                { new: true, upsert: true } // Crée si n'existe pas, retourne la nouvelle version
            );
            
            return updatedHosting;
        },
    },
    
    // Résolveurs de CHAMP (Field Resolvers)
    // Non requis ici, car Hosting est un nœud 'feuille' de Environment.
};

export default HostingResolver;