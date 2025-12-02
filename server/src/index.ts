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
import { GraphQLJSON } from 'graphql-type-json'; // Pour le scalar JSON
import jwt from 'jsonwebtoken';
import { ensureDefaultAdminUser, removeOldEmailUniqueIndex } from './models/User.model.js';
import { seedInitialLookups } from './config/seedLookups.js';
import { initializeDefaultPagePermissions } from './models/PageAccessPermission.model.js';

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
        await removeOldEmailUniqueIndex(); // Supprimer l'ancien index unique sur email
        await ensureDefaultAdminUser();
        await seedInitialLookups();
        await initializeDefaultPagePermissions(); // Initialiser les permissions d'accès aux pages
    } catch (error) {
        console.error("❌ ERREUR: Impossible de se connecter à la base de données. Exiting...");
        process.exit(1);
    }

    // b. Initialisation de l'Application Express
    const app = express();
    
    // Configuration CORS EN PREMIER (avant les autres middlewares)
    // Utiliser le middleware cors standard qui gère correctement les headers et les requêtes OPTIONS
    app.use(cors({
      origin: 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    
    // Configuration du body parser avec limite de taille augmentée pour les images base64
    // Une image de 2MB encodée en base64 peut faire ~2.7MB, on met 10MB pour la marge
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    app.use(cookieParser());
    
    // Middleware de logging pour debug (après CORS et body parser)
    // IMPORTANT: Ne pas intercepter les requêtes GraphQL car Apollo Server les gère
    app.use((req, res, next) => {
      // Ne logger que les requêtes non-GraphQL pour éviter les conflits
      if (req.path !== '/graphql') {
        console.log(`[HTTP] ${req.method} ${req.path} - Cookies:`, req.cookies);
      }
      next();
    });

    // c. Création du Serveur HTTP
    const httpServer = http.createServer(app);

    // d. Initialisation de l'Instance Apollo Server
    // L'utilisation de GraphQL permet de créer des vues flexibles (Portfolio, Technique DD).
    // Ajouter le scalar JSON aux resolvers - IMPORTANT: JSON doit être au niveau racine
    const resolversWithJSON = {
        JSON: GraphQLJSON, // Scalar JSON doit être au niveau racine, pas dans Query/Mutation
        ...resolvers,
    };

    const server = new ApolloServer({
        typeDefs,
        resolvers: resolversWithJSON,
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
    // Note: bodyParserConfig n'est plus supporté dans Apollo Server v3
    // La configuration du body parser se fait via Express (déjà fait plus haut)
    server.applyMiddleware({ 
        app: app as any, 
        path: GRAPHQL_PATH,
        cors: false, // CORS est géré par le middleware Express personnalisé
    }); 
    
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