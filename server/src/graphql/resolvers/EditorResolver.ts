// Fichier : /server/src/graphql/resolvers/EditorResolver.ts

// ------------------ IMPORTS ------------------

import { Document, Types } from 'mongoose'; 
// Import des modèles et interfaces (avec .js pour la résolution ESM)
import { EditorModel, IEditor } from '../../models/Editor.model.js'; 
import { SolutionModel, ISolution } from '../../models/Solution.model.js';
import { DevelopmentTeamModel, IDevelopmentTeam } from '../../models/DevelopmentTeam.model.js';
import { DocumentModel, IDocument } from '../../models/Document.model.js';
import { AssetModel } from '../../models/Asset.model.js';
// NOTE : DocumentModel est utilisé car les documents peuvent être attachés à l'Editor [1, 4]


// ------------------ INTERFACES DE TYPAGE ------------------

// Type de l'objet imbriqué contracts_for_review [3]
interface ContractForReviewInput {
    type: string;
    summary: string;
}

// 1. Interface pour les arguments de la Query getEditor
interface GetEditorArgs {
    editorId: string; // ID de l'éditeur (PK)
}

// 2. Interface pour l'Input de la Mutation create/updateEditor
export interface UpdateEditorInput {
    // editorId est requis pour la mise à jour, optionnel pour la création (s'il n'est pas fourni par l'API)
    editorId?: string; 
    
    name?: string;
    country?: string;
    size?: string; // Micro/SME/Mid/Enterprise [2]
    business_criticality?: string; // P1 [2]

    // Champs DD (Section 9a, 4c) [3]
    it_security_strategy?: string[]; // Array de stratégies
    contracts_for_review?: ContractForReviewInput[];
    
    // Champs AISA
    information_security_policy?: string;
    information_security_roles?: string;
    information_security_in_projects?: string;
    external_it_service_provider_responsibilities?: string;
    external_it_service_evaluation?: string;
    information_security_risk_management?: string;
    information_security_compliance_procedures?: string;
    isms_reviewed_by_independent_authority?: string;
    security_incident_management?: string;
    employee_qualification_for_sensitive_work?: string;
    staff_contractually_bound_to_security_policies?: string;
    security_awareness_training?: string;
    mobile_work_policy?: string;
    supplier_security_management?: string;
    compliance_with_regulatory_provisions?: string;
    personal_data_protection?: string; 
}

// ------------------ RESOLVER ------------------

