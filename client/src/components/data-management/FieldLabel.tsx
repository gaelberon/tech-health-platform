/**
 * Composant pour afficher un label avec optionnellement la référence au modèle de données
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { getFieldReference, formatFieldReference } from '../../utils/fieldReferences';

interface FieldLabelProps {
  translationKey: string;
  required?: boolean;
  showFieldReference?: boolean;
  className?: string;
}

const FieldLabel: React.FC<FieldLabelProps> = ({
  translationKey,
  required = false,
  showFieldReference = false,
  className = '',
}) => {
  const { t } = useTranslation();
  const ref = showFieldReference ? getFieldReference(translationKey) : null;

  // Debug: vérifier que showFieldReference est bien reçu
  if (showFieldReference && !ref) {
    console.warn(`FieldLabel: No reference found for translationKey "${translationKey}"`);
  }

  return (
    <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${className}`}>
      <span>
        {t(translationKey)}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      {showFieldReference && ref && (
        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
          ({formatFieldReference(ref)})
        </span>
      )}
    </label>
  );
};

export default FieldLabel;

