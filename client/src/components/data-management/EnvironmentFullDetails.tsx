/**
 * Composant parent qui orchestre toutes les sections de gestion d'un environnement
 * Inclut : Environment, Hosting, SecurityProfile, MonitoringObservability, EntityCost
 * Navigation par onglets pour une interface claire
 */

import React, { useState, useRef, useEffect } from 'react';
import EnvironmentDetailsSection from './sections/EnvironmentDetailsSection';
import HostingSection from './sections/HostingSection';
import SecurityProfileSection from './sections/SecurityProfileSection';
import MonitoringSection from './sections/MonitoringSection';
import EntityCostSection from './sections/EntityCostSection';

interface EnvironmentFullDetailsProps {
  environment: any;
  solutionId?: string;
  editorId: string;
  showFieldReferences?: boolean;
  onDataUpdated: () => void;
  onSuccess?: (message: string) => void;
}

const EnvironmentFullDetails: React.FC<EnvironmentFullDetailsProps> = ({
  environment,
  solutionId,
  editorId,
  showFieldReferences = false,
  onDataUpdated,
  onSuccess,
}) => {
  // Utiliser useRef pour préserver l'onglet actif même après un refetch
  const activeTabRef = useRef<'environment' | 'hosting' | 'security' | 'monitoring' | 'costs'>('environment');
  const previousEnvIdRef = useRef<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<
    'environment' | 'hosting' | 'security' | 'monitoring' | 'costs'
  >('environment');
  
  // Synchroniser activeTabRef avec activeTab quand l'utilisateur change d'onglet
  const handleTabChange = (tab: 'environment' | 'hosting' | 'security' | 'monitoring' | 'costs') => {
    setActiveTab(tab);
    activeTabRef.current = tab;
  };
  
  // Préserver l'onglet actif quand l'environnement change (refetch)
  // Ne réinitialiser que si c'est un nouvel environnement (envId change)
  useEffect(() => {
    if (environment) {
      const isNewEnvironment = previousEnvIdRef.current !== environment.envId;
      previousEnvIdRef.current = environment.envId;
      
      if (isNewEnvironment) {
        // Nouvel environnement : réinitialiser à 'environment'
        setActiveTab('environment');
        activeTabRef.current = 'environment';
      } else {
        // Même environnement (refetch) : préserver l'onglet actif
        setActiveTab(activeTabRef.current);
      }
    }
  }, [environment?.envId]);

  const tabs = [
    { id: 'environment', label: 'Environnement', icon: '🖥️' },
    { id: 'hosting', label: 'Hébergement', icon: '☁️' },
    { id: 'security', label: 'Sécurité', icon: '🔒' },
    { id: 'monitoring', label: 'Monitoring', icon: '📊' },
    { id: 'costs', label: 'Coûts', icon: '💰' },
  ];

  if (!environment) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Aucun environnement sélectionné
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation par onglets */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        {activeTab === 'environment' && (
          <EnvironmentDetailsSection
            environment={environment}
            environmentId={environment.envId}
            solutionId={solutionId || environment.solutionId}
            editorId={editorId}
            showFieldReferences={showFieldReferences}
            onDataUpdated={onDataUpdated}
            onSuccess={onSuccess}
          />
        )}

        {activeTab === 'hosting' && (
          <HostingSection
            hosting={environment.hosting}
            hostingId={environment.hostingId}
            environmentId={environment.envId}
            editorId={editorId}
            showFieldReferences={showFieldReferences}
            onDataUpdated={onDataUpdated}
            onSuccess={onSuccess}
          />
        )}

        {activeTab === 'security' && (
          <SecurityProfileSection
            securityProfile={environment.securityProfile}
            environmentId={environment.envId}
            editorId={editorId}
            showFieldReferences={showFieldReferences}
            onDataUpdated={onDataUpdated}
            onSuccess={onSuccess}
          />
        )}

        {activeTab === 'monitoring' && (
          <MonitoringSection
            monitoring={environment.monitoringObservability}
            environmentId={environment.envId}
            editorId={editorId}
            showFieldReferences={showFieldReferences}
            onDataUpdated={onDataUpdated}
            onSuccess={onSuccess}
          />
        )}

        {activeTab === 'costs' && (
          <EntityCostSection
            costs={environment.costs}
            environmentId={environment.envId}
            editorId={editorId}
            showFieldReferences={showFieldReferences}
            onDataUpdated={onDataUpdated}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default EnvironmentFullDetails;

