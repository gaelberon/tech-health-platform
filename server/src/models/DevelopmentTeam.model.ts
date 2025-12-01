import { Schema, model, Document, Types } from 'mongoose';
import { IEditor } from './Editor.model.js'; // Importation de l'interface Editor pour le référencement

// 1. Définition de l'Interface TypeScript pour l'entité
export interface IDevelopmentTeam extends Document {
    teamId: string; // Identifiant unique (PK)
    editorId: Types.ObjectId; // Lien vers l'entité Editor (FK)
    
    // Champs pour les Capacités de Développement (Section 6b du DD)
    team_size_adequate: string; // L'équipe est-elle suffisante pour la roadmap prévue (boolean/text dans le MCD)
    key_person_dependency: string; // Dépendances envers des personnes clés dans l'équipe
}

// 2. Définition du Schéma Mongoose
const DevelopmentTeamSchema = new Schema<IDevelopmentTeam>({
    
    // Clé Primaire
    teamId: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    
    // Clé Étrangère vers Editor (Relation 1:1, une équipe par éditeur ou solution)
    editorId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Editor', 
        required: true,
        unique: true // Assure qu'il n'y a qu'un seul document DevelopmentTeam par Editor
    },

    // Capacités de Développement (Donnée DD Section 6b)
    team_size_adequate: { 
        type: String, 
        required: true, 
        description: "L'équipe de développement est-elle suffisante pour mettre en œuvre les fonctionnalités prévues et la roadmap ?"
    },
    
    // Dépendances (Donnée DD Section 6b)
    key_person_dependency: { 
        type: String, 
        required: false, // Peut être vide si aucune dépendance forte
        description: "Description des dépendances envers des personnes clés (expertise unique, passation critique)." 
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt
});

// 3. Exportation du Modèle
export const DevelopmentTeamModel = model<IDevelopmentTeam>('DevelopmentTeam', DevelopmentTeamSchema, 'developmentteams');