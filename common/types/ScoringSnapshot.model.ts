// Fichier : /common/types/ScoringSnapshot.model.ts
// Interface de l'entité critique pour le Moteur de Scoring.

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'; // P1 [15]

/**
 * Interface garantissant que les cinq scores de catégorie sont toujours présents.
 * Utilisée par le Moteur de Scoring et le Dashboard.
 */
export interface ICategoryScores {
    security: number; // 30% [16]
    resilience: number; // 20% [16]
    observability: number; // 15% [16]
    architecture: number; // 15% [16]
    compliance: number; // 20% [16]
}

/**
 * Entité ScoringSnapshot (P1)
 * Stocke le résultat du scoring à un instant donné.
 */
export interface IScoringSnapshot {
    scoreId: string; // PK, P1 [10]
    solutionId: string; // FK [10]
    envId: string; // FK (ajouté pour la relation Environment) [9]
    date: Date; // P1 [10]
    scores: ICategoryScores; // P1 (object with category scores) [9, 10]
    global_score: number; // P1 [10]
    risk_level: RiskLevel; // P1 [10, 15]
    notes: string; // P1 (recommandations automatiques) [10, 17]
}