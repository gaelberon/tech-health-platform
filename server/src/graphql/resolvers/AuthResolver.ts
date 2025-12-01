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
      
      // Récupérer l'utilisateur complet depuis la base de données pour avoir tous les champs
      const user = await UserModel.findOne({ userId: ctx.user.userId });
      if (!user) {
        return null;
      }
      
      // Ne jamais exposer le passwordHash
      const userObj = user.toObject();
      const { passwordHash, ...userWithoutPassword } = userObj;
      
      console.log('[ME] Utilisateur trouvé:', userWithoutPassword.userId);
      return userWithoutPassword;
    },
  },
  Mutation: {
    login: async (_parent: any, { email, password }: { email: string; password: string }, ctx: any) => {
      // Normaliser l'email en minuscules pour éviter les problèmes de casse
      const normalizedEmail = email.toLowerCase().trim();
      
      console.log(`[LOGIN] Tentative de connexion pour: ${normalizedEmail}`);
      
      // Trouver tous les utilisateurs non archivés avec cet email
      const users = await UserModel.find({ 
        email: normalizedEmail,
        archived: { $ne: true }
      }).sort({ createdAt: -1 });
      
      if (users.length === 0) {
        console.log(`[LOGIN] Utilisateur non trouvé: ${normalizedEmail}`);
        throw new Error('Identifiants invalides');
      }

      // Vérifier le mot de passe pour tous les comptes et filtrer ceux qui correspondent
      const validUsers = [];
      for (const user of users) {
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (isValid) {
          const userObj = user.toObject();
          const { passwordHash, ...userWithoutPassword } = userObj;
          validUsers.push(userWithoutPassword);
        }
      }

      if (validUsers.length === 0) {
        console.log(`[LOGIN] Mot de passe incorrect pour: ${normalizedEmail}`);
        throw new Error('Identifiants invalides');
      }

      // Si un seul compte correspond, connecter directement
      if (validUsers.length === 1) {
        const selectedUser = validUsers[0];
        if (!selectedUser) {
          throw new Error('Erreur lors de la sélection du compte');
        }

        console.log(`[LOGIN] Connexion réussie pour: ${normalizedEmail}, rôle: ${selectedUser.role}`);

        // Mettre à jour la date de dernière connexion
        await UserModel.findOneAndUpdate(
          { userId: selectedUser.userId },
          { lastLoginAt: new Date() }
        );

        try {
          const token = jwt.sign(
            {
              sub: selectedUser.userId,
              email: selectedUser.email,
              role: selectedUser.role,
              associatedEditorId: selectedUser.associatedEditorId,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );

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

          return {
            user: selectedUser,
            availableAccounts: [],
            requiresAccountSelection: false,
          };
        } catch (error: any) {
          console.error('[LOGIN] Erreur lors de la génération du token ou du cookie:', error);
          throw new Error('Erreur lors de la création de la session');
        }
      }

      // Si plusieurs comptes correspondent, retourner la liste sans créer de session
      console.log(`[LOGIN] Plusieurs comptes trouvés pour: ${normalizedEmail} (${validUsers.length})`);
      return {
        user: null,
        availableAccounts: validUsers,
        requiresAccountSelection: true,
      };
    },

    // Sélectionner un compte spécifique et créer la session
    selectAccount: async (_parent: any, { userId }: { userId: string }, ctx: any) => {
      const user = await UserModel.findOne({ userId, archived: { $ne: true } });
      
      if (!user) {
        throw new Error(`Utilisateur avec l'ID ${userId} introuvable ou archivé`);
      }

      // Mettre à jour la date de dernière connexion
      await UserModel.findOneAndUpdate(
        { userId: user.userId },
        { lastLoginAt: new Date() }
      );

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

        if (!ctx.res) {
          throw new Error('Erreur de configuration serveur');
        }

        ctx.res.cookie(COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 8 * 60 * 60 * 1000,
          path: '/',
        });

        const userObj = user.toObject();
        const { passwordHash, ...userWithoutPassword } = userObj;

        return userWithoutPassword;
      } catch (error: any) {
        console.error('[SELECT_ACCOUNT] Erreur lors de la génération du token:', error);
        throw new Error('Erreur lors de la création de la session');
      }
    },
    logout: async (_parent: any, _args: any, ctx: any) => {
      ctx.res.clearCookie(COOKIE_NAME);
      return true;
    },
  },
};