const EditorResolver = {
    
    // Résolveurs de Requêtes Racines (Queries)
    Query: {
        
        // Query 1: Lister tous les éditeurs (Vue Portfolio)
        listEditors: async (_: any) => { 
            // Utilisation de '_: any' pour satisfaire noImplicitAny. Pas d'arguments nécessaires.
            return await EditorModel.find({});
        },

        // Query 2: Récupérer un éditeur par son ID
        getEditor: async (_: any, args: GetEditorArgs) => { 
            const { editorId } = args;
            // editorId est P1 [2]
            return await EditorModel.findOne({ editorId: editorId });
        },

        // Query 3: Lister les éditeurs accessibles selon le rôle de l'utilisateur
        listEditorsForUser: async (_: any, __: any, ctx: any) => {
            const user = ctx.user;
            
            if (!user) {
                return []; // Pas d'utilisateur connecté
            }

            // Admin : tous les éditeurs (même sans éditeur associé)
            if (user.role === 'Admin') {
                // Si l'admin a des éditeurs associés, on peut les filtrer, sinon tous
                // Pour l'instant, on retourne tous les éditeurs
                return await EditorModel.find({});
            }

            // Editor ou EntityDirector : uniquement l'éditeur associé
            if (user.role === 'Editor' || user.role === 'EntityDirector') {
                if (user.associatedEditorId) {
                    // Trouver l'éditeur par editorId (pas _id)
                    const editor = await EditorModel.findOne({ editorId: user.associatedEditorId });
                    return editor ? [editor] : [];
                }
                return []; // Pas d'éditeur associé
            }

            // Supervisor : uniquement les éditeurs dans son portefeuille (associatedEditorIds)
            if (user.role === 'Supervisor') {
                if (user.associatedEditorIds && user.associatedEditorIds.length > 0) {
                    // Retourner uniquement les éditeurs du portefeuille
                    const editors = await EditorModel.find({ 
                        editorId: { $in: user.associatedEditorIds } 
                    });
                    return editors;
                }
                // Si aucun éditeur associé, retourner un tableau vide
                return [];
            }

            return [];
        },
    },

    // Résolveurs de Mutations (Mutations)
    Mutation: {
        
        // Mutation pour créer ou mettre à jour les données de l'éditeur
        updateEditor: async (_: any, { input }: { input: UpdateEditorInput }, ctx: any) => {
            // Utilisation de '_: any' pour satisfaire noImplicitAny
            // On normalise les données d'input pour qu'elles correspondent bien au schéma Mongoose.

            // Préparer les données communes (création + mise à jour)
            const updateData: any = {};
            
            // Copier les champs simples
            if (input.name !== undefined) updateData.name = input.name;
            if (input.country !== undefined) updateData.country = input.country;
            if (input.size !== undefined) updateData.size = input.size;
            if (input.business_criticality !== undefined) updateData.business_criticality = input.business_criticality;
            
            // Gérer it_security_strategy (array de strings)
            // Note: GraphQL peut parfois envoyer des strings JSON au lieu d'arrays
            if (input.it_security_strategy !== undefined) {
                const itSecurityStrategyValue: any = input.it_security_strategy;
                if (Array.isArray(itSecurityStrategyValue)) {
                    updateData.it_security_strategy = itSecurityStrategyValue;
                } else if (typeof itSecurityStrategyValue === 'string') {
                    // Si c'est une string, essayer de parser ou split par sauts de ligne
                    try {
                        const parsed = JSON.parse(itSecurityStrategyValue);
                        updateData.it_security_strategy = Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        // Si ce n'est pas du JSON, split par sauts de ligne (séparateur différent des virgules)
                        updateData.it_security_strategy = itSecurityStrategyValue
                            .split('\n')
                            .map((s: string) => s.trim())
                            .filter((s: string) => s.length > 0);
                    }
                } else {
                    updateData.it_security_strategy = [];
                }
            }

            // Gérer contracts_for_review (array d'objets avec type et summary côté API,
            // stocké en base comme array de strings "Type - Résumé" pour simplifier le schéma)
            if (input.contracts_for_review !== undefined) {
                if (Array.isArray(input.contracts_for_review)) {
                    // S'assurer que chaque élément est un objet avec type et summary,
                    // puis sérialiser en string "Type - Résumé"
                    updateData.contracts_for_review = input.contracts_for_review
                        .map((contract: any) => {
                            if (typeof contract === 'object' && contract !== null) {
                                const type = (contract.type || '').toString().trim();
                                const summary = (contract.summary || '').toString().trim();
                                if (!type && !summary) return null;
                                return summary ? `${type} - ${summary}` : type;
                            }
                            return null;
                        })
                        .filter((val: any) => typeof val === 'string' && val.trim().length > 0);
                } else if (typeof input.contracts_for_review === 'string') {
                    // Si c'est une string, essayer de parser
                    try {
                        const parsed = JSON.parse(input.contracts_for_review);
                        if (Array.isArray(parsed)) {
                            updateData.contracts_for_review = parsed
                                .map((contract: any) => {
                                    if (typeof contract === 'object' && contract !== null) {
                                        const type = (contract.type || '').toString().trim();
                                        const summary = (contract.summary || '').toString().trim();
                                        if (!type && !summary) return null;
                                        return summary ? `${type} - ${summary}` : type;
                                    }
                                    return null;
                                })
                                .filter((val: any) => typeof val === 'string' && val.trim().length > 0);
                        } else {
                            updateData.contracts_for_review = [];
                        }
                    } catch (e) {
                        console.error('Error parsing contracts_for_review:', e);
                        updateData.contracts_for_review = [];
                    }
                } else {
                    updateData.contracts_for_review = [];
                }
            }

            // Si pas d'editorId, on est en mode création
            if (!input.editorId) {
                // Générer éventuellement un editorId si non fourni
                if (!updateData.editorId && input.name) {
                    updateData.editorId = input.name
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9\-]/g, '');
                }
                return await EditorModel.create(updateData as any);
            }

            // Sinon, mise à jour avec upsert sur editorId
            const updatedEditor = await EditorModel.findOneAndUpdate(
                { editorId: input.editorId },
                { $set: updateData },
                { new: true, upsert: true } // Crée ou met à jour
            );
            
            return updatedEditor;
        },
    },
    
    // Résolveurs de CHAMP (Field Resolvers) : Pour lier les entités 
    // qui ne sont pas *embedded* (Solution, DevelopmentTeam, Document, etc.)
    Editor: {
        
        // Normalisation des contrats à réviser pour le type GraphQL ContractForReview
        contracts_for_review: (parent: any) => {
            const raw = (parent as any)?.contracts_for_review || [];

            return raw
                .map((item: any) => {
                    if (!item) return null;

                    // Cas 1 : déjà un objet { type, summary }
                    if (typeof item === 'object') {
                        const type = (item.type ?? '').toString().trim();
                        const summary = (item.summary ?? '').toString().trim();
                        if (!type && !summary) return null;
                        return { type: type || 'Autre', summary: summary || null };
                    }

                    // Cas 2 : stocké comme simple string "Type - Résumé"
                    if (typeof item === 'string') {
                        const text = item.trim();
                        if (!text) return null;
                        const [maybeType, ...rest] = text.split(' - ');
                        const type = (maybeType || 'Autre').trim();
                        const summary = rest.join(' - ').trim() || text;
                        return { type, summary };
                    }

                    return null;
                })
                .filter((v: any) => v !== null);
        },
        
        // Relation 1:N vers Solution [1]
        solutions: async (parent: IEditor & Document) => {
            // Utilise l'ID Mongoose interne (_id) ou editorId pour la jointure
            // Inclut les solutions archivées (tous les utilisateurs peuvent les voir)
            const solutions = await SolutionModel.find({ editorId: parent._id }).sort({ archived: 1, createdAt: -1 });
            // Debug: log pour vérifier les solutions récupérées
            if (solutions.length === 0) {
                console.log(`Debug EditorResolver.solutions: Aucune solution trouvée pour editorId=${parent._id}, editorId string=${parent.editorId}`);
            } else {
                console.log(`Debug EditorResolver.solutions: ${solutions.length} solution(s) trouvée(s) pour editorId=${parent._id}`);
            }
            return solutions;
        },

        // Relation 1:1 vers DevelopmentTeam [5]
        developmentTeam: async (parent: IEditor & Document) => {
            // L'équipe de développement est attachée à l'éditeur (DD Section 6b)
            return await DevelopmentTeamModel.findOne({ editorId: parent._id });
        },
        
        // Relation 0..N vers Document [1, 4]
        documents: async (parent: IEditor & Document) => {
            // Filtre par parentId et s'assure que linkedTo est 'Editor'
            return await DocumentModel.find({ 
                parentId: parent._id, 
                linkedTo: 'Editor' 
            });
        },
        
        // Relation 0..N vers Asset [AISA 3.1]
        assets: async (parent: IEditor & Document) => {
            // Récupère tous les assets de l'éditeur (non archivés par défaut, mais le frontend peut filtrer)
            return await AssetModel.find({ 
                editorId: parent._id,
                archived: { $ne: true }
            }).sort({ name: 1 });
        }
    }
};

export default EditorResolver;