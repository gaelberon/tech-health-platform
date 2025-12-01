// Fichier : /common/types/Environment.model.ts
// Interface pour les environnements de la solution (Production, Test, etc.).

// Types spécifiques à Environment
export type EnvType = 'production' | 'test' | 'dev' | 'backup'; // P1 [7, 14]
export type DataTypes = 'Personal' | 'Sensitive' | 'Health' | 'Financial' | 'Synthetic' | string; // P1 [7]
export type RedundancyLevel = 'none' | 'minimal' | 'geo-redundant' | 'high'; // P1 [7]
export type DeploymentType = 'monolith' | 'microservices' | 'hybrid'; // P2 [7, 14]
export type VirtualizationType = 'physical' | 'VM' | 'container' | 'k8s'; // P2 [7]
export type RestorationTestFrequency = 'daily' | 'weekly' | 'monthly' | 'never'; // Sous-champ [14]

export interface IBackup {
    exists: boolean; // P1 [7]
    schedule?: string; // P1 [7]
    rto: number | null; // Heures, P1 [7]
    rpo: number | null; // Heures, P1 [7]
    restoration_test_frequency?: RestorationTestFrequency; // Sous-champ [14]
}

/**
 * Entité Environment (P1)
 * Environnements (Prod, Dev, Test, Backup)
 */
export interface IEnvironment {
    envId: string; // PK, P1 [7, 14]
    solutionId: string; // FK, P1 [7, 14]
    env_type: EnvType; // P1 [7, 14]
    hostingId: string; // FK vers Hosting, P1 [7]
    deployment_type?: DeploymentType; // P2 [7, 14]
    virtualization?: VirtualizationType; // P2 [7]
    tech_stack?: string[]; // array of strings (languages, BDD), P2 [7, 14]
    data_types: DataTypes[]; // multi enum, P1 [7]
    redundancy: RedundancyLevel; // P1 [7, 14]
    backup: IBackup; // P1 [7, 14]
    sla_offered?: string; // string/percent, P3 [7]
    
    // Champs supplémentaires de Tech DD (P4/P5)
    network_security_mechanisms?: string[]; // array of strings [14]
    db_scaling_mechanism?: 'horizontal' | 'vertical' | 'none'; // enum [14]
    disaster_recovery_plan?: 'documented_tested' | 'documented_untested' | 'none'; // enum [14]
}