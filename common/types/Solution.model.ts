// Fichier : /common/types/Solution.model.ts
// Cette interface représente la solution logicielle de l'éditeur

// Importation du type CriticalityLevel défini dans Editor.model.ts
import { CriticalityLevel } from './Editor.model';

// Types spécifiques à la Solution
export type SolutionType = 'SaaS' | 'OnPrem' | 'Hybrid' | 'ClientHeavy'; // P1 [6, 11]

/**
 * Entité Solution (P1)
 * Représente le produit logiciel spécifique.
 */
export interface ISolution {
    solutionId: string; // PK, P1 [6, 11]
    editorId: string; // FK, P1 [6, 11]
    name: string; // P1 [6, 11]
    description?: string; // text short, P2 [6]
    main_use_case: string; // P1 [6]
    type: SolutionType; // P1 [6, 11]
    product_criticality: CriticalityLevel; // P1 (mapping to business_criticality) [6, 11]

    // Champs supplémentaires de Tech DD (P4/P5)
    api_robustness?: string; // enum/text [11]
    api_documentation_quality?: 'high' | 'medium' | 'low' | 'none'; // enum [11]
    ip_ownership_clear?: boolean; // boolean [11]
    licensing_model?: string; // string/enum [11]
    license_compliance_assured?: boolean; // boolean [11]
}