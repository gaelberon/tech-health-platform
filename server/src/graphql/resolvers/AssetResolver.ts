import { IResolvers } from '@graphql-tools/utils';
import { AssetModel, IAsset } from '../../models/Asset.model.js';
import { EditorModel } from '../../models/Editor.model.js';

// Interfaces pour les arguments
interface CreateAssetInput {
    editorId: string;
    name: string;
    category: string;
    type: string;
    description?: string;
    
    // Champs AISA - Gestion des actifs (Section 1.3)
    operational_purpose?: string;
    information_owner?: string;
    custodian?: string;
    
    // Classification selon CIA (AISA 1.3.2)
    confidentiality_level?: string;
    integrity_level?: string;
    availability_level?: string;
    
    // Criticité et continuité
    criticality_status?: boolean;
    mtd_hours?: number;
    rpo_mtdl_hours?: number;
    
    // Évaluation et approbation (AISA 1.3.3, 1.3.4)
    approval_status?: string;
    encryption_status?: string;
    
    // Localisation et version
    physical_location?: string;
    version_firmware?: string;
    sbom_reference?: string;
    
    // Cycle de vie
    end_of_life_date?: string;
    last_inventory_date?: string;
    disposal_method?: string;
    
    // Champs AISA - Propriété et utilisation (Section 3.2, 3.3, 3.4)
    ownership?: string;
    acceptable_use?: string;
    return_policy?: string;
}

interface UpdateAssetInput {
    assetId: string;
    name?: string;
    category?: string;
    type?: string;
    description?: string;
    
    // Champs AISA - Gestion des actifs (Section 1.3)
    operational_purpose?: string;
    information_owner?: string;
    custodian?: string;
    
    // Classification selon CIA (AISA 1.3.2)
    confidentiality_level?: string;
    integrity_level?: string;
    availability_level?: string;
    
    // Criticité et continuité
    criticality_status?: boolean;
    mtd_hours?: number;
    rpo_mtdl_hours?: number;
    
    // Évaluation et approbation (AISA 1.3.3, 1.3.4)
    approval_status?: string;
    encryption_status?: string;
    
    // Localisation et version
    physical_location?: string;
    version_firmware?: string;
    sbom_reference?: string;
    
    // Cycle de vie
    end_of_life_date?: string;
    last_inventory_date?: string;
    disposal_method?: string;
    
    // Champs AISA - Propriété et utilisation (Section 3.2, 3.3, 3.4)
    ownership?: string;
    acceptable_use?: string;
    return_policy?: string;
}

