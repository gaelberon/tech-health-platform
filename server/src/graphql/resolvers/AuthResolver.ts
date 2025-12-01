import { UserModel } from '../../models/User.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '8h';
const COOKIE_NAME = 'auth_token';

export const AuthResolver = {
  Query: {
    me: async (_parent: any, _args: any, ctx: any) => {
      // Si pas d'utilisateur dans le contexte, retourner null (le schéma permet me: User sans !)
      if (!ctx.user) {
        console.log('[ME] Pas d\'utilisateur dans le contexte');
        return null;
      }
      console.log('[ME] Utilisateur trouvé:', ctx.user);
      return ctx.user;
    },
  },
  Mutation: {
    login: async (_parent: any, { email, password }: { email: string; password: string }, ctx: any) => {
      // Normaliser l'email en minuscules pour éviter les problèmes de casse
      const normalizedEmail = email.toLowerCase().trim();
      
      console.log(`[LOGIN] Tentative de connexion pour: ${normalizedEmail}`);
      
      const user = await UserModel.findOne({ email: normalizedEmail });
      if (!user) {
        console.log(`[LOGIN] Utilisateur non trouvé: ${normalizedEmail}`);
        throw new Error('Identifiants invalides');
      }

      console.log(`[LOGIN] Utilisateur trouvé: ${user.email}, rôle: ${user.role}`);
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        console.log(`[LOGIN] Mot de passe incorrect pour: ${normalizedEmail}`);
        throw new Error('Identifiants invalides');
      }

      console.log(`[LOGIN] Connexion réussie pour: ${normalizedEmail}`);

      try {
      const token = jwt.sign(
        {
          sub: user.userId,
          email: user.email,
          role: user.role,
          associatedEditorId: user.associatedEditorId,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

        // S'assurer que ctx.res existe avant de définir le cookie
        if (!ctx.res) {
          console.error('[LOGIN] ERREUR: ctx.res est undefined');
          throw new Error('Erreur de configuration serveur');
        }

        ctx.res.cookie(COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 8 * 60 * 60 * 1000,
          path: '/',
        });

        console.log(`[LOGIN] Cookie défini avec succès`);
        console.log(`[LOGIN] Headers de réponse Set-Cookie:`, ctx.res.getHeader('Set-Cookie'));

        const userResponse = {
          userId: user.userId,
          email: user.email,
          role: user.role,
          associatedEditorId: user.associatedEditorId || null,
        };

        console.log(`[LOGIN] Retour de la réponse:`, userResponse);
        return userResponse;
      } catch (error: any) {
        console.error('[LOGIN] Erreur lors de la génération du token ou du cookie:', error);
        throw new Error('Erreur lors de la création de la session');
      }
    },
    logout: async (_parent: any, _args: any, ctx: any) => {
      ctx.res.clearCookie(COOKIE_NAME);
      return true;
    },
  },
};


