# Scripts de Traduction des Lookups

## Script: translateLookups.ts

Ce script ajoute automatiquement les traductions EN et DE aux lookups existants dans la base de données MongoDB.

### Prérequis

1. Assurez-vous que le fichier `.env` contient la variable `MONGO_URI`
2. Les dépendances doivent être installées (`npm install` dans le dossier `server`)

### Utilisation

```bash
cd server
npm run translate-lookups
```

Ou directement avec ts-node :

```bash
cd server
npx ts-node --esm src/scripts/translateLookups.ts
```

### Fonctionnement

Le script :
1. Se connecte à MongoDB via la variable d'environnement `MONGO_URI`
2. Récupère tous les lookups de la collection `lookups`
3. Pour chaque valeur de lookup :
   - Vérifie si `label_en` et `label_de` existent
   - Si manquants, utilise le dictionnaire de traductions intégré
   - Fait de même pour `description_en` et `description_de`
4. Sauvegarde les modifications dans la base de données

### Dictionnaire de Traductions

Le script contient un dictionnaire de traductions pour les termes courants. Si un terme n'est pas trouvé dans le dictionnaire, le script :
- Affiche un avertissement dans la console
- Conserve le texte original (à traduire manuellement si nécessaire)

### Améliorations Futures

Pour une traduction automatique complète, vous pourriez :
- Intégrer une API de traduction (Google Translate, DeepL, etc.)
- Ajouter plus de termes au dictionnaire
- Créer un système de traduction contextuelle

### Notes

- Le script ne modifie que les champs manquants (il ne remplace pas les traductions existantes)
- Les traductions sont basées sur `label_fr` ou `label` (si `label_fr` n'existe pas)
- Même logique pour les descriptions

