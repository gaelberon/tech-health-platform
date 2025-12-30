/**
 * Dashboard de l'éditeur avec statistiques et vue financière agrégée
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface EditorDashboardProps {
  editor: any;
  editorId: string;
}

const EditorDashboard: React.FC<EditorDashboardProps> = ({ editor }) => {
  const { t } = useTranslation();

  // Par défaut, on masque les solutions archivées ; l'utilisateur peut les inclure via un toggle.
  const [showArchivedSolutions, setShowArchivedSolutions] = useState(false);

  // Calcul des statistiques
  const stats = useMemo(() => {
    if (!editor || !editor.solutions) {
      return {
        solutionsCount: 0,
        environmentsCount: 0,
        environmentsByType: {} as Record<string, number>,
        totalMonthlyCost: 0,
        hostingCost: 0,
        licensesCost: 0,
        opsCost: 0,
        environmentsWithCosts: 0,
      };
    }

    const allSolutions = editor.solutions || [];
    const solutions = showArchivedSolutions
      ? allSolutions
      : allSolutions.filter((sol: any) => !sol.archived);
    const allEnvironments = solutions.flatMap((sol: any) => sol.environments || []);
    
    const environmentsByType: Record<string, number> = {};
    let totalMonthlyCost = 0;
    let hostingCost = 0;
    let licensesCost = 0;
    let opsCost = 0;
    let environmentsWithCosts = 0;

    allEnvironments.forEach((env: any) => {
      // Compter par type
      const envType = env.env_type || 'unknown';
      environmentsByType[envType] = (environmentsByType[envType] || 0) + 1;

      // Calculer les coûts
      if (env.costs) {
        const cost = env.costs;
        if (cost.hosting_monthly) {
          hostingCost += cost.hosting_monthly;
          totalMonthlyCost += cost.hosting_monthly;
        }
        if (cost.licenses_monthly) {
          licensesCost += cost.licenses_monthly;
          totalMonthlyCost += cost.licenses_monthly;
        }
        if (cost.ops_hours_monthly_equiv) {
          opsCost += cost.ops_hours_monthly_equiv;
          totalMonthlyCost += cost.ops_hours_monthly_equiv;
        }
        environmentsWithCosts++;
      }
    });

    return {
      solutionsCount: solutions.length,
      environmentsCount: allEnvironments.length,
      environmentsByType,
      totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
      hostingCost: Math.round(hostingCost * 100) / 100,
      licensesCost: Math.round(licensesCost * 100) / 100,
      opsCost: Math.round(opsCost * 100) / 100,
      environmentsWithCosts,
    };
  }, [editor, showArchivedSolutions]);

  if (!editor) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">{t('dataManagement.loading')}</p>
      </div>
    );
  }

  // Liste des solutions filtrées en fonction du toggle "inclure les archivées"
  const allSolutions = editor.solutions || [];
  const filteredSolutions = showArchivedSolutions
    ? allSolutions
    : allSolutions.filter((sol: any) => !sol.archived);

  return (
    <div className="space-y-6">
      {/* Option d'affichage des solutions archivées */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('dataManagement.dashboard.includeArchivedLabel', 'Inclure les solutions archivées dans les statistiques')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t(
              'dataManagement.dashboard.includeArchivedHint',
              'Par défaut, seules les solutions actives sont prises en compte.'
            )}
          </p>
        </div>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={showArchivedSolutions}
            onChange={(e) => setShowArchivedSolutions(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-600 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 relative transition-colors">
            <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transform transition-transform peer-checked:translate-x-5" />
          </div>
        </label>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nombre de solutions */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('dataManagement.dashboard.solutions')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {stats.solutionsCount}
              </p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>

        {/* Nombre d'environnements */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('dataManagement.dashboard.environments')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {stats.environmentsCount}
              </p>
            </div>
            <div className="text-4xl">🌐</div>
          </div>
        </div>

        {/* Coût mensuel total */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('dataManagement.dashboard.monthlyCost')}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {stats.totalMonthlyCost > 0 ? `${stats.totalMonthlyCost.toLocaleString('fr-FR')} €` : '—'}
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      {/* Répartition des environnements par type */}
      {stats.environmentsCount > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('dataManagement.dashboard.environmentsByType')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.environmentsByType).map(([type, count]) => (
              <div key={type} className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vue financière agrégée */}
      {stats.environmentsWithCosts > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('dataManagement.dashboard.financialOverview')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('dataManagement.dashboard.hostingCost')}
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {stats.hostingCost > 0 ? `${stats.hostingCost.toLocaleString('fr-FR')} €` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('dataManagement.dashboard.licensesCost')}
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {stats.licensesCost > 0 ? `${stats.licensesCost.toLocaleString('fr-FR')} €` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('dataManagement.dashboard.opsCost')}
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {stats.opsCost > 0 ? `${stats.opsCost.toLocaleString('fr-FR')} €` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <span className="text-base font-semibold text-blue-900 dark:text-blue-300">
                {t('dataManagement.dashboard.totalMonthly')}
              </span>
              <span className="text-xl font-bold text-blue-900 dark:text-blue-300">
                {stats.totalMonthlyCost.toLocaleString('fr-FR')} €
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t('dataManagement.dashboard.costsNote', { count: stats.environmentsWithCosts })}
            </p>
          </div>
        </div>
      )}

      {/* Liste des solutions avec résumé */}
      {filteredSolutions && filteredSolutions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('dataManagement.dashboard.solutionsList')}
          </h3>
          <div className="space-y-4">
            {filteredSolutions.map((solution: any) => {
              const envCount = solution.environments?.length || 0;
              return (
                <div
                  key={solution.solutionId}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        {solution.name}
                        {solution.archived && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {t('common.archived', 'Archivée')}
                          </span>
                        )}
                      </h4>
                      {solution.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {solution.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('dataManagement.dashboard.type')}: {solution.type || '—'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('dataManagement.dashboard.environments')}: {envCount}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('dataManagement.dashboard.criticality')}: {solution.product_criticality || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message si aucune donnée */}
      {stats.solutionsCount === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {t('dataManagement.dashboard.noData')}
          </p>
        </div>
      )}
    </div>
  );
};

export default EditorDashboard;


