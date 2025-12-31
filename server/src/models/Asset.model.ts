import { Schema, model, Document, Types } from 'mongoose';

// Types Enum pour les catégories d'actifs
export type AssetCategory = 'intangible' | 'digital_and_data' | 'tangible' | 'financial';

// Types d'actifs selon la catégorie
// Intangible
export type IntangibleAssetType = 
  | 'ip_source_code'
  | 'ip_patent'
  | 'ip_trademark'
  | 'ip_copyright'
  | 'commercial_customer_database'
  | 'commercial_maintenance_subscription'
  | 'commercial_brand_equity'
  | 'human_capital_core_competencies'
  | 'human_capital_internal_processes';

// Digital and Data
export type DigitalAssetType =
  | 'usage_data'
  | 'logical_cloud_infrastructure'
  | 'documentation';

// Tangible
export type TangibleAssetType =
  | 'it_hardware'
  | 'furniture_fixtures'
  | 'real_estate';

// Financial
export type FinancialAssetType =
  | 'cash_cash_equivalents'
  | 'accounts_receivable'
  | 'investments';

export type AssetType = IntangibleAssetType | DigitalAssetType | TangibleAssetType | FinancialAssetType;

// Interface TypeScript pour l'entité Asset
export interface IAsset extends Document {
    assetId: string; // Identifiant unique (PK)
    editorId: Types.ObjectId; // Lien vers l'éditeur (FK)
    name: string; // Nom de l'actif (P1, AISA 1.3.1)
    category: AssetCategory; // Catégorie de l'actif (P1)
    type: AssetType; // Type spécifique de l'actif (P1, AISA 1.3.1)
    description?: string; // Description optionnelle (P2)
    
    // Champs AISA - Gestion des actifs (Section 1.3)
    operational_purpose?: string; // AISA 1.3.1 - But opérationnel spécifique
    information_owner?: string; // AISA 1.3.1 - Personne responsable de l'information (Risk Owner)
    custodian?: string; // AISA 1.3.1 - Responsable technique de la maintenance (ex: Admin IT)
    
    // Classification selon CIA (AISA 1.3.2)
    confidentiality_level?: string; // Niveau de confidentialité (Public, Interne, Confidentiel, Strictement Confidentiel)
    integrity_level?: string; // Niveau requis pour l'intégrité
    availability_level?: string; // Niveau requis pour la disponibilité
    
    // Criticité et continuité
    criticality_status?: boolean; // AISA 1.3.2 - Indicateur si l'actif est critique
    mtd_hours?: number; // Max Tolerable Downtime (en heures)
    rpo_mtdl_hours?: number; // Recovery Point Objective / Maximum Tolerable Data Loss (en heures)
    
    // Évaluation et approbation (AISA 1.3.3, 1.3.4)
    approval_status?: string; // État de l'évaluation (Évalué, Approuvé, Rejeté)
    encryption_status?: string; // AISA 3.1.4 - Type de chiffrement (notamment pour actifs mobiles)
    
    // Localisation et version
    physical_location?: string; // AISA 3.1.3 - Site physique ou zone de sécurité
    version_firmware?: string; // Version logicielle ou matérielle actuelle
    sbom_reference?: string; // Lien vers la nomenclature logicielle (Software Bill of Materials)
    
    // Cycle de vie
    end_of_life_date?: Date; // Date de fin de support par le constructeur/éditeur
    last_inventory_date?: Date; // AISA 1.3.1 - Date de la dernière vérification physique ou logique
    disposal_method?: string; // AISA 3.1.3 - Méthode prévue pour la destruction sécurisée
    
    // Champs AISA - Propriété et utilisation (Section 3.2, 3.3, 3.4)
    ownership?: string; // AISA 3.2 - Ownership of Assets
    acceptable_use?: string; // AISA 3.3 - Acceptable Use of Assets
    return_policy?: string; // AISA 3.4 - Return of Assets
    
    // Champs d'archivage
    archived?: boolean;
    archivedAt?: Date;
    archivedBy?: string; // userId de l'admin/supervisor qui a archivé
}

