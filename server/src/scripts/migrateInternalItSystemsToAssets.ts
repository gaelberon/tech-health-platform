/**
 * Script de migration : Remplacement de internal_it_systems par des assets
 * 
 * Ce script :
 * 1. Parcourt tous les éditeurs ayant des internal_it_systems
 * 2. Pour chaque système IT interne, crée un asset de type "digital_and_data" / "logical_cloud_infrastructure"
 * 3. Supprime le champ internal_it_systems de l'éditeur
 * 
 * Usage: node --loader ts-node/esm src/scripts/migrateInternalItSystemsToAssets.ts
 *    ou: npm run migrate-internal-it-systems-to-assets
 */

import mongoose from 'mongoose';
import { EditorModel } from '../models/Editor.model.js';
import { AssetModel } from '../models/Asset.model.js';

// Connexion MongoDB
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL;

if (!mongoUri) {
  console.error('❌ MONGODB_URI (ou MONGO_URL) non défini dans les variables d\'environnement.');
  process.exit(1);
}

async function migrate() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(mongoUri as string);
    console.log(`✅ Connecté à MongoDB: ${mongoose.connection.host}`);

    // Récupérer tous les éditeurs avec internal_it_systems (utiliser lean() pour récupérer les données brutes)
    // Note: internal_it_systems n'est plus dans le schéma Mongoose, donc on utilise lean() pour récupérer les données brutes
    const editors = await EditorModel.find({
      internal_it_systems: { $exists: true }
    }).lean();

    console.log(`\n📊 ${editors.length} éditeur(s) trouvé(s) avec le champ internal_it_systems`);

    let totalAssetsCreated = 0;
    let totalEditorsUpdated = 0;
    let totalEditorsCleaned = 0;

    for (const editor of editors as any[]) {
      const internalItSystems = editor.internal_it_systems || [];
      const editorId = editor.editorId;
      const editorMongoId = editor._id;
      const editorName = editor.name;

      console.log(`\n📝 Traitement de l'éditeur "${editorName}" (${editorId})`);

      // Vérifier si internal_it_systems est un tableau valide
      if (!Array.isArray(internalItSystems)) {
        console.log(`   ⚠️  internal_it_systems n'est pas un tableau, suppression directe du champ`);
        // Utiliser la collection MongoDB directement pour forcer la suppression du champ
        if (mongoose.connection.db) {
          await mongoose.connection.db.collection('editors').updateOne(
            { _id: editorMongoId },
            { $unset: { internal_it_systems: '' } }
          );
        }
        totalEditorsCleaned++;
        continue;
      }

      if (internalItSystems.length === 0) {
        console.log(`   ⚠️  internal_it_systems est vide, suppression du champ`);
        // Utiliser la collection MongoDB directement pour forcer la suppression du champ
        if (mongoose.connection.db) {
          await mongoose.connection.db.collection('editors').updateOne(
            { _id: editorMongoId },
            { $unset: { internal_it_systems: '' } }
          );
        }
        totalEditorsCleaned++;
        continue;
      }

      console.log(`   ${internalItSystems.length} système(s) IT interne(s) à migrer`);

      let assetsCreatedForEditor = 0;

      // Créer un asset pour chaque système IT interne
      for (const systemName of internalItSystems) {
        if (!systemName || typeof systemName !== 'string' || systemName.trim().length === 0) {
          console.log(`   ⚠️  Nom de système invalide ignoré: ${systemName}`);
          continue;
        }

        // Vérifier si un asset avec ce nom existe déjà pour cet éditeur
        const existingAsset = await AssetModel.findOne({
          editorId: editorMongoId,
          name: systemName.trim(),
          category: 'digital_and_data',
          type: 'logical_cloud_infrastructure'
        });

        if (existingAsset) {
          console.log(`   ℹ️  Asset "${systemName}" existe déjà, ignoré`);
          continue;
        }

        // Créer un nouvel asset
        const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const asset = new AssetModel({
          assetId,
          editorId: editorMongoId,
          name: systemName.trim(),
          category: 'digital_and_data',
          type: 'logical_cloud_infrastructure',
          description: `Système IT interne migré depuis internal_it_systems`,
          archived: false
        });

        await asset.save();
        assetsCreatedForEditor++;
        totalAssetsCreated++;
        console.log(`   ✅ Asset créé: "${systemName}" (${assetId})`);
      }

      // Supprimer le champ internal_it_systems de l'éditeur (même si aucun asset n'a été créé)
      // Utiliser la collection MongoDB directement pour forcer la suppression du champ
      if (mongoose.connection.db) {
        await mongoose.connection.db.collection('editors').updateOne(
          { _id: editorMongoId },
          { $unset: { internal_it_systems: '' } }
        );
      }
      totalEditorsUpdated++;
      console.log(`   ✅ Champ internal_it_systems supprimé de l'éditeur`);
    }

    console.log(`\n✅ Migration terminée !`);
    console.log(`   - ${totalAssetsCreated} asset(s) créé(s)`);
    console.log(`   - ${totalEditorsUpdated} éditeur(s) migrés (avec création d'assets)`);
    console.log(`   - ${totalEditorsCleaned} éditeur(s) nettoyés (champ supprimé, pas d'assets à créer)`);
    console.log(`   - ${totalEditorsUpdated + totalEditorsCleaned} éditeur(s) au total mis à jour`);

  } catch (error: any) {
    console.error('❌ Erreur pendant la migration :', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    console.log('\n🔌 Déconnexion de MongoDB');
    await mongoose.disconnect();
  }
}

// Exécuter la migration
migrate();

