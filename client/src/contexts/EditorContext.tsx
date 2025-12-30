// Fichier : /client/src/contexts/EditorContext.tsx
// Contexte pour gérer la sélection d'éditeur globale dans l'application

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@apollo/client';
import { LIST_EDITORS_FOR_USER } from '../graphql/queries';
import { useSession } from '../session/SessionContext';

type EditorContextValue = {
  selectedEditorId: string | null; // null = "toutes les entités"
  setSelectedEditorId: (editorId: string | null) => void;
  editors: Array<{ editorId: string; name: string }>;
  loading: boolean;
  canSelectMultiple: boolean; // true si l'utilisateur peut être rattaché à plusieurs éditeurs
  hasSingleEditor: boolean; // true si l'utilisateur n'a qu'un seul éditeur
  singleEditorName: string | null; // nom de l'éditeur si un seul
};

const EditorContext = createContext<EditorContextValue>({
  selectedEditorId: null,
  setSelectedEditorId: () => {},
  editors: [],
  loading: true,
  canSelectMultiple: false,
  hasSingleEditor: false,
  singleEditorName: null,
});

export const useEditor = () => useContext(EditorContext);

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useSession();
  const [selectedEditorId, setSelectedEditorId] = useState<string | null>(null);

  // Récupérer les éditeurs disponibles
  const { data: editorsData, loading: editorsLoading } = useQuery(LIST_EDITORS_FOR_USER, {
    skip: !user,
  });

  const editors = editorsData?.listEditorsForUser || [];

  // Déterminer si l'utilisateur peut être rattaché à plusieurs éditeurs
  const canSelectMultiple = user?.role === 'Admin' || user?.role === 'Supervisor';
  const hasSingleEditor = !canSelectMultiple && editors.length === 1;
  const singleEditorName = hasSingleEditor ? editors[0]?.name || null : null;

  // Initialiser la sélection par défaut
  useEffect(() => {
    if (!user || editorsLoading) return;

    // Pour les utilisateurs avec un seul éditeur : sélectionner automatiquement
    if (hasSingleEditor && selectedEditorId === null) {
      setSelectedEditorId(editors[0].editorId);
    }
    // Pour les utilisateurs avec plusieurs éditeurs : par défaut "toutes les entités" (null)
    // (ne rien faire si déjà initialisé)
  }, [user, editors, editorsLoading, canSelectMultiple, hasSingleEditor, selectedEditorId]);

  return (
    <EditorContext.Provider
      value={{
        selectedEditorId,
        setSelectedEditorId,
        editors,
        loading: editorsLoading,
        canSelectMultiple,
        hasSingleEditor,
        singleEditorName,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

