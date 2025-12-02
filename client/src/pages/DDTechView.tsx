import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { LIST_EDITORS_FOR_USER, GET_SOLUTION_DD_TECH_VIEW, GET_EDITOR_DD_TECH_VIEW } from '../graphql/queries';
import { useSession } from '../session/SessionContext';

interface Editor {
  editorId: string;
  name: string;
  solutions: Array<{
    solutionId: string;
    name: string;
    type: string;
  }>;
}

const DDTechView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useSession();
  const [selectedEditorId, setSelectedEditorId] = useState<string>('');
  const [selectedSolutionId, setSelectedSolutionId] = useState<string>('');

  // Récupérer les éditeurs accessibles
  const { data: editorsData, loading: editorsLoading } = useQuery(LIST_EDITORS_FOR_USER);

  // Récupérer les données DD Tech de la solution
  const { data: solutionData, loading: solutionLoading } = useQuery(GET_SOLUTION_DD_TECH_VIEW, {
    variables: {
      solutionId: selectedSolutionId,
    },
    skip: !selectedSolutionId,
  });

  // Récupérer les données DD Tech de l'éditeur
  const { data: editorData, loading: editorLoading } = useQuery(GET_EDITOR_DD_TECH_VIEW, {
    variables: {
      editorId: selectedEditorId,
    },
    skip: !selectedEditorId,
  });

  // Déterminer si l'utilisateur doit sélectionner un éditeur
  const shouldSelectEditor = useMemo(() => {
    if (!user || !editorsData?.listEditorsForUser) return false;
    
    if (user.role === 'Admin') {
      return editorsData.listEditorsForUser.length > 1;
    }
    
    if ((user.role === 'Editor' || user.role === 'EntityDirector') && editorsData.listEditorsForUser.length === 1) {
      return false;
    }
    
    if (user.role === 'Supervisor') {
      return editorsData.listEditorsForUser.length > 1;
    }
    
    return false;
  }, [user, editorsData]);

  // Sélectionner automatiquement le premier éditeur si un seul disponible
  useEffect(() => {
    if (editorsData?.listEditorsForUser && !selectedEditorId) {
      if ((user?.role === 'Editor' || user?.role === 'EntityDirector') && editorsData.listEditorsForUser.length === 1) {
        setSelectedEditorId(editorsData.listEditorsForUser[0].editorId);
      } else if (user?.role === 'Supervisor' && editorsData.listEditorsForUser.length === 1) {
        setSelectedEditorId(editorsData.listEditorsForUser[0].editorId);
      } else if (user?.role === 'Admin' && editorsData.listEditorsForUser.length > 0) {
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

  const selectedEditor = editorsData?.listEditorsForUser?.find((e: Editor) => e.editorId === selectedEditorId);
  const selectedSolution = selectedEditor?.solutions?.find((s: any) => s.solutionId === selectedSolutionId);

  const editor = editorData?.editor;
  const solution = solutionData?.solution;
  const ddTechLoading = solutionLoading || editorLoading;

  if (editorsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">{t('ddTech.loadingEditors')}</div>
      </div>
    );
  }

  if (!editorsData?.listEditorsForUser || editorsData.listEditorsForUser.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center transition-colors">
        <p className="text-yellow-800 dark:text-yellow-200 font-semibold">{t('ddTech.noEditors')}</p>
        <p className="text-yellow-600 dark:text-yellow-300 text-sm mt-2">
          {t('ddTech.noEditorsDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('ddTech.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {t('ddTech.subtitle')}
        </p>
      </div>

      {/* Navigation hiérarchique */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4 transition-colors">
        {/* Sélecteur d'éditeur */}
        {shouldSelectEditor ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('ddTech.editor')}
            </label>
            <select
              value={selectedEditorId}
              onChange={(e) => {
                setSelectedEditorId(e.target.value);
                setSelectedSolutionId('');
              }}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="">{t('ddTech.selectEditor')}</option>
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
              {t('ddTech.editor')}
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
              {t('ddTech.solution')}
            </label>
            <select
              value={selectedSolutionId}
              onChange={(e) => setSelectedSolutionId(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="">{t('ddTech.selectSolution')}</option>
              {selectedEditor.solutions?.map((solution: any) => (
                <option key={solution.solutionId} value={solution.solutionId}>
                  {solution.name} ({solution.type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Contenu DD Tech */}
      {selectedSolutionId && (ddTechLoading || solutionLoading || editorLoading) ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">{t('ddTech.loadingData')}</div>
        </div>
      ) : selectedSolutionId && solution && editor ? (
        <div className="space-y-6">
          {/* Section A: Identification et Description Fonctionnelle */}
          <SectionCard
            title={t('ddTech.sectionA.title')}
            icon="📋"
            content={
              <SectionAContent editor={editor} solution={solution} t={t} />
            }
          />

          {/* Section B: Architecture & Hébergement */}
          <SectionCard
            title={t('ddTech.sectionB.title')}
            icon="🏗️"
            content={
              <SectionBContent solution={solution} t={t} />
            }
          />

          {/* Section C: Monitoring / Observabilité */}
          <SectionCard
            title={t('ddTech.sectionC.title')}
            icon="📊"
            content={
              <SectionCContent solution={solution} t={t} />
            }
          />

          {/* Section D: Contraintes, Sécurité, Risques et Conformité */}
          <SectionCard
            title={t('ddTech.sectionD.title')}
            icon="🔒"
            content={
              <SectionDContent solution={solution} editor={editor} t={t} />
            }
          />

          {/* Section E: Évaluation et Stratégie (Volume, Coût et Projection) */}
          <SectionCard
            title={t('ddTech.sectionE.title')}
            icon="💰"
            content={
              <SectionEContent solution={solution} t={t} />
            }
          />

          {/* Section F: Roadmap & Transformation */}
          <SectionCard
            title={t('ddTech.sectionF.title')}
            icon="🗺️"
            content={
              <SectionFContent solution={solution} t={t} />
            }
          />

          {/* Section G: Notes/Commentaires */}
          <SectionCard
            title={t('ddTech.sectionG.title')}
            icon="📝"
            content={
              <SectionGContent solution={solution} t={t} />
            }
          />
        </div>
      ) : selectedSolutionId && !solution ? (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center transition-colors">
          <p className="text-blue-800 dark:text-blue-200">{t('ddTech.noData')}</p>
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center transition-colors">
          <p className="text-blue-800 dark:text-blue-200">{t('ddTech.selectSolutionPrompt')}</p>
        </div>
      )}
    </div>
  );
};

// Composant de carte de section
const SectionCard: React.FC<{ title: string; icon: string; content: React.ReactNode }> = ({
  title,
  icon,
  content,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </h3>
      </div>
      <div className="p-6">{content}</div>
    </div>
  );
};

// Section A: Identification et Description Fonctionnelle
const SectionAContent: React.FC<{ editor: any; solution: any; t: any }> = ({ editor, solution, t }) => {
  return (
    <div className="space-y-4">
      <DataRow label={t('ddTech.sectionA.editorName')} value={editor?.name} />
      <DataRow label={t('ddTech.sectionA.solutionName')} value={solution?.name} />
      <DataRow label={t('ddTech.sectionA.mainUseCase')} value={solution?.main_use_case} />
      <DataRow label={t('ddTech.sectionA.description')} value={solution?.description} />
      <DataRow label={t('ddTech.sectionA.country')} value={editor?.country} />
      <DataRow label={t('ddTech.sectionA.editorSize')} value={editor?.size} />
      <DataRow label={t('ddTech.sectionA.businessCriticality')} value={editor?.business_criticality} />
      {editor?.internal_it_systems && editor.internal_it_systems.length > 0 && (
        <DataRow
          label={t('ddTech.sectionA.internalItSystems')}
          value={<ul className="list-disc list-inside">{editor.internal_it_systems.map((sys: string, idx: number) => <li key={idx}>{sys}</li>)}</ul>}
        />
      )}
      <DataRow label={t('ddTech.sectionA.itSecurityStrategy')} value={editor?.it_security_strategy} />
      {editor?.developmentTeam && (
        <>
          <DataRow label={t('ddTech.sectionA.teamSizeAdequate')} value={editor.developmentTeam?.team_size_adequate} />
          <DataRow label={t('ddTech.sectionA.keyPersonDependency')} value={editor.developmentTeam?.key_person_dependency} />
        </>
      )}
    </div>
  );
};

// Section B: Architecture & Hébergement
const SectionBContent: React.FC<{ solution: any; t: any }> = ({ solution, t }) => {
  const productionEnv = solution?.environments?.find((env: any) => env.env_type === 'production');
  
  return (
    <div className="space-y-4">
      <DataRow label={t('ddTech.sectionB.solutionType')} value={solution?.type} />
      {productionEnv && (
        <>
          <DataRow label={t('ddTech.sectionB.deploymentType')} value={productionEnv.deployment_type} />
          <DataRow label={t('ddTech.sectionB.virtualization')} value={productionEnv.virtualization} />
          <DataRow
            label={t('ddTech.sectionB.techStack')}
            value={productionEnv.tech_stack?.join(', ')}
          />
          <DataRow label={t('ddTech.sectionB.hostingProvider')} value={productionEnv.hosting?.provider} />
          <DataRow label={t('ddTech.sectionB.hostingRegion')} value={productionEnv.hosting?.region} />
          <DataRow label={t('ddTech.sectionB.hostingTier')} value={productionEnv.hosting?.tier} />
          {productionEnv.hosting?.certifications && productionEnv.hosting.certifications.length > 0 && (
            <DataRow
              label={t('ddTech.sectionB.certifications')}
              value={productionEnv.hosting.certifications.join(', ')}
            />
          )}
          <DataRow label={t('ddTech.sectionB.dbScalingMechanism')} value={productionEnv.db_scaling_mechanism} />
        </>
      )}
    </div>
  );
};

// Section C: Monitoring / Observabilité
const SectionCContent: React.FC<{ solution: any; t: any }> = ({ solution, t }) => {
  const productionEnv = solution?.environments?.find((env: any) => env.env_type === 'production');
  
  return (
    <div className="space-y-4">
      {productionEnv?.monitoringObservability && (
        <>
          <DataRow
            label={t('ddTech.sectionC.perfMonitoring')}
            value={productionEnv.monitoringObservability.perf_monitoring}
          />
          <DataRow
            label={t('ddTech.sectionC.logCentralization')}
            value={productionEnv.monitoringObservability.log_centralization}
          />
          {productionEnv.monitoringObservability.tools && productionEnv.monitoringObservability.tools.length > 0 && (
            <DataRow
              label={t('ddTech.sectionC.tools')}
              value={productionEnv.monitoringObservability.tools.join(', ')}
            />
          )}
        </>
      )}
    </div>
  );
};

// Section D: Contraintes, Sécurité, Risques et Conformité
const SectionDContent: React.FC<{ solution: any; editor: any; t: any }> = ({ solution, editor, t }) => {
  const productionEnv = solution?.environments?.find((env: any) => env.env_type === 'production');
  
  return (
    <div className="space-y-4">
      {productionEnv?.securityProfile && (
        <>
          <DataRow label={t('ddTech.sectionD.auth')} value={productionEnv.securityProfile.auth} />
          <DataRow
            label={t('ddTech.sectionD.encryptionInTransit')}
            value={productionEnv.securityProfile.encryption?.in_transit ? t('ddTech.yes') : t('ddTech.no')}
          />
          <DataRow
            label={t('ddTech.sectionD.encryptionAtRest')}
            value={productionEnv.securityProfile.encryption?.at_rest ? t('ddTech.yes') : t('ddTech.no')}
          />
          <DataRow label={t('ddTech.sectionD.patching')} value={productionEnv.securityProfile.patching} />
          <DataRow label={t('ddTech.sectionD.pentestFreq')} value={productionEnv.securityProfile.pentest_freq} />
          <DataRow label={t('ddTech.sectionD.vulnMgmt')} value={productionEnv.securityProfile.vuln_mgmt} />
          <DataRow label={t('ddTech.sectionD.accessControl')} value={productionEnv.securityProfile.access_control} />
          <DataRow
            label={t('ddTech.sectionD.centralizedMonitoring')}
            value={productionEnv.securityProfile.centralized_monitoring ? t('ddTech.yes') : t('ddTech.no')}
          />
          <DataRow
            label={t('ddTech.sectionD.internalAuditsRecent')}
            value={productionEnv.securityProfile.internal_audits_recent}
          />
          <DataRow
            label={t('ddTech.sectionD.pentestResultsSummary')}
            value={productionEnv.securityProfile.pentest_results_summary}
          />
          <DataRow
            label={t('ddTech.sectionD.knownSecurityFlaws')}
            value={productionEnv.securityProfile.known_security_flaws}
          />
          <DataRow
            label={t('ddTech.sectionD.incidentReportingProcess')}
            value={productionEnv.securityProfile.incident_reporting_process}
          />
        </>
      )}
      {productionEnv?.network_security_mechanisms && productionEnv.network_security_mechanisms.length > 0 && (
        <DataRow
          label={t('ddTech.sectionD.networkSecurityMechanisms')}
          value={productionEnv.network_security_mechanisms.join(', ')}
        />
      )}
      {productionEnv?.data_types && productionEnv.data_types.length > 0 && (
        <DataRow
          label={t('ddTech.sectionD.dataTypes')}
          value={productionEnv.data_types.join(', ')}
        />
      )}
      {productionEnv?.redundancy && (
        <DataRow label={t('ddTech.sectionD.redundancy')} value={productionEnv.redundancy} />
      )}
      {productionEnv?.backup && (
        <>
          <DataRow
            label={t('ddTech.sectionD.backupExists')}
            value={productionEnv.backup.exists ? t('ddTech.yes') : t('ddTech.no')}
          />
          {productionEnv.backup.exists && (
            <>
              <DataRow label={t('ddTech.sectionD.backupSchedule')} value={productionEnv.backup.schedule} />
              <DataRow
                label={t('ddTech.sectionD.rtoHours')}
                value={productionEnv.backup.rto_hours ? `${productionEnv.backup.rto_hours}h` : ''}
              />
              <DataRow
                label={t('ddTech.sectionD.rpoHours')}
                value={productionEnv.backup.rpo_hours ? `${productionEnv.backup.rpo_hours}h` : ''}
              />
            </>
          )}
        </>
      )}
      {productionEnv?.disaster_recovery_plan && (
        <DataRow
          label={t('ddTech.sectionD.disasterRecoveryPlan')}
          value={productionEnv.disaster_recovery_plan}
        />
      )}
      {editor?.contracts_for_review && editor.contracts_for_review.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('ddTech.sectionD.contractsForReview')}
          </label>
          <ul className="list-disc list-inside space-y-1 text-gray-900 dark:text-gray-100">
            {editor.contracts_for_review.map((contract: any, idx: number) => (
              <li key={idx}>
                <strong>{contract.type}:</strong> {contract.summary}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Section E: Évaluation et Stratégie (Volume, Coût et Projection)
const SectionEContent: React.FC<{ solution: any; t: any }> = ({ solution, t }) => {
  const productionEnv = solution?.environments?.find((env: any) => env.env_type === 'production');
  const costs = productionEnv?.costs;
  
  // Calculer le coût total mensuel
  const totalMonthlyCost = costs
    ? (costs.hosting_monthly || 0) + (costs.licenses_monthly || 0)
    : 0;
  
  return (
    <div className="space-y-4">
      {costs && (
        <>
          <DataRow
            label={t('ddTech.sectionE.hostingMonthly')}
            value={costs.hosting_monthly ? `${costs.hosting_monthly.toLocaleString('fr-FR')} €` : ''}
          />
          <DataRow
            label={t('ddTech.sectionE.licensesMonthly')}
            value={costs.licenses_monthly ? `${costs.licenses_monthly.toLocaleString('fr-FR')} €` : ''}
          />
          <DataRow
            label={t('ddTech.sectionE.totalMonthlyCost')}
            value={totalMonthlyCost > 0 ? `${totalMonthlyCost.toLocaleString('fr-FR')} €` : ''}
            highlight
          />
          <DataRow
            label={t('ddTech.sectionE.opsHoursMonthly')}
            value={costs.ops_hours_monthly_equiv ? `${costs.ops_hours_monthly_equiv}h` : ''}
          />
          <DataRow label={t('ddTech.sectionE.hiddenCosts')} value={costs.hidden_costs} />
          <DataRow label={t('ddTech.sectionE.costEvolutionFactors')} value={costs.cost_evolution_factors} />
          <DataRow
            label={t('ddTech.sectionE.modernizationInvestmentNeeds')}
            value={costs.modernization_investment_needs}
          />
          <DataRow label={t('ddTech.sectionE.costComments')} value={costs.comments} />
        </>
      )}
      {solution?.scoringSnapshots && solution.scoringSnapshots.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('ddTech.sectionE.scoringHistory')}
          </label>
          <div className="space-y-2">
            {solution.scoringSnapshots.map((snapshot: any, idx: number) => (
              <div
                key={idx}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(snapshot.date).toLocaleDateString('fr-FR')}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    snapshot.global_score >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                    snapshot.global_score >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    {snapshot.global_score.toFixed(1)}/100
                  </span>
                </div>
                {snapshot.scores && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div>Sécurité: {snapshot.scores.Security}</div>
                    <div>Résilience: {snapshot.scores.Resilience}</div>
                    <div>Observabilité: {snapshot.scores.Observability}</div>
                    <div>Architecture: {snapshot.scores.Architecture}</div>
                    <div>Conformité: {snapshot.scores.Compliance}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Section F: Roadmap & Transformation
const SectionFContent: React.FC<{ solution: any; t: any }> = ({ solution, t }) => {
  const roadmapItems = solution?.roadmapItems || [];
  
  return (
    <div className="space-y-4">
      {roadmapItems.length > 0 ? (
        <div className="space-y-3">
          {roadmapItems.map((item: any, idx: number) => (
            <div
              key={idx}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.title}</h4>
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  item.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                  item.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                  'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300'
                }`}>
                  {item.status || 'Planned'}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>Type: {item.type}</div>
                {item.target_date && (
                  <div>Date cible: {new Date(item.target_date).toLocaleDateString('fr-FR')}</div>
                )}
                {item.impact_estimate && <div>Impact estimé: {item.impact_estimate}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 italic">{t('ddTech.sectionF.noRoadmapItems')}</p>
      )}
    </div>
  );
};

// Section G: Notes/Commentaires
const SectionGContent: React.FC<{ solution: any; t: any }> = ({ solution, t }) => {
  return (
    <div className="space-y-4">
      {solution?.codebase && (
        <>
          <DataRow label={t('ddTech.sectionG.repoLocation')} value={solution.codebase.repo_location} />
          <DataRow label={t('ddTech.sectionG.documentationLevel')} value={solution.codebase.documentation_level} />
          <DataRow label={t('ddTech.sectionG.codeReviewProcess')} value={solution.codebase.code_review_process} />
          <DataRow label={t('ddTech.sectionG.versionControlTool')} value={solution.codebase.version_control_tool} />
          <DataRow label={t('ddTech.sectionG.technicalDebtKnown')} value={solution.codebase.technical_debt_known} />
          <DataRow label={t('ddTech.sectionG.legacySystems')} value={solution.codebase.legacy_systems} />
          {solution.codebase.third_party_dependencies && solution.codebase.third_party_dependencies.length > 0 && (
            <DataRow
              label={t('ddTech.sectionG.thirdPartyDependencies')}
              value={solution.codebase.third_party_dependencies.join(', ')}
            />
          )}
        </>
      )}
      {solution?.developmentMetrics && (
        <>
          <DataRow label={t('ddTech.sectionG.sdlcProcess')} value={solution.developmentMetrics.sdlc_process} />
          <DataRow
            label={t('ddTech.sectionG.devopsAutomationLevel')}
            value={solution.developmentMetrics.devops_automation_level}
          />
        </>
      )}
      {solution?.aiFeatures && solution.aiFeatures.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('ddTech.sectionG.aiFeatures')}
          </label>
          <div className="space-y-2">
            {solution.aiFeatures.map((ai: any, idx: number) => (
              <div
                key={idx}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
              >
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  <strong>{ai.technical_type}</strong>
                </div>
                {ai.quality_validation_method && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Validation: {ai.quality_validation_method}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant pour afficher une ligne de données
const DataRow: React.FC<{
  label: string;
  value: any;
  highlight?: boolean;
}> = ({ label, value, highlight = false }) => {
  if (!value && value !== 0) return null;
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${highlight ? 'bg-blue-50 dark:bg-blue-900/30 p-3 rounded' : ''}`}>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
      <div className={`col-span-2 text-sm ${highlight ? 'font-semibold' : ''} text-gray-900 dark:text-gray-100`}>
        {typeof value === 'string' || typeof value === 'number' ? value : value}
      </div>
    </div>
  );
};

export default DDTechView;

