// Fichier : /common/types/Editor.model.ts
// Cette interface représente l'éditeur, l'entité de plus haut niveau.

// Types de base pour les énumérations
export type EditorSize = 'Micro' | 'SME' | 'Mid' | 'Enterprise'; // P2 [6]
export type CriticalityLevel = 'Low' | 'Medium' | 'High' | 'Critical'; // P1 [6]

/**
 * Entité Editor (P1)
 * Représente l'éditeur logiciel.
 */
export interface IEditor {
    editorId: string; // PK, P1 [4, 6]
    name: string; // P1 [4, 6]
    country?: string; // P2 [4, 6]
    size?: EditorSize; // P2 [4, 6]
    business_criticality: CriticalityLevel; // P1 [4, 6]
    
    // Champs supplémentaires de Tech DD (P4/P5)
    internal_it_systems?: string[]; // array of strings [4]
    it_security_strategy?: string; // text [4]
    contracts_for_review?: any[]; // array of objects [4]
}