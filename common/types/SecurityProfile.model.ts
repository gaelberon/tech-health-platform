// Fichier : /common/types/SecurityProfile.model.ts
// Interface pour les aspects de sécurité.

// Types spécifiques à SecurityProfile
export type AuthType = 'None' | 'Passwords' | 'MFA' | 'SSO'; // P1 [8]
export type PatchingLevel = 'ad_hoc' | 'scheduled' | 'automated'; // P2 [8]
export type PentestFreq = 'never' | 'annual' | 'quarterly'; // P3 [8]
export type VulnMgmt = 'none' | 'manual' | 'automated'; // P2 [8]

export interface IEncryption {
    in_transit: boolean; // P1 [8]
    at_rest: boolean; // P1 [8]
    details?: string; // P1 [8]
}

/**
 * Entité SecurityProfile (P1)
 * Profil de sécurité de l'environnement.
 */
export interface ISecurityProfile {
    secId: string; // PK, P1 [8, 12]
    envId: string; // FK, P1 [8, 12]
    auth: AuthType; // P1 [8, 12]
    encryption: IEncryption; // P1 [8, 12]
    pentest_freq?: PentestFreq; // P3 [8, 12]
    vuln_mgmt?: VulnMgmt | string; // P2 [8, 12]
    
    // Champs supplémentaires de Tech DD (P4/P5)
    internal_audits_recent?: string; // text [12]
    centralized_monitoring?: boolean; // boolean [12]
    pentest_results_summary?: string; // text/link [12]
    known_security_flaws?: string; // text [12]
    incident_reporting_process?: string; // text [12]
}