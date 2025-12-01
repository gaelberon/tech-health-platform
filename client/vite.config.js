// Fichier : /client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path'; // Importation du module path
// Obtenir le chemin absolu du répertoire actuel (/client)
const __dirname = path.resolve();
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // Configuration de l'alias pour que Vite trouve les types partagés (P1)
            // Cela mappe @common à /tech-health-platform/common
            '@common': path.resolve(__dirname, '..', 'common'),
            '@common/types': path.resolve(__dirname, '..', 'common', 'types'),
        },
    },
    // Assurez-vous d'avoir la compilation tsc nécessaire pour les références de projet
    build: {
    // ... vos options de build
    }
});
