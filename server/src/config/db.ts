// Fichier : /server/src/config/db.ts

// ------------------ IMPORTS ------------------

import mongoose from 'mongoose';

// ------------------ CONFIGURATION ------------------

// Assurez-vous que MONGO_URI est défini dans vos variables d'environnement (.env)
// Ce URI pointe vers votre cluster MongoDB Atlas.
const MONGO_URI = process.env.MONGO_URI; 

// ------------------ FONCTION DE CONNEXION ------------------

/**
 * Tente d'établir et de maintenir la connexion à la base de données MongoDB via Mongoose.
 * Gère la robustesse de la connexion, essentielle pour la Résilience (P1) de la plateforme.
 */
export const connectDB = async () => {
    
    if (!MONGO_URI) {
        console.error("❌ ERREUR FATALE: La variable d'environnement MONGO_URI n'est pas définie.");
        // Arrêt du processus si la connexion n'est pas configurée
        process.exit(1); 
    }

    try {
        // Options recommandées pour Mongoose 6+
        const conn = await mongoose.connect(MONGO_URI);
        
        // Affichage de l'hôte connecté pour le diagnostic
        console.log(`📡 MongoDB Atlas connecté: ${conn.connection.host}`);
        
        // La gestion de la continuité des activités (BCM) et des sauvegardes (RTO/RPO) 
        // est déléguée à MongoDB Atlas, comme recommandé [3].

    } catch (error) {
        console.error(`❌ ERREUR de connexion Mongoose: ${error}`);
        // Arrêt du processus si la connexion échoue
        process.exit(1);
    }
};