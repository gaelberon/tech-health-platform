import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { LIST_EDITORS_FOR_USER, GET_SOLUTION_HOSTING_VIEW } from '../graphql/queries';
import { useSession } from '../session/SessionContext';
import EnvironmentCard from '../components/hosting/EnvironmentCard';
import EnvironmentTable from '../components/hosting/EnvironmentTable';

type ViewMode = 'cards' | 'table';
type EnvTypeFilter = 'all' | 'production' | 'test' | 'dev' | 'backup';

interface Editor {
  editorId: string;
  name: string;
  solutions: Array<{
    solutionId: string;
    name: string;
    type: string;
  }>;
}

const HostingView: React.FC = () => {
  const { user } = useSession();
  const [selectedEditorId, setSelectedEditorId] = useState<string>('');
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [envTypeFilter, setEnvTypeFilter] = useState<EnvTypeFilter>('all');

  // Récupérer les éditeurs accessibles
  const { data: editorsData, loading: editorsLoading } = useQuery(LIST_EDITORS_FOR_USER);

  // Récupérer les données de la solution sélectionnée
  const { data: solutionData, loading: solutionLoading } = useQuery(GET_SOLUTION_HOSTING_VIEW, {
    variables: { solutionId: selectedSolutionId },
    skip: !selectedSolutionId,
  });

  // Déterminer si l'utilisateur doit sélectionner un éditeur
  const shouldSelectEditor = useMemo(() => {
    if (!user || !editorsData?.listEditorsForUser) return false;
    
    // Admin : sélection nécessaire si plusieurs éditeurs disponibles
    // (même sans éditeur associé, l'admin voit tous les éditeurs)
    if (user.role === 'Admin') {
      return editorsData.listEditorsForUser.length > 1;
    }
    
    // Editor/EntityDirector : pas de sélection si un seul éditeur
    if ((user.role === 'Editor' || user.role === 'EntityDirector') && editorsData.listEditorsForUser.length === 1) {
      return false;
    }
    
    // Supervisor : sélection nécessaire si plusieurs éditeurs dans le portefeuille
    if (user.role === 'Supervisor') {
      return editorsData.listEditorsForUser.length > 1;
    }
    
    return false;
  }, [user, editorsData]);

  // Sélectionner automatiquement le premier éditeur si un seul disponible
  // (sauf pour Admin qui peut avoir besoin de sélectionner)
  useEffect(() => {
    if (editorsData?.listEditorsForUser && !selectedEditorId) {
      // Pour Editor/EntityDirector : toujours sélectionner automatiquement
      if ((user?.role === 'Editor' || user?.role === 'EntityDirector') && editorsData.listEditorsForUser.length === 1) {
        setSelectedEditorId(editorsData.listEditorsForUser[0].editorId);
      }
      // Pour Supervisor : sélectionner si un seul éditeur dans le portefeuille
      else if (user?.role === 'Supervisor' && editorsData.listEditorsForUser.length === 1) {
        setSelectedEditorId(editorsData.listEditorsForUser[0].editorId);
      }
      // Pour Admin : sélectionner automatiquement le premier si disponible
      else if (user?.role === 'Admin' && editorsData.listEditorsForUser.length > 0) {
        setSelectedEditorId(editorsData.listEditorsForUser[0].editorId);
      }
    }
  }, [editorsData, selectedEditorId, user]);

  // Sélectionner automatiquement la première solution quand un éditeur est sélectionné
  useEffect(() => {
    if (selectedEditorId && editorsData?.listEditorsForUser) {
      const editor = editorsData.listEditorsForUser.find((e: Editor) => e.editorId === selectedEditorId);
      if (editor && editor.solutions && editor.solutions.length > 0 && !selectedSolutionId) {
        setSelectedSolutionId(editor.solutions[0].solutionId);
      }
    }
  }, [selectedEditorId, editorsData, selectedSolutionId]);

  // Filtrer les environnements selon le filtre de type
  const filteredEnvironments = useMemo(() => {
    if (!solutionData?.getSolution?.environments) return [];
    
    const envs = solutionData.getSolution.environments;
    if (envTypeFilter === 'all') return envs;
    
    return envs.filter((env: any) => env.env_type === envTypeFilter);
  }, [solutionData, envTypeFilter]);

  // Calculer les métriques d'ensemble
  const overviewMetrics = useMemo(() => {
    if (!solutionData?.getSolution?.environments) {
      return {
        totalEnvs: 0,
        byType: { production: 0, test: 0, dev: 0, backup: 0 },
        totalCost: 0,
      };
    }

    const envs = solutionData.getSolution.environments;
    const byType = {
      production: envs.filter((e: any) => e.env_type === 'production').length,
      test: envs.filter((e: any) => e.env_type === 'test').length,
      dev: envs.filter((e: any) => e.env_type === 'dev').length,
      backup: envs.filter((e: any) => e.env_type === 'backup').length,
    };

    const totalCost = envs.reduce((sum: number, env: any) => {
      return sum + (env.costs?.hosting_monthly || 0) + (env.costs?.licenses_monthly || 0);
    }, 0);

    return {
      totalEnvs: envs.length,
      byType,
      totalCost,
    };
  }, [solutionData]);

  const selectedEditor = editorsData?.listEditorsForUser?.find((e: Editor) => e.editorId === selectedEditorId);
  const selectedSolution = selectedEditor?.solutions?.find((s: any) => s.solutionId === selectedSolutionId);

  if (editorsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Chargement des éditeurs...</div>
      </div>
    );
  }

  if (!editorsData?.listEditorsForUser || editorsData.listEditorsForUser.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center transition-colors">
        <p className="text-yellow-800 dark:text-yellow-200 font-semibold">Aucun éditeur disponible</p>
        <p className="text-yellow-600 dark:text-yellow-300 text-sm mt-2">
          Vous n'avez pas accès à des éditeurs pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Vue d'Hébergement</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Visualisation et analyse de l'infrastructure d'hébergement des solutions
        </p>
      </div>

      {/* Navigation hiérarchique */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4 transition-colors">
        {/* Sélecteur d'éditeur */}
        {shouldSelectEditor ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Éditeur
            </label>
            <select
              value={selectedEditorId}
              onChange={(e) => {
                setSelectedEditorId(e.target.value);
                setSelectedSolutionId(''); // Reset solution quand éditeur change
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="">Sélectionner un éditeur...</option>
              {editorsData.listEditorsForUser.map((editor: Editor) => (
                <option key={editor.editorId} value={editor.editorId}>
                  {editor.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Éditeur
            </label>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300">
              {selectedEditor?.name || editorsData.listEditorsForUser[0]?.name}
            </div>
          </div>
        )}

        {/* Sélecteur de solution */}
        {selectedEditor && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Solution
            </label>
            <select
              value={selectedSolutionId}
              onChange={(e) => setSelectedSolutionId(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="">Sélectionner une solution...</option>
              {selectedEditor.solutions?.map((solution: any) => (
                <option key={solution.solutionId} value={solution.solutionId}>
                  {solution.name} ({solution.type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Vue d'ensemble */}
      {selectedSolutionId && solutionData?.getSolution && (
        <>
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/30 dark:to-teal-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Vue d'ensemble - {solutionData.getSolution.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{overviewMetrics.totalEnvs}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Environnements</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{overviewMetrics.byType.production}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Production</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{overviewMetrics.byType.test}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Test</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{overviewMetrics.byType.dev}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Développement</div>
              </div>
            </div>
            {overviewMetrics.totalCost > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Coût total mensuel estimé : {overviewMetrics.totalCost.toLocaleString('fr-FR')} €
                </div>
              </div>
            )}
          </div>

          {/* Filtres et actions */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-wrap items-center gap-4 transition-colors">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtres :</label>
              <select
                value={envTypeFilter}
                onChange={(e) => setEnvTypeFilter(e.target.value as EnvTypeFilter)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="all">Tous</option>
                <option value="production">Production</option>
                <option value="test">Test</option>
                <option value="dev">Développement</option>
                <option value="backup">Backup</option>
              </select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vue :</label>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Cartes
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Tableau
              </button>
            </div>
          </div>

          {/* Contenu : Cartes ou Tableau */}
          {solutionLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">Chargement des environnements...</div>
            </div>
          ) : filteredEnvironments.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center transition-colors">
              <p className="text-gray-600 dark:text-gray-400">Aucun environnement trouvé pour les filtres sélectionnés.</p>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEnvironments.map((env: any) => (
                <EnvironmentCard key={env.envId} environment={env} />
              ))}
            </div>
          ) : (
            <EnvironmentTable environments={filteredEnvironments} />
          )}
        </>
      )}

      {/* Message si aucune solution sélectionnée */}
      {selectedEditorId && !selectedSolutionId && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center transition-colors">
          <p className="text-blue-800 dark:text-blue-200">Veuillez sélectionner une solution pour afficher les environnements.</p>
        </div>
      )}
    </div>
  );
};

export default HostingView;

