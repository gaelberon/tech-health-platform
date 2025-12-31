/**
 * Script de nettoyage des doublons d'actifs pour Inedee
 *
 * Ce script identifie les actifs en double basés sur le nom (normalisé)
 * et conserve celui qui a le plus d'informations renseignées.
 *
 * Usage :
 *   cd server
 *   npm run cleanup-duplicate-assets
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { EditorModel } from '../models/Editor.model.js';
import { AssetModel, IAsset } from '../models/Asset.model.js';

// Fonction pour normaliser un nom d'actif (pour la comparaison)
function normalizeAssetName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]+/g, ' ') // Remplace les caractères non alphanumériques par des espaces
    .trim()
    .replace(/\s+/g, ' '); // Normalise les espaces multiples
}

// Fonction pour calculer le score d'information d'un actif (nombre de champs remplis)
function calculateAssetScore(asset: IAsset): number {
  let score = 0;
  
  // Champs de base (toujours présents)
  if (asset.name) score += 1;
  if (asset.category) score += 1;
  if (asset.type) score += 1;
  
  // Champs optionnels
  if (asset.description) score += 1;
  if (asset.operational_purpose) score += 1;
  if (asset.information_owner) score += 1;
  if (asset.custodian) score += 1;
  if (asset.confidentiality_level) score += 1;
  if (asset.integrity_level) score += 1;
  if (asset.availability_level) score += 1;
  if (asset.criticality_status !== undefined) score += 1;
  if (asset.mtd_hours !== undefined && asset.mtd_hours !== null) score += 1;
  if (asset.rpo_mtdl_hours !== undefined && asset.rpo_mtdl_hours !== null) score += 1;
  if (asset.approval_status) score += 1;
  if (asset.encryption_status) score += 1;
  if (asset.physical_location) score += 1;
  if (asset.version_firmware) score += 1;
  if (asset.sbom_reference) score += 1;
  if (asset.end_of_life_date) score += 1;
  if (asset.last_inventory_date) score += 1;
  if (asset.disposal_method) score += 1;
  if (asset.ownership) score += 1;
  if (asset.acceptable_use) score += 1;
  if (asset.return_policy) score += 1;
  
  return score;
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

    // 2. Récupération de tous les actifs d'Inedee
    console.log('\n🔍 Récupération de tous les actifs d\'Inedee...');
    const allAssets = await AssetModel.find({ 
      editorId: editor._id,
      archived: { $ne: true }
    }).lean();

    console.log(`✅ ${allAssets.length} actifs trouvés`);

    // 3. Grouper les actifs par nom normalisé
    console.log('\n🔍 Identification des doublons...');
    const assetGroups: Map<string, any[]> = new Map();

    for (const asset of allAssets) {
      const normalizedName = normalizeAssetName(asset.name);
      if (!assetGroups.has(normalizedName)) {
        assetGroups.set(normalizedName, []);
      }
      assetGroups.get(normalizedName)!.push(asset);
    }

    // 4. Identifier les groupes avec des doublons
    const duplicateGroups: Array<{ normalizedName: string; assets: any[] }> = [];
    
    for (const [normalizedName, assets] of assetGroups.entries()) {
      if (assets.length > 1) {
        duplicateGroups.push({ normalizedName, assets });
      }
    }

    console.log(`✅ ${duplicateGroups.length} groupes de doublons identifiés`);

    if (duplicateGroups.length === 0) {
      console.log('\n✅ Aucun doublon trouvé. Base de données propre !');
      return;
    }

    // 5. Pour chaque groupe de doublons, conserver celui avec le meilleur score
    console.log('\n=== Traitement des doublons ===');
    let keptCount = 0;
    let deletedCount = 0;
    const deletedAssetIds: string[] = [];

    for (const group of duplicateGroups) {
      console.log(`\n📦 Groupe: "${group.assets[0].name}" (${group.assets.length} doublons)`);
      
      // Calculer le score pour chaque actif du groupe
      const assetsWithScores = group.assets.map(asset => ({
        asset,
        score: calculateAssetScore(asset as IAsset),
      }));

      // Trier par score décroissant (meilleur score en premier)
      assetsWithScores.sort((a, b) => b.score - a.score);

      // Conserver le premier (meilleur score)
      const bestAsset = assetsWithScores[0];
      if (!bestAsset) {
        console.log(`  ⚠️  Aucun actif valide dans ce groupe, ignoré`);
        continue;
      }

      const assetToKeep = bestAsset.asset;
      const assetsToDelete = assetsWithScores.slice(1);

      console.log(`  ✅ Conservé: ${assetToKeep.name} (assetId: ${assetToKeep.assetId}, score: ${bestAsset.score})`);
      
      // Afficher les détails de l'actif conservé
      const keptAssetDetails: string[] = [];
      if (assetToKeep.information_owner) keptAssetDetails.push(`Owner: ${assetToKeep.information_owner}`);
      if (assetToKeep.custodian) keptAssetDetails.push(`Custodian: ${assetToKeep.custodian}`);
      if (assetToKeep.encryption_status) keptAssetDetails.push(`Encryption: ${assetToKeep.encryption_status}`);
      if (keptAssetDetails.length > 0) {
        console.log(`     ${keptAssetDetails.join(' | ')}`);
      }

      // Supprimer les autres
      for (const { asset } of assetsToDelete) {
        const assetScore = assetsWithScores.find(a => a.asset._id.toString() === asset._id.toString());
        const score = assetScore ? assetScore.score : 0;
        console.log(`  🗑️  Supprimé: ${asset.name} (assetId: ${asset.assetId}, score: ${score})`);
        
        if (asset._id) {
          await AssetModel.deleteOne({ _id: asset._id });
          deletedAssetIds.push(asset.assetId);
          deletedCount++;
        }
      }

      keptCount++;
    }

    console.log('\n=== Résumé ===');
    console.log(`  ✅ Actifs conservés : ${keptCount}`);
    console.log(`  🗑️  Actifs supprimés : ${deletedCount}`);
    console.log(`  📊 Groupes traités : ${duplicateGroups.length}`);
    
    if (deletedAssetIds.length > 0) {
      console.log(`\n📋 Liste des assetIds supprimés :`);
      deletedAssetIds.forEach(id => console.log(`    - ${id}`));
    }

    console.log('\n✅ Nettoyage terminé avec succès !');

  } catch (error: any) {
    console.error('\n❌ Erreur pendant le nettoyage des doublons :', error);
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

