import React from 'react';

interface EnvironmentTableProps {
  environments: any[];
}

const EnvironmentTable: React.FC<EnvironmentTableProps> = ({ environments }) => {
  const getEnvTypeBadge = (envType: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      production: { label: 'PROD', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
      test: { label: 'TEST', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' },
      dev: { label: 'DEV', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
      backup: { label: 'BACKUP', className: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' },
    };
    return badges[envType] || badges.dev;
  };

  const getRedundancyBadge = (redundancy: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      none: { label: 'Aucune', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
      minimal: { label: 'Minimale', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' },
      'geo-redundant': { label: 'Geo-redondant', className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
      high: { label: 'Élevée', className: 'bg-green-200 dark:bg-green-800/30 text-green-900 dark:text-green-200' },
    };
    return badges[redundancy] || badges.none;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Provider / Région
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Redondance
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Backup (RTO/RPO)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sécurité
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Coûts mensuels
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {environments.map((env) => {
              const envTypeBadge = getEnvTypeBadge(env.env_type);
              const redundancyBadge = getRedundancyBadge(env.redundancy);
              const totalCost = (env.costs?.hosting_monthly || 0) + (env.costs?.licenses_monthly || 0);
              const hasSecurity = env.securityProfile && 
                ['MFA', 'SSO'].includes(env.securityProfile.auth) &&
                env.securityProfile.encryption?.in_transit &&
                env.securityProfile.encryption?.at_rest;

              return (
                <tr key={env.envId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${envTypeBadge.className}`}>
                      {envTypeBadge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{env.hosting?.provider || 'N/A'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{env.hosting?.region || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${redundancyBadge.className}`}>
                      {redundancyBadge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {env.backup?.exists ? (
                      <div className="text-sm">
                        <div className="text-green-600 dark:text-green-400">✅</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          RTO: {env.backup.rto_hours || 'N/A'}h
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          RPO: {env.backup.rpo_hours || 'N/A'}h
                        </div>
                      </div>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 text-sm">❌ Aucun</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {hasSecurity ? (
                      <span className="text-green-600 dark:text-green-400 text-sm">✅ Optimal</span>
                    ) : env.securityProfile ? (
                      <span className="text-orange-600 dark:text-orange-400 text-sm">⚠️ Partiel</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 text-sm">❌ Manquant</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {totalCost > 0 ? `${totalCost.toLocaleString('fr-FR')} €` : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnvironmentTable;

