/**
 * Script de mise à jour des actifs de l'éditeur Inedee
 *
 * Source : Tableau des Actifs Inedee basé sur le dossier de certification ISO 27001 et le modèle AISA
 *
 * Hypothèses :
 * - L'éditeur "Inedee" existe déjà en base (entité `Editor`)
 * - Les actifs seront créés ou mis à jour (upsert basé sur le nom)
 *
 * Usage :
 *   cd server
 *   npm run update-inedee-assets
 *   OU
 *   npx ts-node --esm src/scripts/updateInedeeAssets.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { EditorModel } from '../models/Editor.model.js';
import { AssetModel, IAsset } from '../models/Asset.model.js';

// Interface pour représenter un actif du tableau
interface AssetData {
  name: string;
  category: 'digital_and_data' | 'tangible' | 'intangible' | 'financial';
  type: string;
  description?: string;
  operational_purpose?: string;
  information_owner?: string;
  custodian?: string;
  confidentiality_level?: string;
  integrity_level?: string;
  availability_level?: string;
  criticality_status?: boolean;
  mtd_hours?: number;
  encryption_status?: string;
}

// Fonction pour créer un slug à partir d'un nom (pour assetId)
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplace les caractères non alphanumériques par des tirets
    .replace(/^-+|-+$/g, ''); // Supprime les tirets en début et fin
}


async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL;

  if (!mongoUri) {
    console.error('❌ MONGODB_URI (ou MONGO_URL) non défini dans les variables d\'environnement.');
    process.exit(1);
  }

  console.log('🔗 Connexion à MongoDB...');
  await mongoose.connect(mongoUri);
  console.log(`✅ Connecté à MongoDB: ${mongoose.connection.host}`);

  try {
    // 1. Récupération de l'Editor Inedee
    console.log('\n🔍 Recherche de l\'éditeur "Inedee"...');
    const editor = await EditorModel.findOne({
      name: { $regex: /^inedee$/i },
    });

    if (!editor) {
      console.error('❌ Éditeur "Inedee" introuvable en base. Abandon du script.');
      return;
    }

    console.log(`✅ Éditeur trouvé : ${editor.name} (id=${editor._id.toString()})`);

    // 2. Définition des actifs depuis le tableau fourni
    const assetsData: AssetData[] = [
      {
        name: 'Antivirus / EDR WithSecure',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Solution EDR centralisée pour la surveillance et la détection d\'intrusions sur les postes finaux.',
        information_owner: 'Philippe Lachenko',
        custodian: 'Solutions Informatiques',
        confidentiality_level: 'Interne',
        integrity_level: 'Critique',
        availability_level: 'Haute',
        encryption_status: 'N/A',
      },
      {
        name: 'Cryptr (SSO)',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Middleware d\'authentification SSO (SAML, AzureAD) pour l\'ERP Inedee.',
        information_owner: 'Philippe Lachenko',
        custodian: 'Cryptr (SAS)',
        criticality_status: true,
        mtd_hours: 24,
        encryption_status: 'TLS 1.2 min',
      },
      {
        name: 'Digiforma (formation)',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'ERP SaaS pour la gestion administrative et pédagogique des formations.',
        information_owner: 'Christine Billion',
        custodian: 'A World For Us',
        confidentiality_level: 'Restreint',
        integrity_level: 'Importante',
        availability_level: 'Limitée',
        encryption_status: 'AES-256 (Repos) / SSL (Transit)',
      },
      {
        name: 'ERP Inedee (usage interne)',
        category: 'digital_and_data',
        type: 'usage_data',
        operational_purpose: 'Solution 100% Cloud de gestion commerciale, projet et comptabilité.',
        information_owner: 'Philippe Lachenko',
        custodian: 'Armonie (IBM i AS/400)',
        criticality_status: true,
        confidentiality_level: 'Confidentiel',
        integrity_level: 'Critique',
        availability_level: 'Critique',
        encryption_status: 'HTTPS/TLS 1.2+',
      },
      {
        name: 'Firewall Fortinet',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Pare-feu Fortigate assurant la sécurité périmétrique et le filtrage des flux.',
        information_owner: 'INEDEE',
        custodian: 'Solutions Informatiques',
        availability_level: 'Critique',
        encryption_status: 'N/A',
      },
      {
        name: 'GLPI (inventaire)',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Outil de gestion et d\'inventaire du parc informatique (logiciels et matériels).',
        information_owner: 'INEDEE',
        custodian: 'Solutions Informatiques',
        confidentiality_level: 'Interne',
        encryption_status: 'N/A',
      },
      {
        name: 'Gandi (DNS)',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Gestion des noms de domaine et des DNS techniques.',
        information_owner: 'INEDEE',
        custodian: 'Gandi (SAS)',
        availability_level: 'Critique',
        encryption_status: 'N/A',
      },
      {
        name: 'Microsoft 365',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Suite collaborative (Outlook, Teams, Office) en mode SaaS.',
        information_owner: 'Philippe Lachenko',
        custodian: 'Microsoft / Solutions IT',
        confidentiality_level: 'Restreint/Confidentiel',
        integrity_level: 'Critique',
        availability_level: 'Haute',
        encryption_status: 'TLS 1.3 / AES-256',
      },
      {
        name: 'Microsoft Azure',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Infrastructure Cloud gérant Entra ID (gestion des identités).',
        information_owner: 'Philippe Lachenko',
        custodian: 'Microsoft / Eliade',
        availability_level: 'Critique',
        encryption_status: 'Azure Backup / BitLocker',
      },
      {
        name: 'Mindee (OCR)',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Service de reconnaissance optique de caractères (OCR) pour les documents.',
        information_owner: 'Philippe Lachenko',
        custodian: 'Mindee (SAS)',
        confidentiality_level: 'Interne',
        encryption_status: 'Canal sécurisé',
      },
      {
        name: 'SharePoint',
        category: 'digital_and_data',
        type: 'usage_data',
        operational_purpose: 'Plateforme de stockage documentaire et de collaboration.',
        information_owner: 'Philippe Lachenko / Cécile Hodierne',
        custodian: 'Solutions IT (Droits)',
        confidentiality_level: 'Restreint/Confidentiel',
        integrity_level: 'Critique',
        availability_level: 'Haute',
        encryption_status: 'AES-256 / TLS 1.2',
      },
      {
        name: 'Sylae (paie)',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Portail de gestion des aides à l\'embauche et données RH.',
        information_owner: 'INEDEE',
        custodian: 'ASP Public',
        confidentiality_level: 'Restreint',
        encryption_status: 'N/A',
      },
      {
        name: 'Universign (signature)',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Plateforme SaaS de signature électronique et d\'horodatage qualifié.',
        information_owner: 'INEDEE',
        custodian: 'Universign / Yousign',
        integrity_level: 'Critique (Valeur juridique)',
        encryption_status: 'SHA-256 / RSA 4096',
      },
      // Actifs Digital & Data supplémentaires
      {
        name: 'Generix (Ebics)',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Solution pour les flux bancaires sécurisés (protocole EBICS) intégrée à la comptabilité.',
        information_owner: 'Philippe Lachenko',
        custodian: 'Generix Group',
        integrity_level: 'Critique (Intégrité des flux financiers)',
        encryption_status: 'N/A (spécifié comme sécurisé)',
      },
      {
        name: 'Perspecteev (Bridge)',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'API de récupération et d\'agrégation des relevés bancaires pour les clients de l\'ERP.',
        information_owner: 'Philippe Lachenko',
        custodian: 'Perspecteev SAS',
        confidentiality_level: 'Restreint',
        integrity_level: 'Importante',
        encryption_status: 'API sécurisée',
      },
      {
        name: 'Stellar',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Outil SaaS dédié au pilotage et à la gestion du SMSI (Système de Management de la Sécurité de l\'Information).',
        information_owner: 'Philippe Lachenko / RSSI',
        custodian: 'Stellar',
        confidentiality_level: 'Confidentiel',
        integrity_level: 'Critique',
        encryption_status: 'N/A',
      },
      {
        name: 'Dropbox',
        category: 'digital_and_data',
        type: 'usage_data',
        operational_purpose: 'Stockage cloud utilisé pour les usages administratifs internes d\'Inedee.',
        information_owner: 'Philippe Lachenko',
        custodian: 'Dropbox',
        confidentiality_level: 'Restreint / Confidentiel',
        encryption_status: 'AES-256 (Repos) / ISO 27001',
      },
      {
        name: 'Uptrends',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Sonde de surveillance quotidienne vérifiant la disponibilité des certificats et l\'accès aux sites fournisseurs.',
        information_owner: 'Philippe Lachenko',
        custodian: 'Uptrends',
        availability_level: 'Haute (Suivi des SLA)',
        encryption_status: 'HTTPS',
      },
      {
        name: 'Cockpit ITSM',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Plateforme de supervision, CMDB et ticketing pour l\'infrastructure serveur AS/400.',
        information_owner: 'Philippe Lachenko',
        custodian: 'Armonie',
        availability_level: 'Critique',
        encryption_status: 'Accès via Bastion sécurisé',
      },
      {
        name: 'PDF24',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Service de conversion de documents HTML vers le format PDF pour l\'ERP.',
        information_owner: 'Philippe Lachenko',
        custodian: 'Geek Software GmbH',
        availability_level: 'Haute (Processus ERP)',
        encryption_status: 'Suppression après 1h sur serveur',
      },
      {
        name: 'Hellowork (CVTHEQUE)',
        category: 'digital_and_data',
        type: 'usage_data',
        operational_purpose: 'Plateforme de gestion des candidatures et accès à la CVthèque pour le recrutement.',
        information_owner: 'Philippe Lachenko',
        custodian: 'Hellowork',
        confidentiality_level: 'Restreint (Données personnelles)',
        encryption_status: 'N/A',
      },
      {
        name: 'Sendinblue (Brevo)',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Solution SaaS utilisée pour les opérations de prospection commerciale de masse.',
        information_owner: 'Antoine Clément / Arthur Guillaud',
        custodian: 'Sendinblue',
        confidentiality_level: 'Interne',
        encryption_status: 'N/A',
      },
      {
        name: 'Blancco',
        category: 'digital_and_data',
        type: 'logical_cloud_infrastructure',
        operational_purpose: 'Logiciel utilisé pour l\'effacement sécurisé et certifié des données sur les disques durs mis au rebut.',
        information_owner: 'Fania Mohamed',
        custodian: 'Solutions Informatiques',
        integrity_level: 'Critique (Preuve d\'effacement)',
        encryption_status: 'Signature numérique des rapports',
      },
      // Actifs Tangible
      {
        name: 'Clé de sécurité Yubikey',
        category: 'tangible',
        type: 'it_hardware',
        operational_purpose: 'Token physique requis par les prestataires pour accéder au gestionnaire de mots de passe centralisé.',
        information_owner: 'Solutions Informatiques',
        custodian: 'Solutions Informatiques',
        criticality_status: true,
        availability_level: 'Haute',
        encryption_status: 'Certificat de sécurité unique',
      },
      {
        name: 'Parc de terminaux (PC fixes, portables, tablettes)',
        category: 'tangible',
        type: 'it_hardware',
        operational_purpose: 'Environ 30 machines (Dell, HP, Asus) mises à disposition de 16 utilisateurs pour l\'usage de l\'ERP et de la suite M365.',
        information_owner: 'Philippe Lachenko',
        custodian: 'Solutions Informatiques (Maintenance)',
        criticality_status: true,
        confidentiality_level: 'Restreint',
        integrity_level: 'Haute',
        availability_level: 'Haute',
        encryption_status: 'BitLocker (AES-128/256) sur tous les postes',
      },
      {
        name: 'Fibre Orange (Colombes)',
        category: 'tangible',
        type: 'it_hardware',
        operational_purpose: 'Accès Internet très haut débit (jusqu\'à 1Gbps) supportant les tunnels VPN vers le Datacenter.',
        information_owner: 'Orange (Fournisseur)',
        custodian: 'Orange',
        criticality_status: true,
        availability_level: 'Critique',
        encryption_status: 'Tunnels VPN IPsec',
      },
      {
        name: 'Infrastructure réseau locale (Switchs et Bornes Wifi)',
        category: 'tangible',
        type: 'it_hardware',
        operational_purpose: 'Equipements assurant la connectivité filaire (LAN) et sans fil (WLAN Pro/Invité) au 3ème étage à Colombes.',
        information_owner: 'Philippe Lachenko',
        custodian: 'Solutions Informatiques',
        integrity_level: 'Haute',
        availability_level: 'Haute',
        encryption_status: 'WPA2/WPA-AES recommandé',
      },
      {
        name: 'Périphériques de bureau (Moniteurs, Copieur HP)',
        category: 'tangible',
        type: 'furniture_fixtures',
        operational_purpose: 'Ecrans de réunion Iyama et copieur HP utilisé pour les besoins administratifs.',
        information_owner: 'Inedee',
        custodian: 'Inedee (Usage interne)',
        confidentiality_level: 'Interne',
        availability_level: 'Moyenne',
        encryption_status: 'N/A',
      },
    ];

    // 3. Informations complémentaires communes
    const commonOwnership = 'Direction (Philippe Lachenko) assistée par le RSSI externe pour la partie normative';
    const commonAcceptableUse = 'Charte IT (v2) signée par chaque collaborateur';
    const commonReturnPolicy = 'Restitution immédiate de tout matériel (PC, badges, tokens) lors de l\'outboarding';
    const commonDisposalMethod = 'Logiciel Blancco via Solutions Informatiques pour garantir un effacement sécurisé des données avant recyclage, avec remise d\'un certificat d\'effacement';

    console.log(`\n=== Étape 2 : Traitement de ${assetsData.length} actifs ===`);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const assetData of assetsData) {
      const slug = createSlug(assetData.name);
      const assetId = `inedee-${slug}`;

      try {
        // Vérifier si l'actif existe déjà
        const existingAsset = await AssetModel.findOne({ assetId });

        const assetPayload: any = {
          assetId,
          editorId: editor._id,
          name: assetData.name,
          category: assetData.category,
          type: assetData.type,
        };

        // Ajouter les champs optionnels seulement s'ils sont définis
        if (assetData.description || assetData.operational_purpose) {
          assetPayload.description = assetData.description || assetData.operational_purpose;
        }
        if (assetData.operational_purpose) {
          assetPayload.operational_purpose = assetData.operational_purpose;
        }
        if (assetData.information_owner) {
          assetPayload.information_owner = assetData.information_owner;
        }
        if (assetData.custodian) {
          assetPayload.custodian = assetData.custodian;
        }
        if (assetData.confidentiality_level) {
          assetPayload.confidentiality_level = assetData.confidentiality_level;
        }
        if (assetData.integrity_level) {
          assetPayload.integrity_level = assetData.integrity_level;
        }
        if (assetData.availability_level) {
          assetPayload.availability_level = assetData.availability_level;
        }
        if (assetData.criticality_status !== undefined) {
          assetPayload.criticality_status = assetData.criticality_status;
        }
        if (assetData.mtd_hours !== undefined) {
          assetPayload.mtd_hours = assetData.mtd_hours;
        }
        if (assetData.encryption_status) {
          assetPayload.encryption_status = assetData.encryption_status;
        }
        
        assetPayload.ownership = commonOwnership;
        assetPayload.acceptable_use = commonAcceptableUse;
        assetPayload.return_policy = commonReturnPolicy;
        assetPayload.disposal_method = commonDisposalMethod;

        if (existingAsset) {
          // Mise à jour de l'actif existant
          await AssetModel.findOneAndUpdate(
            { assetId },
            { $set: assetPayload },
            { new: true }
          );
          updatedCount++;
          console.log(`  ✅ Mis à jour : ${assetData.name}`);
        } else {
          // Création d'un nouvel actif
          await AssetModel.create(assetPayload);
          createdCount++;
          console.log(`  ➕ Créé : ${assetData.name}`);
        }
      } catch (error: any) {
        console.error(`  ❌ Erreur pour "${assetData.name}": ${error.message}`);
        skippedCount++;
      }
    }

    console.log('\n=== Résumé ===');
    console.log(`  ➕ Actifs créés : ${createdCount}`);
    console.log(`  ✅ Actifs mis à jour : ${updatedCount}`);
    console.log(`  ⏭️  Actifs ignorés (erreurs) : ${skippedCount}`);
    console.log(`  📊 Total traité : ${createdCount + updatedCount}/${assetsData.length}`);

    console.log('\n✅ Script terminé avec succès !');

  } catch (error: any) {
    console.error('\n❌ Erreur pendant la mise à jour des actifs INEDEE :', error);
    throw error;
  } finally {
    console.log('\n🔌 Déconnexion de MongoDB');
    await mongoose.disconnect();
  }
}

// Exécution du script
main().catch((error) => {
  console.error('❌ Erreur fatale :', error);
  process.exit(1);
});

