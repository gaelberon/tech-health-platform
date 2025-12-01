// Fichier : /common/types/Hosting.model.ts
// Interface pour l'hébergement, référencée par Environment.

// Types spécifiques au Hosting
export type HostingTier = 'datacenter' | 'private' | 'public' | 'cloud'; // P1 [8]
export type Certification = 'ISO27001' | 'HDS' | 'SOC2' | 'NF525' | 'Datadock' | string; // P2 [8, 13]

/**
 * Entité Hosting (P1)
 * Détails de l'infrastructure d'hébergement.
 */
export interface IHosting {
    hostingId: string; // PK, P1 [8, 12]
    provider: string; // enum/free-text, P1 (ex: OVH, Azure, GCP) [8, 12]
    region: string; // P1 [8, 12]
    tier: HostingTier; // P1 [8]
    certifications?: Certification[]; // P2 [8, 12]
    contact?: { name: string; email: string }; // P4 [8]
}