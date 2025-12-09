/**
 * Utilitaires pour la validation et la détection de champs vides/invalides
 */

/**
 * Liste des valeurs considérées comme "vides" ou "non peuplées"
 */
const EMPTY_VALUES = [
  '',
  'TBD',
  'NA',
  'N/A',
  'n/a',
  'na',
  'tbd',
  'Tbd',
  'N/A',
  'N/A',
  'MANQUANT',
  'manquant',
  '#ERROR!',
  '#ERROR',
  'ERROR',
  'error',
  null,
  undefined,
];

/**
 * Vérifie si une valeur est considérée comme vide ou non peuplée
 * @param value - La valeur à vérifier
 * @returns true si la valeur est vide/invalide, false sinon
 */
export function isEmptyValue(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' || EMPTY_VALUES.includes(trimmed);
  }

  if (Array.isArray(value)) {
    return value.length === 0 || value.every(item => isEmptyValue(item));
  }

  if (typeof value === 'number') {
    // 0 est considéré comme valide, mais NaN ou Infinity ne le sont pas
    return isNaN(value) || !isFinite(value);
  }

  if (typeof value === 'boolean') {
    // Les booléens sont toujours valides (même false)
    return false;
  }

  // Pour les objets, vérifier s'ils sont vides
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
}

/**
 * Retourne la classe CSS pour mettre en surbrillance un champ vide
 * @param isEmpty - true si le champ est vide
 * @returns La classe CSS à appliquer
 */
export function getEmptyFieldClass(isEmpty: boolean): string {
  return isEmpty
    ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700'
    : '';
}

/**
 * Combine les classes CSS de base avec la classe de surbrillance si nécessaire
 * @param baseClasses - Les classes CSS de base (peut inclure "border border-gray-300 dark:border-gray-600")
 * @param value - La valeur du champ à vérifier
 * @returns Les classes CSS combinées
 */
export function getFieldClasses(baseClasses: string, value: any): string {
  const isEmpty = isEmptyValue(value);
  
  // Si le champ est vide, remplacer les classes de border par défaut par les classes de surbrillance
  if (isEmpty) {
    // Remplacer les classes de border par défaut par les classes de surbrillance
    return baseClasses
      .replace(/\bborder-gray-300\b/g, 'border-rose-300')
      .replace(/\bdark:border-gray-600\b/g, 'dark:border-rose-700')
      .replace(/\bborder\s+(?!border-)/g, 'border ') // S'assurer qu'il y a un "border" avant les classes de couleur
      + ' bg-rose-50 dark:bg-rose-900/20'
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Si le champ n'est pas vide, garder les classes originales
  return baseClasses;
}

