/**
 * Script pour remplacer automatiquement les labels par FieldLabel dans les composants Data Management
 * Usage: node client/scripts/replaceLabelsWithFieldLabel.js
 */

const fs = require('fs');
const path = require('path');

// Mapping des patterns de remplacement
const replacements = [
  // Pattern pour les labels simples avec t()
  {
    pattern: /<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">\s*\{t\('([^']+)'[^}]*\)\}\s*(\*)?\s*<\/label>/g,
    replacement: (match, translationKey, required) => {
      const requiredProp = required ? ' required' : '';
      return `<FieldLabel\n            translationKey="${translationKey}"${requiredProp}\n            showFieldReference={showFieldReferences}\n          />`;
    }
  },
  // Pattern pour les labels avec mb-2
  {
    pattern: /<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">\s*\{t\('([^']+)'[^}]*\)\}\s*(\*)?\s*<\/label>/g,
    replacement: (match, translationKey, required) => {
      const requiredProp = required ? ' required' : '';
      return `<FieldLabel\n            translationKey="${translationKey}"${requiredProp}\n            showFieldReference={showFieldReferences}\n            className="mb-2"\n          />`;
    }
  },
];

// Fichiers à traiter
const filesToProcess = [
  'client/src/components/data-management/sections/EnvironmentDetailsSection.tsx',
  'client/src/components/data-management/sections/HostingSection.tsx',
  'client/src/components/data-management/sections/SecurityProfileSection.tsx',
  'client/src/components/data-management/sections/MonitoringSection.tsx',
  'client/src/components/data-management/sections/EntityCostSection.tsx',
  'client/src/components/data-management/DataManagementForm.tsx',
];

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier non trouvé: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Vérifier si FieldLabel est déjà importé
  if (!content.includes("import FieldLabel")) {
    // Ajouter l'import après les autres imports
    const importMatch = content.match(/(import.*from.*['"]\.\.\/.*['"];?\s*\n)/);
    if (importMatch) {
      const lastImportIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
      content = content.slice(0, lastImportIndex) + 
                "import FieldLabel from '../FieldLabel';\n" + 
                content.slice(lastImportIndex);
      modified = true;
    }
  }

  // Appliquer les remplacements
  replacements.forEach(({ pattern, replacement }) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fichier traité: ${filePath}`);
  } else {
    console.log(`ℹ️  Aucune modification: ${filePath}`);
  }
}

// Traiter tous les fichiers
console.log('🔄 Traitement des fichiers...\n');
filesToProcess.forEach(processFile);
console.log('\n✅ Traitement terminé!');