// Resolver pour Asset
export const AssetResolver: IResolvers = {
    Query: {
        // Récupérer un asset par son ID
        getAsset: async (_: any, { assetId }: { assetId: string }, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'read');
            
            const asset = await AssetModel.findOne({ assetId, archived: { $ne: true } });
            if (!asset) {
                throw new Error(`Asset avec l'ID ${assetId} non trouvé`);
            }
            
            return asset;
        },
        
        // Lister tous les assets d'un éditeur
        listAssets: async (
            _: any, 
            { editorId, includeArchived = false }: { editorId: string; includeArchived?: boolean },
            ctx: any
        ) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'read');
            
            // Vérifier que l'éditeur existe
            const editor = await EditorModel.findOne({ editorId });
            if (!editor) {
                throw new Error(`Éditeur avec l'ID ${editorId} non trouvé`);
            }
            
            const query: any = { editorId: editor._id };
            if (!includeArchived) {
                query.$or = [{ archived: { $ne: true } }, { archived: { $exists: false } }];
            }
            
            const assets = await AssetModel.find(query).sort({ name: 1 });
            return assets;
        }
    },
    
    Mutation: {
        // Créer un nouvel asset
        createAsset: async (_: any, { input }: { input: CreateAssetInput }, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'write');
            
            // Vérifier que l'éditeur existe
            const editor = await EditorModel.findOne({ editorId: input.editorId });
            if (!editor) {
                throw new Error(`Éditeur avec l'ID ${input.editorId} non trouvé`);
            }
            
            // Générer un assetId unique
            const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const asset = new AssetModel({
                assetId,
                editorId: editor._id,
                name: input.name,
                category: input.category,
                type: input.type,
                description: input.description,
                
                // Champs AISA - Gestion des actifs (Section 1.3)
                operational_purpose: input.operational_purpose,
                information_owner: input.information_owner,
                custodian: input.custodian,
                
                // Classification selon CIA (AISA 1.3.2)
                confidentiality_level: input.confidentiality_level,
                integrity_level: input.integrity_level,
                availability_level: input.availability_level,
                
                // Criticité et continuité
                criticality_status: input.criticality_status,
                mtd_hours: input.mtd_hours,
                rpo_mtdl_hours: input.rpo_mtdl_hours,
                
                // Évaluation et approbation (AISA 1.3.3, 1.3.4)
                approval_status: input.approval_status,
                encryption_status: input.encryption_status,
                
                // Localisation et version
                physical_location: input.physical_location,
                version_firmware: input.version_firmware,
                sbom_reference: input.sbom_reference,
                
                // Cycle de vie
                end_of_life_date: input.end_of_life_date ? new Date(input.end_of_life_date) : undefined,
                last_inventory_date: input.last_inventory_date ? new Date(input.last_inventory_date) : undefined,
                disposal_method: input.disposal_method,
                
                // Champs AISA - Propriété et utilisation (Section 3.2, 3.3, 3.4)
                ownership: input.ownership,
                acceptable_use: input.acceptable_use,
                return_policy: input.return_policy,
                
                archived: false
            });
            
            await asset.save();
            return asset;
        },
        
        // Mettre à jour un asset
        updateAsset: async (_: any, { input }: { input: UpdateAssetInput }, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'write');
            
            const asset = await AssetModel.findOne({ assetId: input.assetId });
            if (!asset) {
                throw new Error(`Asset avec l'ID ${input.assetId} non trouvé`);
            }
            
            // Mettre à jour uniquement les champs fournis
            if (input.name !== undefined) asset.name = input.name;
            if (input.category !== undefined) asset.category = input.category as any;
            if (input.type !== undefined) asset.type = input.type as any;
            if (input.description !== undefined) asset.description = input.description;
            
            // Champs AISA - Gestion des actifs (Section 1.3)
            if (input.operational_purpose !== undefined) asset.operational_purpose = input.operational_purpose;
            if (input.information_owner !== undefined) asset.information_owner = input.information_owner;
            if (input.custodian !== undefined) asset.custodian = input.custodian;
            
            // Classification selon CIA (AISA 1.3.2)
            if (input.confidentiality_level !== undefined) asset.confidentiality_level = input.confidentiality_level;
            if (input.integrity_level !== undefined) asset.integrity_level = input.integrity_level;
            if (input.availability_level !== undefined) asset.availability_level = input.availability_level;
            
            // Criticité et continuité
            if (input.criticality_status !== undefined) asset.criticality_status = input.criticality_status;
            if (input.mtd_hours !== undefined) asset.mtd_hours = input.mtd_hours;
            if (input.rpo_mtdl_hours !== undefined) asset.rpo_mtdl_hours = input.rpo_mtdl_hours;
            
            // Évaluation et approbation (AISA 1.3.3, 1.3.4)
            if (input.approval_status !== undefined) asset.approval_status = input.approval_status;
            if (input.encryption_status !== undefined) asset.encryption_status = input.encryption_status;
            
            // Localisation et version
            if (input.physical_location !== undefined) asset.physical_location = input.physical_location;
            if (input.version_firmware !== undefined) asset.version_firmware = input.version_firmware;
            if (input.sbom_reference !== undefined) asset.sbom_reference = input.sbom_reference;
            
            // Cycle de vie
            if (input.end_of_life_date !== undefined) {
                if (input.end_of_life_date) {
                    asset.end_of_life_date = new Date(input.end_of_life_date);
                } else {
                    (asset as any).end_of_life_date = undefined;
                }
            }
            if (input.last_inventory_date !== undefined) {
                if (input.last_inventory_date) {
                    asset.last_inventory_date = new Date(input.last_inventory_date);
                } else {
                    (asset as any).last_inventory_date = undefined;
                }
            }
            if (input.disposal_method !== undefined) asset.disposal_method = input.disposal_method;
            
            // Champs AISA - Propriété et utilisation (Section 3.2, 3.3, 3.4)
            if (input.ownership !== undefined) asset.ownership = input.ownership;
            if (input.acceptable_use !== undefined) asset.acceptable_use = input.acceptable_use;
            if (input.return_policy !== undefined) asset.return_policy = input.return_policy;
            
            await asset.save();
            return {
                ...asset.toObject(),
                end_of_life_date: asset.end_of_life_date ? asset.end_of_life_date.toISOString() : null,
                last_inventory_date: asset.last_inventory_date ? asset.last_inventory_date.toISOString() : null,
                archivedAt: asset.archivedAt ? asset.archivedAt.toISOString() : null
            };
        },
        
        // Supprimer un asset
        deleteAsset: async (_: any, { assetId }: { assetId: string }, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'write');
            
            const asset = await AssetModel.findOne({ assetId });
            if (!asset) {
                throw new Error(`Asset avec l'ID ${assetId} non trouvé`);
            }
            
            await AssetModel.deleteOne({ assetId });
            return true;
        },
        
        // Archiver un asset
        archiveAsset: async (_: any, { assetId }: { assetId: string }, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'write');
            
            const asset = await AssetModel.findOne({ assetId });
            if (!asset) {
                throw new Error(`Asset avec l'ID ${assetId} non trouvé`);
            }
            
            asset.archived = true;
            asset.archivedAt = new Date();
            asset.archivedBy = ctx.user?.userId || 'unknown';
            
            await asset.save();
            return {
                ...asset.toObject(),
                end_of_life_date: asset.end_of_life_date ? asset.end_of_life_date.toISOString() : null,
                last_inventory_date: asset.last_inventory_date ? asset.last_inventory_date.toISOString() : null,
                archivedAt: asset.archivedAt ? asset.archivedAt.toISOString() : null
            };
        }
    },
    
    // Field Resolver pour Editor.assets
    Editor: {
        assets: async (parent: any, _: any, ctx: any) => {
            const { assertAuthorized } = await import('../authorization.js');
            await assertAuthorized(ctx, 'read');
            
            const assets = await AssetModel.find({
                editorId: parent._id,
                $or: [{ archived: { $ne: true } }, { archived: { $exists: false } }]
            }).sort({ name: 1 });
            
            return assets.map(asset => ({
                ...asset.toObject(),
                end_of_life_date: asset.end_of_life_date ? asset.end_of_life_date.toISOString() : null,
                last_inventory_date: asset.last_inventory_date ? asset.last_inventory_date.toISOString() : null,
                archivedAt: asset.archivedAt ? asset.archivedAt.toISOString() : null
            }));
        }
    }
};

