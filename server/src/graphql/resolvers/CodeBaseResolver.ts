// Fichier : /server/src/graphql/resolvers/CodeBaseResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Import du modèle et de l'interface CodeBase (avec .js pour la résolution ESM)
import { CodeBaseModel, ICodeBase } from '../../models/CodeBase.model.js';
import { SolutionModel } from '../../models/Solution.model.js';
import { validateLookupValue } from '../../utils/validateLookupValue.js'; 

// ------------------ INTERFACES DE TYPAGE ------------------

// 1. Interface pour les arguments de la Query getCodebase
interface GetCodebaseArgs {
    // solutionId est nécessaire car Codebase est lié à Solution (1:1)
    solutionId: string; 
}

// 2. Interface pour l'Input de la Mutation updateCodebase
// Cette structure est basée sur les champs de l'entité Codebase (DD Section 1) [4]
export interface UpdateCodebaseInput {
    // Clé étrangère nécessaire pour identifier l'enregistrement à mettre à jour/créer
    solutionId: Types.ObjectId; 
    
    // Champs de la Codebase [4]
    repo_location?: string;
    documentation_level?: string;
    code_review_process?: string;
    version_control_tool?: string;
    
    // Champs de dette technique/systèmes hérités [3, 4]
    technical_debt_known?: string; 
    legacy_systems?: string;
    
    // Dépendances de technologies tiers/Open Source [1, 4]
    third_party_dependencies?: string[]; 
}

// ------------------ RESOLVER ------------------

const CodeBaseResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query pour récupérer le profil Codebase d'une solution spécifique
        getCodebase: async (_: any, args: GetCodebaseArgs) => { 
            // Utilisation de '_: any' pour satisfaire noImplicitAny
            const { solutionId } = args;
            
            // Relation 1:1 vers Solution
            return await CodeBaseModel.findOne({ solutionId: solutionId });
        },
    },

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation pour créer ou mettre à jour le profil Codebase d'une solution (DD Section 1)
        updateCodebase: async (_: any, { input }: { input: UpdateCodebaseInput }) => {
            // Validation contre les Value Lists
            if (input.documentation_level) {
                const isValid = await validateLookupValue('DOCUMENTATION_LEVEL', input.documentation_level);
                if (!isValid) {
                    throw new Error(`Le niveau de documentation "${input.documentation_level}" n'est pas valide. Veuillez utiliser une valeur de la liste "DOCUMENTATION_LEVEL".`);
                }
            }

            // Convertir solutionId en ObjectId si c'est une string
            let solutionIdObjectId: Types.ObjectId;
            if (typeof input.solutionId === 'string') {
                if (Types.ObjectId.isValid(input.solutionId)) {
                    // Si c'est déjà un ObjectId valide en string, le convertir
                    solutionIdObjectId = new Types.ObjectId(input.solutionId);
                } else {
                    // Sinon, chercher la solution par son solutionId (string externe)
                    const solution = await SolutionModel.findOne({ solutionId: input.solutionId });
                    if (!solution) {
                        throw new Error(`Solution avec solutionId "${input.solutionId}" non trouvée`);
                    }
                    solutionIdObjectId = solution._id;
                }
            } else {
                solutionIdObjectId = input.solutionId;
            }

            // Vérifier si un codebase existe déjà
            const existingCodebase = await CodeBaseModel.findOne({ solutionId: solutionIdObjectId });
            
            const updateData: any = {
                ...input,
                solutionId: solutionIdObjectId,
            };

            // Générer codebaseId si c'est une nouvelle création
            if (!existingCodebase) {
                const codebaseCount = await CodeBaseModel.countDocuments();
                updateData.codebaseId = `codebase-${String(codebaseCount + 1).padStart(4, '0')}`;
            }

            // Utilisation de findOneAndUpdate avec upsert: true pour gérer la relation 1:1
            const updatedCodebase = await CodeBaseModel.findOneAndUpdate(
                { solutionId: solutionIdObjectId },
                { $set: updateData },
                { new: true, upsert: true } // Crée si n'existe pas, retourne la nouvelle version
            );

            // Ce type de mise à jour pourrait nécessiter un nouveau scoring Architecture (15%) [5]
            // scoringService.calculateArchitectureScore(input.solutionId);
            
            return updatedCodebase;
        },
    },
    
    // Résolveurs de CHAMP (Field Resolvers)
    // Non nécessaires ici, car Codebase est un nœud 'feuille' de Solution, 
    // mais si Codebase référençait d'autres entités, ils seraient implémentés ici.
};

export default CodeBaseResolver;