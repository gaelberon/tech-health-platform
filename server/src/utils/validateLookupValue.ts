/**
 * Utilitaires pour valider les valeurs contre les Value Lists (Lookups)
 */

import { LookupModel } from '../models/Lookup.model.js';

/**
 * Valide qu'une valeur existe dans une Value List spécifique
 * @param lookupKey - La clé de la Value List (ex: "ENVIRONMENT_TYPES")
 * @param value - La valeur à valider
 * @returns true si la valeur est valide, false sinon
 */
export async function validateLookupValue(lookupKey: string, value: string): Promise<boolean> {
  if (!value) {
    return false;
  }

  try {
    const lookup = await LookupModel.findOne({ key: lookupKey });
    
    if (!lookup || !lookup.values || !Array.isArray(lookup.values)) {
      // Si la Value List n'existe pas, on accepte la valeur (pour éviter de bloquer)
      // Dans un environnement de production, on pourrait vouloir logger un warning
      return true;
    }

    // Vérifier si la valeur existe dans la liste (comparaison case-insensitive)
    const normalizedValue = value.toLowerCase().trim();
    return lookup.values.some((item: any) => {
      const itemCode = (item.code || '').toLowerCase().trim();
      const itemLabel = (item.label || '').toLowerCase().trim();
      return itemCode === normalizedValue || itemLabel === normalizedValue;
    });
  } catch (error) {
    console.error(`Erreur lors de la validation de la valeur "${value}" pour la lookup "${lookupKey}":`, error);
    // En cas d'erreur, on accepte la valeur pour éviter de bloquer l'application
    return true;
  }
}

/**
 * Valide plusieurs valeurs contre une Value List
 * @param lookupKey - La clé de la Value List
 * @param values - Les valeurs à valider (tableau)
 * @returns true si toutes les valeurs sont valides, false sinon
 */
export async function validateLookupValues(lookupKey: string, values: string[]): Promise<boolean> {
  if (!values || values.length === 0) {
    return true; // Tableau vide est valide
  }

  for (const value of values) {
    const isValid = await validateLookupValue(lookupKey, value);
    if (!isValid) {
      return false;
    }
  }

  return true;
}

/**
 * Obtient toutes les valeurs valides pour une Value List
 * @param lookupKey - La clé de la Value List
 * @returns Tableau des codes valides
 */
export async function getValidLookupCodes(lookupKey: string): Promise<string[]> {
  try {
    const lookup = await LookupModel.findOne({ key: lookupKey });
    
    if (!lookup || !lookup.values || !Array.isArray(lookup.values)) {
      return [];
    }

    return lookup.values
      .filter((item: any) => item.active !== false) // Exclure les valeurs inactives
      .map((item: any) => item.code || item.label)
      .filter((code: string) => code); // Filtrer les valeurs vides
  } catch (error) {
    console.error(`Erreur lors de la récupération des codes pour la lookup "${lookupKey}":`, error);
    return [];
  }
}