// Schéma Mongoose
const AssetSchema = new Schema<IAsset>({
    assetId: { 
        type: String, 
        required: true, 
        unique: true,
        description: "Identifiant unique de l'actif (P1)"
    },
    editorId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Editor', 
        required: true,
        description: "Référence vers l'éditeur (P1, AISA 3.1)"
    },
    name: { 
        type: String, 
        required: true,
        description: "Nom de l'actif (P1, AISA 3.1)"
    },
    category: { 
        type: String, 
        enum: ['intangible', 'digital_and_data', 'tangible', 'financial'],
        required: true,
        description: "Catégorie de l'actif (P1, AISA 3.1)"
    },
    type: { 
        type: String, 
        required: true,
        description: "Type spécifique de l'actif (P1, AISA 3.1)"
    },
    description: { 
        type: String, 
        required: false,
        description: "Description de l'actif (P2)"
    },
    
    // Champs AISA - Gestion des actifs (Section 1.3)
    operational_purpose: { 
        type: String, 
        required: false,
        description: "But opérationnel spécifique (AISA 1.3.1)"
    },
    information_owner: { 
        type: String, 
        required: false,
        description: "Personne responsable de l'information / Risk Owner (AISA 1.3.1)"
    },
    custodian: { 
        type: String, 
        required: false,
        description: "Responsable technique de la maintenance (ex: Admin IT) (AISA 1.3.1)"
    },
    
    // Classification selon CIA (AISA 1.3.2)
    confidentiality_level: { 
        type: String, 
        required: false,
        description: "Niveau de confidentialité (Public, Interne, Confidentiel, Strictement Confidentiel) (AISA 1.3.2)"
    },
    integrity_level: { 
        type: String, 
        required: false,
        description: "Niveau requis pour l'intégrité (AISA 1.3.2)"
    },
    availability_level: { 
        type: String, 
        required: false,
        description: "Niveau requis pour la disponibilité (AISA 1.3.2)"
    },
    
    // Criticité et continuité
    criticality_status: { 
        type: Boolean, 
        required: false,
        description: "Indicateur si l'actif est critique (AISA 1.3.2)"
    },
    mtd_hours: { 
        type: Number, 
        required: false,
        description: "Max Tolerable Downtime (en heures)"
    },
    rpo_mtdl_hours: { 
        type: Number, 
        required: false,
        description: "Recovery Point Objective / Maximum Tolerable Data Loss (en heures)"
    },
    
    // Évaluation et approbation (AISA 1.3.3, 1.3.4)
    approval_status: { 
        type: String, 
        required: false,
        description: "État de l'évaluation (Évalué, Approuvé, Rejeté) (AISA 1.3.3, 1.3.4)"
    },
    encryption_status: { 
        type: String, 
        required: false,
        description: "Type de chiffrement (notamment pour actifs mobiles) (AISA 3.1.4)"
    },
    
    // Localisation et version
    physical_location: { 
        type: String, 
        required: false,
        description: "Site physique ou zone de sécurité (AISA 3.1.3)"
    },
    version_firmware: { 
        type: String, 
        required: false,
        description: "Version logicielle ou matérielle actuelle"
    },
    sbom_reference: { 
        type: String, 
        required: false,
        description: "Lien vers la nomenclature logicielle (Software Bill of Materials)"
    },
    
    // Cycle de vie
    end_of_life_date: { 
        type: Date, 
        required: false,
        description: "Date de fin de support par le constructeur/éditeur"
    },
    last_inventory_date: { 
        type: Date, 
        required: false,
        description: "Date de la dernière vérification physique ou logique (AISA 1.3.1)"
    },
    disposal_method: { 
        type: String, 
        required: false,
        description: "Méthode prévue pour la destruction sécurisée (AISA 3.1.3)"
    },
    
    // Champs AISA - Propriété et utilisation (Section 3.2, 3.3, 3.4)
    ownership: { 
        type: String, 
        required: false,
        description: "Propriété de l'actif (AISA 3.2)"
    },
    acceptable_use: { 
        type: String, 
        required: false,
        description: "Utilisation acceptable de l'actif (AISA 3.3)"
    },
    return_policy: { 
        type: String, 
        required: false,
        description: "Politique de retour de l'actif (AISA 3.4)"
    },
    
    // Champs d'archivage
    archived: { 
        type: Boolean, 
        default: false, 
        index: true,
        description: "Indique si l'actif est archivé"
    },
    archivedAt: { 
        type: Date, 
        required: false,
        description: "Date d'archivage"
    },
    archivedBy: { 
        type: String, 
        required: false,
        description: "userId de l'admin/supervisor qui a archivé"
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// Index pour améliorer les performances des requêtes
AssetSchema.index({ editorId: 1, archived: 1 });
AssetSchema.index({ category: 1 });
AssetSchema.index({ type: 1 });

// Export du modèle
export const AssetModel = model<IAsset>('Asset', AssetSchema, 'assets');

