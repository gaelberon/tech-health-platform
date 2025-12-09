/**
 * Composant pour afficher des messages d'erreur détaillés et contextuels
 */

import React from 'react';
import type { ParsedError } from '../../utils/errorHandler';

interface ErrorMessageProps {
  error: ParsedError;
  onClose?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onClose }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4 rounded-md">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            {error.message}
          </h3>
          {error.reason && (
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p className="font-medium">Raison :</p>
              <p>{error.reason}</p>
            </div>
          )}
          {error.field && (
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p className="font-medium">Champ concerné :</p>
              <p className="font-mono bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded inline-block">
                {error.field}
              </p>
            </div>
          )}
          {error.suggestion && (
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p className="font-medium">Suggestion :</p>
              <p>{error.suggestion}</p>
            </div>
          )}
          {error.details && error.details.length > 0 && (
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p className="font-medium">Détails :</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {error.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="inline-flex text-red-500 hover:text-red-700 dark:hover:text-red-300 focus:outline-none"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;

