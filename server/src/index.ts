// Fichier : /server/src/index.ts

// ------------------ 1. IMPORTS & DEPENDANCES ------------------

import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
// Note: Nous utilisons Apollo Server v3, compatible avec Express (nécessaire suite aux problèmes ERESOLVE)
import { ApolloServer } from 'apollo-server-express';
import { GraphQLError, GraphQLFormattedError, SourceLocation } from 'graphql'; // Import nécessaire pour les types
import http from 'http';
import typeDefs from './graphql/schema.js'; // Import du schéma GraphQL que nous avons défini
import resolvers from './graphql/resolvers/index.js'; // Import de l'objet regroupant tous les Resolvers (.js pour ESM)
import jwt from 'jsonwebtoken';
import { ensureDefaultAdminUser } from './models/User.model.js';

// Fichier fictif pour la connexion MongoDB (Mongoose)
// (Vous devez créer ce fichier /server/src/config/db.js ou équivalent)
import { connectDB } from './config/db.js';


// ------------------ 2. CONFIGURATION INITIALE ------------------

const PORT = process.env.PORT || 4000;
const GRAPHQL_PATH = '/graphql';


// ------------------ 3. FONCTION DE DEMARRAGE DU SERVEUR ------------------

/**
 * Initialise la connexion à la base de données, configure et lance Apollo Server.
 */
async function startApolloServer(typeDefs: any, resolvers: any) {

    // a. Connexion à la Base de Données
    // MongoDB Atlas est fortement recommandé pour la production (gestion des backups/réplicas P1).
    try {
        await connectDB();
        console.log("✅ Connexion à MongoDB Atlas établie avec succès.");
        await ensureDefaultAdminUser();
    } catch (error) {
        console.error("❌ ERREUR: Impossible de se connecter à la base de données. Exiting...");
        process.exit(1);
    }

    // b. Initialisation de l'Application Express
    const app = express();
    
    // Middleware de logging pour debug
    app.use((req, res, next) => {
      if (req.path === '/graphql') {
        console.log(`[HTTP] ${req.method} ${req.path} - Cookies:`, req.cookies);
      }
      next();
    });
    
    app.use(cookieParser());
    
    // Configuration CORS personnalisée qui intercepte TOUTES les réponses
    // (même celles générées par Apollo Server)
    app.use((req, res, next) => {
      // Sauvegarder la méthode end originale
      const originalEnd = res.end;
      
      // Intercepter la méthode end pour forcer les headers CORS juste avant l'envoi
      res.end = function(chunk?: any, encoding?: any, cb?: any) {
        // Forcer les headers CORS AVANT d'envoyer la réponse
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Appeler la méthode end originale
        return originalEnd.call(this, chunk, encoding, cb);
      };
      
      // Pour les requêtes OPTIONS (preflight), répondre immédiatement
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.sendStatus(200);
      }
      
      next();
    });

    // c. Création du Serveur HTTP
    const httpServer = http.createServer(app);

    // d. Initialisation de l'Instance Apollo Server
    // L'utilisation de GraphQL permet de créer des vues flexibles (Portfolio, Technique DD).
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req, res }) => {
            const token = req.cookies?.auth_token;
            let user = null;

            // Log pour debug
            if (req.path === '/graphql') {
              console.log('[CONTEXT] Cookies reçus:', req.cookies);
              console.log('[CONTEXT] Token présent:', !!token);
            }

            if (token) {
                try {
                    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me') as any;
                    user = {
                        userId: payload.sub,
                        email: payload.email,
                        role: payload.role,
                        associatedEditorId: payload.associatedEditorId,
                    };
                    console.log('[CONTEXT] Utilisateur authentifié:', user.userId);
                } catch (e) {
                    console.log('[CONTEXT] Token invalide ou expiré');
                    // Jeton invalide ou expiré, on laisse user à null
                }
            }

            return {
                req,
                res,
                user,
            };
        },
        // // CORRECTION DU TYPAGE : Assurer que le retour est GraphQLFormattedError
        // formatError: (error: GraphQLError): GraphQLFormattedError => {
        //     console.error("GraphQL Error:", error);
            
        //     // On construit l'objet de retour pour garantir la compatibilité
        //     const formattedError: GraphQLFormattedError = {
        //         message: error.message,
        //         locations: error.locations || [], // Assurer que locations est un tableau, même vide
        //         path: error.path,
        //         extensions: error.extensions,
        //     };

        //     // En développement, vous pourriez vouloir afficher plus de détails :
        //     if (process.env.NODE_ENV !== 'production' && error.extensions && error.extensions.exception) {
        //         // Pour exposer les traces de pile uniquement en mode développement
        //         (formattedError.extensions as any).stacktrace = error.extensions.exception.stacktrace;
        //     }

        //     return formattedError;
        // },
        formatError: (error) => {
            console.error("GraphQL Error:", error);
            // On force le compilateur à accepter le type retourné
            return error as GraphQLFormattedError;
        },
    });

    // e. Démarrage de l'instance Apollo
    await server.start();

    // f. Application du middleware Apollo à Express
    // Cela permet à Apollo de gérer toutes les requêtes HTTP sur le chemin /graphql
    // server.applyMiddleware({ app, path: GRAPHQL_PATH });
    // CORRECTION : Forcer l'application à 'any' pour contourner le conflit de typage Express/Apollo Server v3
    server.applyMiddleware({ app: app as any, path: GRAPHQL_PATH }); 
    
    // g. Démarrage du Serveur d'écoute
    await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));

    console.log(`
        ----------------------------------------------------
        🚀 GraphQL Server prêt!
        URL: http://localhost:${PORT}${server.graphqlPath}
        ----------------------------------------------------
    `);
}

// ------------------ 4. EXECUTION ------------------

startApolloServer(typeDefs, resolvers);