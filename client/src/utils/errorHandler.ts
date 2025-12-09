/**
 * Utilitaire pour parser et formater les erreurs GraphQL de manière lisible
 * Extrait les informations pertinentes : champ problématique, raison, suggestions
 */

export type ParsedError = {
  message: string;
  field?: string;
  reason?: string;
  suggestion?: string;
  details?: string[];
};

/**
 * Parse une erreur GraphQL pour extraire des informations détaillées
 */
export function parseGraphQLError(error: any): ParsedError {
  // Si c'est déjà un objet ParsedError, le retourner tel quel
  if (error.parsed) {
    return error;
  }

  const defaultError: ParsedError = {
    message: 'Une erreur inattendue s\'est produite',
  };

  // Erreur GraphQL - Vérifier en PRIORITÉ avant les erreurs réseau
  // Apollo Client peut avoir à la fois networkError et graphQLErrors
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    const graphQLError = error.graphQLErrors[0];
    const message = graphQLError.message || '';
    const extensions = graphQLError.extensions || {};
    const path = graphQLError.path || [];

    // Extraire le champ problématique depuis le path
    let field: string | undefined;
    if (path.length > 0) {
      const lastPath = path[path.length - 1];
      if (typeof lastPath === 'string') {
        field = lastPath;
      }
    }

    // Parser différents types d'erreurs GraphQL
    const parsed: ParsedError = {
      message: message,
      field: field,
    };

    // Erreur de validation (UserInputError) - Vérifier en premier
    // Vérifier d'abord le code, puis le contenu du message
    const isValidationError = extensions.code === 'BAD_USER_INPUT' 
      || message.includes('does not exist in') 
      || message.includes('invalid value') 
      || message.includes('got invalid value');
    
    if (isValidationError) {
      // Pattern 1: Variable "$input" got invalid value "" at "input.virtualization"; Value "" does not exist in "VirtualizationType" enum.
      // Ce pattern doit être vérifié en premier car il est plus spécifique
      // Regex amélioré pour capturer les chaînes vides et les valeurs entre guillemets
      // Pattern flexible pour gérer les espaces optionnels
      const variableMatch = message.match(/got\s+invalid\s+value\s+"([^"]*)"\s+at\s+"([^"]+)";\s*Value\s+"([^"]*)"\s+does\s+not\s+exist\s+in\s+"([^"]+)"\s+enum/i);
      if (variableMatch) {
        const invalidValue = variableMatch[1] || variableMatch[3] || '';
        const fieldPath = variableMatch[2];
        const enumName = variableMatch[4];
        
        // Extraire le nom du champ depuis le path (input.virtualization -> virtualization)
        const fieldName = fieldPath.split('.').pop() || fieldPath;
        parsed.field = fieldName;
        parsed.message = `Erreur de validation pour le champ "${fieldName}"`;
        
        if (invalidValue === '' || invalidValue === '""') {
          parsed.reason = `Le champ "${fieldName}" ne peut pas être vide. Une valeur valide doit être sélectionnée dans l'enum "${enumName}"`;
          parsed.suggestion = `Veuillez sélectionner une valeur valide dans la liste déroulante pour le champ "${fieldName}". Si le champ est optionnel, laissez-le vide ou sélectionnez une valeur appropriée.`;
        } else {
          parsed.reason = `La valeur "${invalidValue}" n'est pas valide pour le champ "${fieldName}". Cette valeur n'existe pas dans l'enum "${enumName}"`;
          parsed.suggestion = `Veuillez sélectionner une valeur valide dans la liste proposée pour le champ "${fieldName}"`;
        }
        return parsed;
      }
      
      // Pattern 2: Value "xxx" does not exist in "EnumName" enum (format plus simple)
      const enumMatch = message.match(/Value\s+"([^"]*)"\s+does not exist in\s+"([^"]+)"\s+enum/);
      if (enumMatch) {
        const invalidValue = enumMatch[1];
        const enumName = enumMatch[2];
        const extractedField = field || enumName.replace('Type', '').replace('Enum', '').toLowerCase();
        parsed.field = extractedField;
        parsed.message = `Erreur de validation pour le champ "${extractedField}"`;
        
        if (invalidValue === '' || invalidValue === '""') {
          parsed.reason = `Le champ "${extractedField}" ne peut pas être vide. Une valeur valide doit être sélectionnée`;
          parsed.suggestion = `Veuillez sélectionner une valeur valide dans la liste déroulante pour le champ "${extractedField}"`;
        } else {
          parsed.reason = `La valeur "${invalidValue}" n'est pas valide pour le champ "${extractedField}"`;
          parsed.suggestion = `Veuillez sélectionner une valeur valide dans la liste proposée`;
        }
        return parsed;
      }

      // Erreur de type (Cast to ObjectId failed)
      const castMatch = message.match(/Cast to (\w+) failed for value "([^"]+)" \(type (\w+)\) at path "([^"]+)"/);
      if (castMatch) {
        const expectedType = castMatch[1];
        const invalidValue = castMatch[2];
        const actualType = castMatch[3];
        const fieldPath = castMatch[4];
        parsed.field = fieldPath;
        parsed.reason = `Le champ "${fieldPath}" attend un ${expectedType}, mais a reçu "${invalidValue}" (${actualType})`;
        parsed.suggestion = `Vérifiez que la valeur est correctement formatée`;
      }

      // Erreur de validation Mongoose
      const validationMatch = message.match(/(\w+) validation failed: (.+)/);
      if (validationMatch) {
        const entityName = validationMatch[1];
        const validationDetails = validationMatch[2];
        parsed.reason = `Erreur de validation pour ${entityName}`;
        
        // Extraire les détails de validation
        const details: string[] = [];
        const fieldMatches = validationDetails.match(/(\w+): (.+?)(?:,|$)/g);
        if (fieldMatches) {
          fieldMatches.forEach((match) => {
            const fieldMatch = match.match(/(\w+): (.+?)(?:,|$)/);
            if (fieldMatch) {
              const fieldName = fieldMatch[1];
              const fieldError = fieldMatch[2];
              details.push(`${fieldName}: ${fieldError}`);
              if (!parsed.field) {
                parsed.field = fieldName;
              }
            }
          });
        }
        parsed.details = details;
      }
    }

    // Erreur d'autorisation
    if (extensions.code === 'UNAUTHENTICATED' || extensions.code === 'FORBIDDEN') {
      parsed.reason = 'Vous n\'avez pas les permissions nécessaires';
      parsed.suggestion = 'Contactez un administrateur si vous pensez que c\'est une erreur';
    }

    // Erreur interne
    if (extensions.code === 'INTERNAL_SERVER_ERROR') {
      parsed.reason = 'Une erreur interne s\'est produite côté serveur';
      parsed.suggestion = 'Veuillez réessayer dans quelques instants. Si le problème persiste, contactez le support';
    }

    // Si on a un message mais pas de raison/suggestion, essayer de parser le message brut
    if (!parsed.reason && message) {
      // Essayer de détecter les erreurs d'enum même si le code n'est pas BAD_USER_INPUT
      if (message.includes('does not exist in') && message.includes('enum')) {
        const enumMatch = message.match(/Value\s+"([^"]*)"\s+does not exist in\s+"([^"]+)"\s+enum/);
        if (enumMatch) {
          const invalidValue = enumMatch[1];
          const enumName = enumMatch[2];
          const extractedField = field || enumName.replace('Type', '').replace('Enum', '').toLowerCase();
          parsed.field = extractedField;
          parsed.message = `Erreur de validation pour le champ "${extractedField}"`;
          
          if (invalidValue === '' || invalidValue === '""') {
            parsed.reason = `Le champ "${extractedField}" ne peut pas être vide. Une valeur valide doit être sélectionnée`;
            parsed.suggestion = `Veuillez sélectionner une valeur valide dans la liste déroulante pour le champ "${extractedField}"`;
          } else {
            parsed.reason = `La valeur "${invalidValue}" n'est pas valide pour le champ "${extractedField}"`;
            parsed.suggestion = `Veuillez sélectionner une valeur valide dans la liste proposée`;
          }
          return parsed;
        }
      }
    }

    return parsed;
  }

  // Erreur générique - Vérifier si c'est une erreur Apollo avec un message
  if (error.message) {
    // Essayer de parser le message même si ce n'est pas une erreur GraphQL structurée
    if (error.message.includes('does not exist in') && error.message.includes('enum')) {
      const enumMatch = error.message.match(/Value\s+"([^"]*)"\s+does not exist in\s+"([^"]+)"\s+enum/);
      if (enumMatch) {
        const invalidValue = enumMatch[1];
        const enumName = enumMatch[2];
        const extractedField = enumName.replace('Type', '').replace('Enum', '').toLowerCase();
        return {
          message: `Erreur de validation pour le champ "${extractedField}"`,
          field: extractedField,
          reason: invalidValue === '' || invalidValue === '""' 
            ? `Le champ "${extractedField}" ne peut pas être vide. Une valeur valide doit être sélectionnée`
            : `La valeur "${invalidValue}" n'est pas valide pour le champ "${extractedField}"`,
          suggestion: `Veuillez sélectionner une valeur valide dans la liste déroulante pour le champ "${extractedField}"`,
        };
      }
    }
    
    return {
      message: error.message,
      reason: 'Une erreur s\'est produite lors de l\'opération',
    };
  }

  return defaultError;
}

