import React, { useState } from 'react';

interface EnvironmentCardProps {
  environment: any;
}

// Composant pour afficher un snapshot de scoring avec détails
const ScoringSnapshotCard: React.FC<{ snapshot: any }> = ({ snapshot }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
  };

  // Formater la date correctement
  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Date inconnue';
    try {
      // Si c'est déjà une string au format ISO ou autre
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR');
    } catch (e) {
      return 'Date invalide';
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {formatDate(snapshot.date)}
        </span>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-semibold rounded ${getRiskColor(snapshot.global_score)}`}>
            {snapshot.global_score.toFixed(1)}/100
          </span>
          {snapshot.calculationDetails && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              {showDetails ? 'Masquer détails' : 'Voir détails'}
            </button>
          )}
        </div>
      </div>
      {snapshot.scores && (
        <div className="space-y-3 mb-2">
          {/* Scores par catégorie */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="font-medium">Sécurité: {snapshot.scores.Security?.toFixed(1) || snapshot.scores.security?.toFixed(1) || 'N/A'}%</div>
            <div className="font-medium">Résilience: {snapshot.scores.Resilience?.toFixed(1) || snapshot.scores.resilience?.toFixed(1) || 'N/A'}%</div>
            <div className="font-medium">Observabilité: {snapshot.scores.Observability?.toFixed(1) || snapshot.scores.observability?.toFixed(1) || 'N/A'}%</div>
            <div className="font-medium">Architecture: {snapshot.scores.Architecture?.toFixed(1) || snapshot.scores.architecture?.toFixed(1) || 'N/A'}%</div>
            <div className="font-medium">Conformité: {snapshot.scores.Compliance?.toFixed(1) || snapshot.scores.compliance?.toFixed(1) || 'N/A'}%</div>
          </div>
          
          {/* Détails des composantes par catégorie */}
          {snapshot.calculationDetails && snapshot.calculationDetails.categories && (
            <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-600">
              {snapshot.calculationDetails.categories.map((category: any, catIdx: number) => (
                <div key={catIdx} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {category.category} ({category.percentage.toFixed(1)}%)
                    </h5>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {category.rawScore.toFixed(1)}/{category.maxRawScore} pts
                    </span>
                  </div>
                  <div className="space-y-1">
                    {category.components.map((component: any, compIdx: number) => (
                      <div key={compIdx} className="flex justify-between items-center text-xs">
                        <div className="flex-1 pr-2">
                          <span className="text-gray-700 dark:text-gray-300">{component.name}</span>
                          <span className="ml-1 text-gray-500 dark:text-gray-500 text-[10px]">({component.reason})</span>
                        </div>
                        <span className={`font-semibold text-[11px] ${
                          component.value === component.max ? 'text-green-600 dark:text-green-400' :
                          component.value === 0 ? 'text-red-600 dark:text-red-400' :
                          'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {component.value.toFixed(1)}/{component.max}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {showDetails && snapshot.calculationDetails && (
        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600 space-y-4">
          {/* Rapport de calcul */}
          {snapshot.calculationReport && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                📊 Rapport de calcul
              </h4>
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                {snapshot.calculationReport}
              </pre>
            </div>
          )}
          
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Détails du calcul - Score global: {snapshot.calculationDetails.globalScore.toFixed(1)}/100 
            (Risque: {snapshot.calculationDetails.riskLevel})
          </div>
          {snapshot.calculationDetails.categories.map((category: any, catIdx: number) => (
            <div key={catIdx} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {category.category} (Pondération: {(category.weight * 100).toFixed(0)}%)
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {category.rawScore.toFixed(1)}/{category.maxRawScore} points → {category.percentage.toFixed(1)}% 
                  → Contribution: {category.contribution.toFixed(1)} points
                </div>
              </div>
              <div className="space-y-2 mt-3">
                {category.components.map((component: any, compIdx: number) => (
                  <div key={compIdx} className="flex justify-between items-start text-xs">
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{component.name}:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">{component.reason}</span>
                    </div>
                    <div className="ml-4 text-right">
                      <span className={`font-semibold ${
                        component.value === component.max ? 'text-green-600 dark:text-green-400' :
                        component.value === 0 ? 'text-red-600 dark:text-red-400' :
                        'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {component.value.toFixed(1)}/{component.max}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EnvironmentCard: React.FC<EnvironmentCardProps> = ({ environment }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fonction pour obtenir le badge de type d'environnement
  const getEnvTypeBadge = (envType: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      production: { label: 'PRODUCTION', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' },
      test: { label: 'TEST', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
      dev: { label: 'DEV', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
      backup: { label: 'BACKUP', className: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600' },
      recette: { label: 'RECETTE', className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    };
    // Pour les types non reconnus, afficher le type en majuscules avec un style par défaut
    return badges[envType] || { label: envType?.toUpperCase() || 'UNKNOWN', className: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600' };
  };

  // Fonction pour obtenir le badge de redondance
  const getRedundancyBadge = (redundancy: string) => {
    // Normaliser la redondance : gérer à la fois 'geo-redundant' (MongoDB) et 'geo_redundant' (GraphQL)
    const normalizedRedundancy = redundancy === 'geo_redundant' ? 'geo-redundant' : redundancy;
    const badges: Record<string, { label: string; className: string }> = {
      none: { label: 'Aucune', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
      minimal: { label: 'Minimale', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' },
      'geo-redundant': { label: 'Geo-redondant', className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
      high: { label: 'Élevée', className: 'bg-green-200 dark:bg-green-800/30 text-green-900 dark:text-green-200' },
    };
    return badges[normalizedRedundancy] || badges.none;
  };

  // Calculer l'indicateur de santé basé sur le score du snapshot le plus récent
  const calculateHealthIndicator = () => {
    // Si un snapshot existe, utiliser son risk_level
    if (environment.scoringSnapshots && environment.scoringSnapshots.length > 0) {
      const latestSnapshot = environment.scoringSnapshots[0]; // Le plus récent est le premier (trié par date décroissante)
      const riskLevel = latestSnapshot.risk_level || latestSnapshot.calculationDetails?.riskLevel;
      const globalScore = latestSnapshot.global_score || latestSnapshot.calculationDetails?.globalScore;
      
      if (riskLevel) {
        switch (riskLevel) {
          case 'Low':
            return { label: 'Optimal', className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', icon: '✅' };
          case 'Medium':
            return { label: 'Moyen', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300', icon: '⚠️' };
          case 'High':
            return { label: 'Élevé', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300', icon: '⚠️' };
          case 'Critical':
            return { label: 'Critique', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', icon: '❌' };
          default:
            // Fallback sur le score si risk_level n'est pas défini
            if (globalScore !== undefined) {
              if (globalScore >= 85) {
                return { label: 'Optimal', className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', icon: '✅' };
              } else if (globalScore >= 70) {
                return { label: 'Moyen', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300', icon: '⚠️' };
              } else if (globalScore >= 50) {
                return { label: 'Élevé', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300', icon: '⚠️' };
              } else {
                return { label: 'Critique', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', icon: '❌' };
              }
            }
        }
      }
    }
    
    // Fallback : utiliser la logique basée sur les caractéristiques de l'environnement
    const normalizedRedundancy = environment.redundancy === 'geo_redundant' ? 'geo-redundant' : environment.redundancy;
    const hasGoodRedundancy = ['geo-redundant', 'high'].includes(normalizedRedundancy);
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

          {/* Snapshots de scoring */}
          {environment.scoringSnapshots && environment.scoringSnapshots.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Historique des scores</h4>
              <div className="space-y-2">
                {environment.scoringSnapshots.map((snapshot: any, idx: number) => (
                  <ScoringSnapshotCard key={snapshot.scoreId || idx} snapshot={snapshot} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnvironmentCard;

