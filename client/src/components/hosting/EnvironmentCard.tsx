import React, { useState } from 'react';

interface EnvironmentCardProps {
  environment: any;
}

const EnvironmentCard: React.FC<EnvironmentCardProps> = ({ environment }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fonction pour obtenir le badge de type d'environnement
  const getEnvTypeBadge = (envType: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      production: { label: 'PRODUCTION', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' },
      test: { label: 'TEST', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
      dev: { label: 'DEV', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
      backup: { label: 'BACKUP', className: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600' },
    };
    return badges[envType] || badges.dev;
  };

  // Fonction pour obtenir le badge de redondance
  const getRedundancyBadge = (redundancy: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      none: { label: 'Aucune', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
      minimal: { label: 'Minimale', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' },
      'geo-redundant': { label: 'Geo-redondant', className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
      high: { label: 'Élevée', className: 'bg-green-200 dark:bg-green-800/30 text-green-900 dark:text-green-200' },
    };
    return badges[redundancy] || badges.none;
  };

  // Calculer l'indicateur de santé
  const calculateHealthIndicator = () => {
    const hasGoodRedundancy = ['geo-redundant', 'high'].includes(environment.redundancy);
    const hasBackup = environment.backup?.exists;
    const hasGoodBackup = hasBackup && 
      (environment.backup.rto_hours || 999) <= 24 && 
      (environment.backup.rpo_hours || 999) <= 4;
    const hasGoodSecurity = environment.securityProfile && 
      ['MFA', 'SSO'].includes(environment.securityProfile.auth) &&
      environment.securityProfile.encryption?.in_transit &&
      environment.securityProfile.encryption?.at_rest;

    if (hasGoodRedundancy && hasGoodBackup && hasGoodSecurity) {
      return { label: 'Optimal', className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', icon: '✅' };
    } else if (hasBackup && (environment.redundancy === 'minimal' || !hasGoodSecurity)) {
      return { label: 'À améliorer', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300', icon: '⚠️' };
    } else {
      return { label: 'Critique', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', icon: '❌' };
    }
  };

  const envTypeBadge = getEnvTypeBadge(environment.env_type);
  const redundancyBadge = getRedundancyBadge(environment.redundancy);
  const healthIndicator = calculateHealthIndicator();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* En-tête */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 text-xs font-semibold rounded border ${envTypeBadge.className}`}>
            {envTypeBadge.label}
          </span>
          <span className={`px-2 py-1 text-xs font-semibold rounded ${healthIndicator.className}`}>
            {healthIndicator.icon} {healthIndicator.label}
          </span>
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {environment.envId}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-4 space-y-3">
        {/* Hébergement */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Hébergement</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">🏢</span>
              <span className="text-gray-900 dark:text-gray-100">{environment.hosting?.provider || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">📍</span>
              <span className="text-gray-900 dark:text-gray-100">{environment.hosting?.region || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">☁️</span>
              <span className="text-gray-900 dark:text-gray-100 capitalize">{environment.hosting?.tier || 'N/A'}</span>
            </div>
            {environment.hosting?.certifications && environment.hosting.certifications.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {environment.hosting.certifications.map((cert: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                  >
                    🏅 {cert}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Redondance */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Redondance</h4>
          <span className={`px-2 py-1 text-xs font-medium rounded ${redundancyBadge.className}`}>
            {redundancyBadge.label}
          </span>
        </div>

        {/* Backup */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Backup</h4>
          <div className="text-sm space-y-1">
            {environment.backup?.exists ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-gray-900 dark:text-gray-100">Sauvegarde active</span>
                </div>
                {environment.backup.rto_hours && (
                  <div className="text-gray-600 dark:text-gray-400">
                    RTO: <span className="font-medium text-gray-900 dark:text-gray-100">{environment.backup.rto_hours}h</span>
                  </div>
                )}
                {environment.backup.rpo_hours && (
                  <div className="text-gray-600 dark:text-gray-400">
                    RPO: <span className="font-medium text-gray-900 dark:text-gray-100">{environment.backup.rpo_hours}h</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <span>❌</span>
                <span>Aucune sauvegarde</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bouton pour voir les détails */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center justify-center gap-2"
        >
          {isExpanded ? (
            <>
              <span>Masquer les détails</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              <span>Voir les détails</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Détails expandables */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 space-y-4 transition-colors">
          {/* Architecture */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Architecture</h4>
            <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              {environment.deployment_type && (
                <div>Type de déploiement: <span className="font-medium capitalize">{environment.deployment_type}</span></div>
              )}
              {environment.virtualization && (
                <div>Virtualisation: <span className="font-medium capitalize">{environment.virtualization}</span></div>
              )}
              {environment.tech_stack && environment.tech_stack.length > 0 && (
                <div>
                  Tech stack: <span className="font-medium">{environment.tech_stack.join(', ')}</span>
                </div>
              )}
              {environment.data_types && environment.data_types.length > 0 && (
                <div>
                  Types de données: <span className="font-medium">{environment.data_types.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sécurité */}
          {environment.securityProfile && (
            <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Sécurité</h4>
            <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                <div>Authentification: <span className="font-medium">{environment.securityProfile.auth}</span></div>
                <div>
                  Chiffrement: 
                  <span className="ml-2">
                    {environment.securityProfile.encryption?.in_transit ? '✅ Transit' : '❌ Transit'}
                    {environment.securityProfile.encryption?.at_rest ? ' ✅ Repos' : ' ❌ Repos'}
                  </span>
                </div>
                {environment.securityProfile.patching && (
                  <div>Gestion des patches: <span className="font-medium capitalize">{environment.securityProfile.patching}</span></div>
                )}
                {environment.securityProfile.pentest_freq && (
                  <div>Fréquence des pentests: <span className="font-medium capitalize">{environment.securityProfile.pentest_freq}</span></div>
                )}
              </div>
            </div>
          )}

          {/* Monitoring */}
          {environment.monitoringObservability && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Monitoring</h4>
              <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                <div>Monitoring de performance: <span className="font-medium">{environment.monitoringObservability.perf_monitoring}</span></div>
                <div>Centralisation des logs: <span className="font-medium">{environment.monitoringObservability.log_centralization}</span></div>
                {environment.monitoringObservability.tools && environment.monitoringObservability.tools.length > 0 && (
                  <div>
                    Outils: <span className="font-medium">{environment.monitoringObservability.tools.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coûts */}
          {environment.costs && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Coûts</h4>
              <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                {environment.costs.hosting_monthly && (
                  <div>Hébergement mensuel: <span className="font-medium">{environment.costs.hosting_monthly.toLocaleString('fr-FR')} €</span></div>
                )}
                {environment.costs.licenses_monthly && (
                  <div>Licences mensuelles: <span className="font-medium">{environment.costs.licenses_monthly.toLocaleString('fr-FR')} €</span></div>
                )}
                {environment.costs.comments && (
                  <div className="text-gray-600 dark:text-gray-400 italic">{environment.costs.comments}</div>
                )}
              </div>
            </div>
          )}

          {/* Plan de reprise */}
          {environment.disaster_recovery_plan && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Plan de reprise</h4>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {environment.disaster_recovery_plan}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnvironmentCard;