/**
 * Formate un message d'erreur pour l'affichage à l'utilisateur
 */
export function formatErrorMessage(parsedError: ParsedError): string {
  let message = parsedError.message;

  if (parsedError.reason) {
    message += `\n\nRaison : ${parsedError.reason}`;
  }

  if (parsedError.field) {
    message += `\n\nChamp concerné : ${parsedError.field}`;
  }

  if (parsedError.suggestion) {
    message += `\n\nSuggestion : ${parsedError.suggestion}`;
  }

  if (parsedError.details && parsedError.details.length > 0) {
    message += `\n\nDétails :\n${parsedError.details.join('\n')}`;
  }

  return message;
}

/**
 * Valide qu'une valeur n'est pas une valeur par défaut invalide
 */
export function isValidValue(value: any, fieldName: string): { valid: boolean; error?: string } {
  // Vérifier les valeurs par défaut invalides
  const invalidDefaults = ['-', '', null, undefined];
  
  if (invalidDefaults.includes(value)) {
    return {
      valid: false,
      error: `Le champ "${fieldName}" ne peut pas être vide ou avoir la valeur "-". Veuillez sélectionner une valeur valide.`,
    };
  }

  // Vérifier les chaînes vides après trim
  if (typeof value === 'string' && value.trim() === '') {
    return {
      valid: false,
      error: `Le champ "${fieldName}" ne peut pas être vide.`,
    };
  }

  return { valid: true };
}

/**
 * Valide un objet de formulaire avant soumission
 */
export function validateFormData(formData: Record<string, any>, requiredFields: string[]): {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
} {
  const errors: Array<{ field: string; message: string }> = [];

  // Vérifier les champs requis
  requiredFields.forEach((field) => {
    const value = formData[field];
    const validation = isValidValue(value, field);
    if (!validation.valid) {
      errors.push({
        field,
        message: validation.error || `Le champ "${field}" est requis`,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

