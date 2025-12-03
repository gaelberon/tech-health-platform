# Vue DD Tech - Documentation

## Vue d'ensemble

La **Vue DD Tech** (Technical Due Diligence) est une interface complète dédiée à l'évaluation pré-acquisition de la situation technique et technologique d'un éditeur de solution logicielle. Elle permet d'avoir une vision rapide et efficace de tous les éléments pertinents pour une Due Diligence Technique.

> 📊 **Référence** : Pour une description complète des entités et de la structure hiérarchique du référentiel (Editor → Solution → Environment), consultez la section [Modèle de Données](#data-model) dans la documentation.

## Accès

La vue DD Tech est accessible via l'onglet **"DD Tech"** 🔍 dans la navigation principale de l'application.

### Permissions

Tous les rôles ont accès à la vue DD Tech en lecture :
- **Admin** : Accès à tous les éditeurs
- **Supervisor** : Accès aux éditeurs de son portefeuille
- **EntityDirector** : Accès à l'éditeur associé
- **Editor** : Accès à l'éditeur associé

## Navigation Hiérarchique

La navigation s'adapte automatiquement selon votre rôle :

### Admin
- **Sélection d'éditeur** : Dropdown avec tous les éditeurs disponibles
- **Sélection de solution** : Dropdown filtré par l'éditeur sélectionné
- **Par défaut** : Premier éditeur sélectionné automatiquement

### Supervisor
- **Sélection d'éditeur** : Dropdown avec les éditeurs de votre portefeuille
- **Sélection de solution** : Dropdown filtré par l'éditeur sélectionné
- **Par défaut** : Premier éditeur du portefeuille sélectionné

### Editor / EntityDirector
- **Éditeur** : Affiché en texte (pas de sélection, fixe à votre éditeur associé)
- **Sélection de solution** : Dropdown avec toutes les solutions de votre éditeur
- **Par défaut** : Première solution sélectionnée automatiquement

## Organisation par Sections CIEC

La vue DD Tech est organisée selon les 7 catégories du référentiel CIEC (Cahier des Informations d'Évaluation et de Contrôle), permettant une évaluation structurée et complète :

### A. Identification et Description Fonctionnelle

Cette section présente les informations fondamentales sur l'éditeur et la solution :

- **Nom de l'éditeur** : Nom de l'entreprise éditrice
- **Nom de la solution** : Nom de la solution logicielle
- **Fonction principale** : Cas d'usage principal de la solution
- **Description** : Description détaillée de la solution
- **Pays d'origine** : Localisation géographique de l'éditeur
- **Taille de l'entreprise** : Micro, SME, Mid, ou Enterprise
- **Criticité métier** : Niveau de criticité (Low, Medium, High, Critical)
- **Systèmes IT internes** : Liste des systèmes informatiques internes utilisés
- **Stratégie de sécurité IT** : Description de la stratégie de sécurité
- **Taille d'équipe adéquate** : Évaluation de l'adéquation de la taille de l'équipe
- **Dépendance aux personnes clés** : Identification des dépendances critiques

### B. Architecture & Hébergement

Cette section regroupe toutes les informations sur l'architecture technique et l'infrastructure d'hébergement :

- **Type de solution** : SaaS, OnPrem, Hybrid, ou ClientHeavy
- **Type de déploiement** : Monolithique, Microservices, ou Hybride
- **Virtualisation/Conteneurisation** : Matériel, VMware, Docker, Kubernetes
- **Stack technique** : Langages, frameworks, bases de données utilisés
- **Hébergeur** : Fournisseur d'hébergement (OVH, Azure, AWS, GCP, etc.)
- **Localisation** : Région/Pays d'hébergement
- **Type d'hébergement** : Datacenter, Private, Public, ou Cloud
- **Certifications** : Certifications obtenues (ISO27001, HDS, SOC2, etc.)
- **Mécanisme de scaling BDD** : Méthode de montée en charge de la base de données

### C. Monitoring / Observabilité

Cette section couvre les capacités de monitoring et d'observabilité :

- **Monitoring des performances** : Oui, Partiel, ou Non
- **Centralisation des logs** : Oui, Partiel, ou Non
- **Outils utilisés** : Liste des outils (Prometheus, Grafana, ELK, Datadog, etc.)

### D. Contraintes, Sécurité, Risques et Conformité

Cette section détaille tous les aspects de sécurité et de conformité :

#### Authentification et Chiffrement
- **Méthode d'authentification** : None, Passwords, MFA, ou SSO
- **Chiffrement en transit** : Oui ou Non
- **Chiffrement au repos** : Oui ou Non

#### Gestion des Vulnérabilités
- **Gestion des patchs** : Ad hoc, Planifiée, ou Automatisée
- **Fréquence des pentests** : Jamais, Annuel, ou Trimestriel
- **Gestion des vulnérabilités** : Aucune, Manuelle, ou Automatisée
- **Contrôle d'accès** : Mécanismes de contrôle d'accès utilisés

#### Audits et Conformité
- **Monitoring centralisé** : Oui ou Non
- **Audits internes récents** : Résumé des audits récents
- **Résumé des résultats de pentests** : Synthèse des derniers tests d'intrusion
- **Failles de sécurité connues** : Identification des failles actuelles
- **Processus de signalement d'incidents** : Description du processus

#### Infrastructure et Données
- **Mécanismes de sécurité réseau** : Liste des mécanismes implémentés
- **Types de données** : Personal, Sensitive, Health, Financial, Synthetic
- **Niveau de redondance** : None, Minimale, Geo-redondant, ou Élevée
- **Existence de sauvegarde** : Oui ou Non
- **Planification des sauvegardes** : Fréquence et méthode
- **RTO (Recovery Time Objective)** : Objectif de temps de récupération en heures
- **RPO (Recovery Point Objective)** : Objectif de point de récupération en heures
- **Plan de reprise après sinistre** : Description du plan DRP
- **Contrats à réviser** : Liste des contrats nécessitant une révision

### E. Évaluation et Stratégie (Volume, Coût et Projection)

Cette section fournit une vue financière et stratégique :

#### Coûts
- **Coûts mensuels d'hébergement** : Montant en euros
- **Coûts mensuels de licences** : Montant en euros
- **Coût total mensuel** : Somme des coûts (mis en évidence)
- **Heures Ops mensuelles (équivalent)** : Temps d'exploitation estimé
- **Coûts cachés** : Identification des coûts non évidents
- **Facteurs d'évolution des coûts** : Éléments pouvant influencer les coûts
- **Besoins d'investissement en modernisation** : Évaluations des besoins
- **Commentaires sur les coûts** : Notes additionnelles

#### Historique des Scores

L'historique complet des snapshots de scoring est affiché avec :
- **Date** : Date de chaque snapshot
- **Score global** : Score sur 100 (code couleur : vert ≥80, jaune ≥60, rouge <60)
- **Scores par catégorie** :
  - Sécurité (30%)
  - Résilience (20%)
  - Observabilité (15%)
  - Architecture (15%)
  - Conformité (20%)

### F. Roadmap & Transformation

Cette section présente les projets techniques à venir :

- **Éléments de roadmap** : Liste des projets prévus
  - **Titre** : Nom du projet
  - **Type** : Refactoring, Migration, Sécurité, Feature, Compliance
  - **Statut** : Planifié, En cours, Terminé, Reporté
  - **Date cible** : Date prévue de réalisation
  - **Impact estimé** : Estimation de l'impact du projet

Si aucun élément n'est disponible, un message indique qu'aucune roadmap n'a été définie.

### G. Notes/Commentaires

Cette section regroupe les informations complémentaires sur le code source et le développement :

#### Code Source
- **Localisation du dépôt** : URL ou emplacement du dépôt de code
- **Niveau de documentation** : Évaluation du niveau de documentation
- **Processus de revue de code** : Description du processus
- **Outil de contrôle de version** : Git, SVN, etc.
- **Dette technique connue** : Identification de la dette technique
- **Systèmes hérités** : Liste des systèmes anciens
- **Dépendances tierces** : Liste des dépendances externes

#### Développement
- **Processus SDLC** : Méthodologie de développement (Scrum, Kanban, Cascade, etc.)
- **Niveau d'automatisation CI/CD** : Degré d'automatisation

#### Fonctionnalités IA

Si la solution intègre des fonctionnalités IA :
- **Type technique** : Description du type d'IA utilisé
- **Méthode de validation de la qualité** : Processus de validation
- **Amélioration continue** : Présence d'un mécanisme d'amélioration

## Affichage des Données

### Organisation Visuelle

Chaque section est présentée dans une carte distincte avec :
- **En-tête** : Titre de la section avec icône emoji
- **Contenu** : Données organisées en lignes clé-valeur
- **Mise en évidence** : Les informations critiques sont mises en évidence (par exemple, le coût total mensuel)

### Gestion des Données Manquantes

- **Champs vides** : Les champs non renseignés ne sont pas affichés
- **Listes vides** : Les listes vides ne sont pas affichées
- **Messages informatifs** : Des messages guident l'utilisateur si aucune donnée n'est disponible

### Focus sur l'Environnement de Production

Par défaut, les informations affichées dans les sections B, C, D et E proviennent de l'environnement de **production**. Cela permet de se concentrer sur l'environnement critique pour l'évaluation pré-acquisition.

## Utilisation

1. **Sélectionner un éditeur** : Choisissez l'éditeur à évaluer dans le dropdown (si applicable)
2. **Sélectionner une solution** : Choisissez la solution à analyser
3. **Parcourir les sections** : Naviguez à travers les 7 sections CIEC pour une évaluation complète
4. **Consulter l'historique** : Vérifiez l'évolution des scores dans la section E

## Cas d'Usage

Cette vue est particulièrement utile pour :
- **Due Diligence pré-acquisition** : Évaluation complète avant un rachat
- **Audit technique** : Analyse approfondie de la santé technique
- **Comparaison** : Comparaison entre différentes solutions ou éditeurs
- **Reporting** : Génération de rapports d'évaluation technique

## Notes Techniques

- **Données en temps réel** : Les données affichées sont récupérées en temps réel depuis la base de données
- **Performance** : Les requêtes sont optimisées pour charger uniquement les données nécessaires
- **Thème** : La vue s'adapte automatiquement au thème choisi (clair ou sombre)
- **Multilingue** : L'interface est disponible en français, anglais et allemand

## Limitations Actuelles

- Les données de la section E (Volume) comme le nombre de clients ou d'utilisateurs ne sont pas encore collectées et n'apparaissent donc pas dans cette vue
- Certaines sections peuvent être vides si les données DD n'ont pas encore été collectées via le workflow de collecte en mode "DD"

