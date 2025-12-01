// Fichier : /server/src/config/seedLookups.ts
// Script de peuplement initial des lookups P1

import { LookupModel } from '../models/Lookup.model.js';

export async function seedInitialLookups() {
  const lookups = [
    {
      key: 'BUSINESS_CRITICALITY',
      category: 'P1',
      entity: 'Editor',
      formLabel: 'Criticité Métier',
      description: 'Niveaux de criticité métier pour les éditeurs',
      values: [
        { code: 'Low', label: 'Faible', label_fr: 'Faible', label_en: 'Low', description: 'Impact métier limité en cas d\'indisponibilité', order: 1, active: true },
        { code: 'Medium', label: 'Moyenne', label_fr: 'Moyenne', label_en: 'Medium', description: 'Impact métier modéré en cas d\'indisponibilité', order: 2, active: true },
        { code: 'High', label: 'Élevée', label_fr: 'Élevée', label_en: 'High', description: 'Impact métier important en cas d\'indisponibilité', order: 3, active: true },
        { code: 'Critical', label: 'Critique', label_fr: 'Critique', label_en: 'Critical', description: 'Impact métier critique en cas d\'indisponibilité', order: 4, active: true },
      ],
    },
    {
      key: 'SOLUTION_TYPES',
      category: 'P1',
      entity: 'Solution',
      formLabel: 'Mode Logiciel (Type)',
      description: 'Types de solutions/logiciels',
      values: [
        { code: 'SaaS', label: 'Software as a Service', label_fr: 'Logiciel en tant que Service', label_en: 'Software as a Service', description: 'Solution hébergée et accessible via Internet', order: 1, active: true },
        { code: 'OnPrem', label: 'On-Premise', label_fr: 'Sur site', label_en: 'On-Premise', description: 'Solution installée et gérée sur les serveurs du client', order: 2, active: true },
        { code: 'Hybrid', label: 'Hybride', label_fr: 'Hybride', label_en: 'Hybrid', description: 'Combinaison de SaaS et On-Premise', order: 3, active: true },
        { code: 'ClientHeavy', label: 'Client Lourd', label_fr: 'Client Lourd', label_en: 'Client Heavy', description: 'Application nécessitant une installation client importante', order: 4, active: true },
        { code: 'FullWeb', label: 'Application Web Complète', label_fr: 'Application Web Complète', label_en: 'Full Web Application', description: 'Application web complète accessible via navigateur', order: 5, active: true },
      ],
    },
    {
      key: 'DATA_TYPES',
      category: 'P1',
      entity: 'Environment',
      formLabel: 'Types de Données Hébergées',
      description: 'Types de données hébergées',
      values: [
        { code: 'Personal', label: 'Données Personnelles', label_fr: 'Données Personnelles', label_en: 'Personal Data', description: 'Données personnelles soumises au RGPD', order: 1, active: true },
        { code: 'Sensitive', label: 'Données Sensibles', label_fr: 'Données Sensibles', label_en: 'Sensitive Data', description: 'Données sensibles nécessitant une protection renforcée', order: 2, active: true },
        { code: 'Health', label: 'Données de Santé', label_fr: 'Données de Santé', label_en: 'Health Data', description: 'Données de santé soumises à la certification HDS', order: 3, active: true },
        { code: 'Financial', label: 'Données Financières', label_fr: 'Données Financières', label_en: 'Financial Data', description: 'Données financières soumises à des réglementations strictes', order: 4, active: true },
        { code: 'Synthetic', label: 'Données Synthétiques', label_fr: 'Données Synthétiques', label_en: 'Synthetic Data', description: 'Données générées artificiellement (non sensibles)', order: 5, active: true },
      ],
    },
    {
      key: 'REDUNDANCY_LEVELS',
      category: 'P1',
      entity: 'Environment',
      formLabel: 'Niveau de Redondance',
      description: 'Niveaux de redondance pour les environnements',
      values: [
        { code: 'none', label: 'Aucune', label_fr: 'Aucune', label_en: 'None', description: 'Pas de redondance configurée', order: 1, active: true },
        { code: 'minimal', label: 'Minimale', label_fr: 'Minimale', label_en: 'Minimal', description: 'Redondance minimale (ex: sauvegarde locale)', order: 2, active: true },
        { code: 'geo-redundant', label: 'Géo-redondante', label_fr: 'Géo-redondante', label_en: 'Geo-redundant', description: 'Redondance géographique (plusieurs datacenters)', order: 3, active: true },
        { code: 'high', label: 'Élevée', label_fr: 'Élevée', label_en: 'High', description: 'Redondance élevée avec failover automatique', order: 4, active: true },
      ],
    },
    {
      key: 'AUTH_TYPES',
      category: 'P1',
      entity: 'Security',
      formLabel: 'Authentification',
      description: 'Types d\'authentification',
      values: [
        { code: 'None', label: 'Aucune', label_fr: 'Aucune', label_en: 'None', description: 'Pas d\'authentification requise', order: 1, active: true },
        { code: 'Passwords', label: 'Mots de passe', label_fr: 'Mots de passe', label_en: 'Passwords', description: 'Authentification par mot de passe simple', order: 2, active: true },
        { code: 'MFA', label: 'Authentification Multi-Facteurs', label_fr: 'Authentification Multi-Facteurs', label_en: 'Multi-Factor Authentication', description: 'Authentification à deux facteurs (2FA/MFA)', order: 3, active: true },
        { code: 'SSO', label: 'Single Sign-On', label_fr: 'Authentification Unique', label_en: 'Single Sign-On', description: 'Authentification unique via un fournisseur d\'identité', order: 4, active: true },
      ],
    },
  ];

  for (const lookup of lookups) {
    await LookupModel.findOneAndUpdate(
      { key: lookup.key },
      lookup,
      { upsert: true, new: true }
    );
  }

  console.log('✅ Lookups P1 initialisés avec succès');
}

