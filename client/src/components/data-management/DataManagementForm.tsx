/**
 * Formulaire intelligent pour gérer les données d'un éditeur
 * Permet de créer/mettre à jour/supprimer solutions, environnements et données associées
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { useSession } from '../../session/SessionContext';
import {
  UPDATE_EDITOR,
  UPDATE_SOLUTION,
  UPDATE_ENVIRONMENT,
  CREATE_SOLUTION,
  CREATE_ENVIRONMENT,
  ARCHIVE_SOLUTION,
  ARCHIVE_ENVIRONMENT,
} from '../../graphql/mutations';

interface DataManagementFormProps {
  editor: any;
  editorId: string;
  onDataUpdated: () => void;
}

const DataManagementForm: React.FC<DataManagementFormProps> = ({
  editor,
  editorId,
  onDataUpdated,
}) => {
  const { t } = useTranslation();
  const { user } = useSession();
  const [activeSection, setActiveSection] = useState<'editor' | 'solutions' | 'environments'>('editor');
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState<boolean>(true);
  const [isCreatingSolution, setIsCreatingSolution] = useState<boolean>(false);
  const [isCreatingEnvironment, setIsCreatingEnvironment] = useState<boolean>(false);

  const isAdminOrSupervisor = user?.role === 'Admin' || user?.role === 'Supervisor';

  const [updateEditor, { loading: updatingEditor }] = useMutation(UPDATE_EDITOR);
  const [updateSolution, { loading: updatingSolution }] = useMutation(UPDATE_SOLUTION);
  const [updateEnvironment, { loading: updatingEnvironment }] = useMutation(UPDATE_ENVIRONMENT);
  const [createSolution, { loading: creatingSolution }] = useMutation(CREATE_SOLUTION);
  const [createEnvironment, { loading: creatingEnvironment }] = useMutation(CREATE_ENVIRONMENT);
  const [archiveSolution, { loading: archivingSolution }] = useMutation(ARCHIVE_SOLUTION);
  const [archiveEnvironment, { loading: archivingEnvironment }] = useMutation(ARCHIVE_ENVIRONMENT);

  // Formulaire éditeur
  const [editorForm, setEditorForm] = useState({
    name: editor?.name || '',
    country: editor?.country || '',
    size: editor?.size || '',
    business_criticality: editor?.business_criticality || 'Medium',
  });

  // Formulaire solution
  const [solutionForm, setSolutionForm] = useState({
    name: '',
    description: '',
    main_use_case: '',
    type: 'SaaS',
    product_criticality: 'Medium',
  });

  // Formulaire environnement
  const [environmentForm, setEnvironmentForm] = useState({
    env_type: 'production',
    deployment_type: '',
    redundancy: 'none',
    tech_stack: [] as string[],
    data_types: [] as string[],
  });

  const handleUpdateEditor = async () => {
    try {
      await updateEditor({
        variables: {
          input: {
            editorId,
            ...editorForm,
          },
        },
      });
      alert(t('dataManagement.form.success'));
      onDataUpdated();
    } catch (error: any) {
      alert(t('dataManagement.form.error') + ': ' + error.message);
    }
  };

  const handleUpdateSolution = async () => {
    if (!selectedSolutionId) {
      alert(t('dataManagement.form.selectSolution'));
      return;
    }
    try {
      await updateSolution({
        variables: {
          input: {
            solutionId: selectedSolutionId,
            ...solutionForm,
          },
        },
      });
      alert(t('dataManagement.form.success'));
      onDataUpdated();
    } catch (error: any) {
      alert(t('dataManagement.form.error') + ': ' + error.message);
    }
  };

  const handleUpdateEnvironment = async () => {
    if (!selectedEnvId || !selectedSolutionId) {
      alert(t('dataManagement.form.selectEnvironment'));
      return;
    }
    try {
      await updateEnvironment({
        variables: {
          input: {
            envId: selectedEnvId,
            solutionId: selectedSolutionId,
            ...environmentForm,
          },
        },
      });
      alert(t('dataManagement.form.success'));
      onDataUpdated();
    } catch (error: any) {
      alert(t('dataManagement.form.error') + ': ' + error.message);
    }
  };

  const handleCreateSolution = async () => {
    if (!solutionForm.name || !solutionForm.main_use_case) {
      alert('Veuillez remplir au moins le nom et le cas d\'usage principal');
      return;
    }
    try {
      await createSolution({
        variables: {
          input: {
            editorId,
            ...solutionForm,
            ip_ownership_clear: false,
          },
        },
      });
      alert(t('dataManagement.form.success'));
      setIsCreatingSolution(false);
      setSolutionForm({
        name: '',
        description: '',
        main_use_case: '',
        type: 'SaaS',
        product_criticality: 'Medium',
      });
      onDataUpdated();
    } catch (error: any) {
      alert(t('dataManagement.form.error') + ': ' + error.message);
    }
  };

  const handleCreateEnvironment = async () => {
    if (!selectedSolutionId) {
      alert(t('dataManagement.form.selectSolution'));
      return;
    }
    if (!environmentForm.env_type || !environmentForm.redundancy) {
      alert('Veuillez remplir au moins le type d\'environnement et la redondance');
      return;
    }
    try {
      // Créer un hostingId temporaire (sera géré plus tard)
      const tempHostingId = `hosting-temp-${Date.now()}`;
      
      await createEnvironment({
        variables: {
          input: {
            solutionId: selectedSolutionId,
            hostingId: tempHostingId,
            ...environmentForm,
            backup: {
              exists: false,
              rto_hours: 24,
              rpo_hours: 4,
              restoration_test_frequency: 'never',
            },
          },
        },
      });
      alert(t('dataManagement.form.success'));
      setIsCreatingEnvironment(false);
      setEnvironmentForm({
        env_type: 'production',
        deployment_type: '',
        redundancy: 'none',
        tech_stack: [],
        data_types: [],
      });
      onDataUpdated();
    } catch (error: any) {
      alert(t('dataManagement.form.error') + ': ' + error.message);
    }
  };

  const handleArchiveSolution = async (solutionId: string, archived: boolean) => {
    try {
      await archiveSolution({
        variables: {
          input: {
            id: solutionId,
            archived: !archived,
          },
        },
      });
      alert(t('dataManagement.form.success'));
      onDataUpdated();
    } catch (error: any) {
      alert(t('dataManagement.form.error') + ': ' + error.message);
    }
  };

  const handleArchiveEnvironment = async (envId: string, archived: boolean) => {
    try {
      await archiveEnvironment({
        variables: {
          input: {
            id: envId,
            archived: !archived,
          },
        },
      });
      alert(t('dataManagement.form.success'));
      onDataUpdated();
    } catch (error: any) {
      alert(t('dataManagement.form.error') + ': ' + error.message);
    }
  };

  const solutions = editor?.solutions || [];
  const filteredSolutions = showArchived 
    ? solutions 
    : solutions.filter((s: any) => !s.archived);

  return (
    <div className="space-y-6">
      {/* Navigation par sections */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveSection('editor')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeSection === 'editor'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            📝 {t('dataManagement.form.editor')}
          </button>
          <button
            onClick={() => setActiveSection('solutions')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeSection === 'solutions'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            📦 {t('dataManagement.form.solutions')}
          </button>
          <button
            onClick={() => setActiveSection('environments')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeSection === 'environments'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            🌐 {t('dataManagement.form.environments')}
          </button>
        </div>
      </div>

      {/* Section Éditeur */}
      {activeSection === 'editor' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('dataManagement.form.editEditor')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('dataManagement.form.name')} *
              </label>
              <input
                type="text"
                value={editorForm.name}
                onChange={(e) => setEditorForm({ ...editorForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('dataManagement.form.country')}
              </label>
              <input
                type="text"
                value={editorForm.country}
                onChange={(e) => setEditorForm({ ...editorForm, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('dataManagement.form.size')}
              </label>
              <select
                value={editorForm.size}
                onChange={(e) => setEditorForm({ ...editorForm, size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">{t('dataManagement.form.selectSize')}</option>
                <option value="Micro">Micro</option>
                <option value="SME">SME</option>
                <option value="Mid">Mid</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('dataManagement.form.businessCriticality')} *
              </label>
              <select
                value={editorForm.business_criticality}
                onChange={(e) => setEditorForm({ ...editorForm, business_criticality: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={handleUpdateEditor}
              disabled={updatingEditor || !editorForm.name}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatingEditor ? t('dataManagement.form.saving') : t('dataManagement.form.save')}
            </button>
          </div>
        </div>
      )}

      {/* Section Solutions */}
      {activeSection === 'solutions' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('dataManagement.form.manageSolutions')}
            </h3>
            <div className="flex gap-2">
              {isAdminOrSupervisor && (
                <button
                  onClick={() => setIsCreatingSolution(!isCreatingSolution)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-md hover:bg-green-700 dark:hover:bg-green-600"
                >
                  {isCreatingSolution ? '✕' : '+'} {t('dataManagement.form.createNew')} {t('dataManagement.form.solutions')}
                </button>
              )}
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {showArchived ? t('dataManagement.form.hideArchived') : t('dataManagement.form.showArchived')}
              </button>
            </div>
          </div>
          
          {/* Formulaire de création */}
          {isCreatingSolution && isAdminOrSupervisor && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('dataManagement.form.createNew')} {t('dataManagement.form.solutions')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('dataManagement.form.name')} *
                  </label>
                  <input
                    type="text"
                    value={solutionForm.name}
                    onChange={(e) => setSolutionForm({ ...solutionForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('dataManagement.form.mainUseCase')} *
                  </label>
                  <input
                    type="text"
                    value={solutionForm.main_use_case}
                    onChange={(e) => setSolutionForm({ ...solutionForm, main_use_case: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('dataManagement.form.type')}
                  </label>
                  <select
                    value={solutionForm.type}
                    onChange={(e) => setSolutionForm({ ...solutionForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="SaaS">SaaS</option>
                    <option value="OnPrem">OnPrem</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="ClientHeavy">ClientHeavy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('dataManagement.form.productCriticality')}
                  </label>
                  <select
                    value={solutionForm.product_criticality}
                    onChange={(e) => setSolutionForm({ ...solutionForm, product_criticality: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('dataManagement.form.description')}
                  </label>
                  <textarea
                    value={solutionForm.description}
                    onChange={(e) => setSolutionForm({ ...solutionForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setIsCreatingSolution(false);
                    setSolutionForm({
                      name: '',
                      description: '',
                      main_use_case: '',
                      type: 'SaaS',
                      product_criticality: 'Medium',
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateSolution}
                  disabled={creatingSolution || !solutionForm.name || !solutionForm.main_use_case}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingSolution ? t('dataManagement.form.creating') : t('dataManagement.form.create')}
                </button>
              </div>
            </div>
          )}
          
          {/* Sélection de solution */}
          {filteredSolutions.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('dataManagement.form.selectSolution')}
              </label>
              <select
                value={selectedSolutionId || ''}
                onChange={(e) => {
                  setSelectedSolutionId(e.target.value);
                  const solution = solutions.find((s: any) => s.solutionId === e.target.value);
                  if (solution) {
                    setSolutionForm({
                      name: solution.name || '',
                      description: solution.description || '',
                      main_use_case: solution.main_use_case || '',
                      type: solution.type || '',
                      product_criticality: solution.product_criticality || 'Medium',
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">{t('dataManagement.form.selectSolutionPlaceholder')}</option>
                {filteredSolutions.map((solution: any) => (
                  <option key={solution.solutionId} value={solution.solutionId}>
                    {solution.name} {solution.archived ? `(${t('dataManagement.form.archived')})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Liste des solutions avec actions d'archivage */}
          {filteredSolutions.length > 0 && (
            <div className="mt-4 space-y-2">
              {filteredSolutions.map((solution: any) => (
                <div
                  key={solution.solutionId}
                  className={`flex items-center justify-between p-3 border rounded-md ${
                    solution.archived
                      ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 opacity-75'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {solution.name}
                      </span>
                      {solution.archived && (
                        <span className="px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded">
                          {t('dataManagement.form.archived')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {solution.type} - {solution.product_criticality}
                    </div>
                  </div>
                  {isAdminOrSupervisor && (
                    <button
                      onClick={() => handleArchiveSolution(solution.solutionId, solution.archived)}
                      disabled={archivingSolution}
                      className={`ml-4 px-3 py-1.5 text-sm font-medium rounded-md ${
                        solution.archived
                          ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {archivingSolution
                        ? t('dataManagement.form.archiving')
                        : solution.archived
                        ? t('dataManagement.form.unarchive')
                        : t('dataManagement.form.archive')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Formulaire solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('dataManagement.form.name')} *
              </label>
              <input
                type="text"
                value={solutionForm.name}
                onChange={(e) => setSolutionForm({ ...solutionForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('dataManagement.form.type')}
              </label>
              <input
                type="text"
                value={solutionForm.type}
                onChange={(e) => setSolutionForm({ ...solutionForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="SaaS, OnPrem, Hybrid, ClientHeavy"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('dataManagement.form.description')}
              </label>
              <textarea
                value={solutionForm.description}
                onChange={(e) => setSolutionForm({ ...solutionForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={handleUpdateSolution}
              disabled={updatingSolution || !selectedSolutionId || !solutionForm.name}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatingSolution ? t('dataManagement.form.saving') : t('dataManagement.form.save')}
            </button>
          </div>
        </div>
      )}

      {/* Section Environnements */}
      {activeSection === 'environments' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('dataManagement.form.manageEnvironments')}
            </h3>
            <div className="flex gap-2">
              {isAdminOrSupervisor && selectedSolutionId && (
                <button
                  onClick={() => setIsCreatingEnvironment(!isCreatingEnvironment)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-md hover:bg-green-700 dark:hover:bg-green-600"
                >
                  {isCreatingEnvironment ? '✕' : '+'} {t('dataManagement.form.createNew')} {t('dataManagement.form.environments')}
                </button>
              )}
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {showArchived ? t('dataManagement.form.hideArchived') : t('dataManagement.form.showArchived')}
              </button>
            </div>
          </div>
          
          {/* Formulaire de création */}
          {isCreatingEnvironment && isAdminOrSupervisor && selectedSolutionId && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('dataManagement.form.createNew')} {t('dataManagement.form.environments')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('dataManagement.form.envType')} *
                  </label>
                  <select
                    value={environmentForm.env_type}
                    onChange={(e) => setEnvironmentForm({ ...environmentForm, env_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                    required
                  >
                    <option value="production">Production</option>
                    <option value="test">Test</option>
                    <option value="dev">Dev</option>
                    <option value="backup">Backup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('dataManagement.form.redundancy')} *
                  </label>
                  <select
                    value={environmentForm.redundancy}
                    onChange={(e) => setEnvironmentForm({ ...environmentForm, redundancy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                    required
                  >
                    <option value="none">None</option>
                    <option value="minimal">Minimal</option>
                    <option value="geo-redundant">Geo-redundant</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('dataManagement.form.deploymentType')}
                  </label>
                  <select
                    value={environmentForm.deployment_type}
                    onChange={(e) => setEnvironmentForm({ ...environmentForm, deployment_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">-</option>
                    <option value="monolith">Monolith</option>
                    <option value="microservices">Microservices</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setIsCreatingEnvironment(false);
                    setEnvironmentForm({
                      env_type: 'production',
                      deployment_type: '',
                      redundancy: 'none',
                      tech_stack: [],
                      data_types: [],
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateEnvironment}
                  disabled={creatingEnvironment || !environmentForm.env_type || !environmentForm.redundancy}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingEnvironment ? t('dataManagement.form.creating') : t('dataManagement.form.create')}
                </button>
              </div>
            </div>
          )}
          
          {/* Sélection de solution et environnement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('dataManagement.form.selectSolution')} *
              </label>
              <select
                value={selectedSolutionId || ''}
                onChange={(e) => {
                  setSelectedSolutionId(e.target.value);
                  setSelectedEnvId(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">{t('dataManagement.form.selectSolutionPlaceholder')}</option>
                {solutions.map((solution: any) => (
                  <option key={solution.solutionId} value={solution.solutionId}>
                    {solution.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedSolutionId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('dataManagement.form.selectEnvironment')}
                </label>
                <select
                  value={selectedEnvId || ''}
                  onChange={(e) => {
                    const envId = e.target.value;
                    setSelectedEnvId(envId);
                    const solution = solutions.find((s: any) => s.solutionId === selectedSolutionId);
                    const env = solution?.environments?.find((envItem: any) => envItem.envId === envId);
                    if (env) {
                      setEnvironmentForm({
                        env_type: env.env_type || 'production',
                        deployment_type: env.deployment_type || '',
                        redundancy: env.redundancy || 'none',
                        tech_stack: env.tech_stack || [],
                        data_types: env.data_types || [],
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">{t('dataManagement.form.selectEnvironmentPlaceholder')}</option>
                  {(showArchived
                    ? solutions.find((s: any) => s.solutionId === selectedSolutionId)?.environments || []
                    : solutions.find((s: any) => s.solutionId === selectedSolutionId)?.environments?.filter((e: any) => !e.archived) || []
                  ).map((env: any) => (
                    <option key={env.envId} value={env.envId}>
                      {env.env_type} - {env.envId} {env.archived ? `(${t('dataManagement.form.archived')})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Liste des environnements avec actions d'archivage */}
          {selectedSolutionId && (
            <div className="mt-4 space-y-2">
              {(showArchived
                ? solutions.find((s: any) => s.solutionId === selectedSolutionId)?.environments || []
                : solutions.find((s: any) => s.solutionId === selectedSolutionId)?.environments?.filter((e: any) => !e.archived) || []
              ).map((env: any) => (
                <div
                  key={env.envId}
                  className={`flex items-center justify-between p-3 border rounded-md ${
                    env.archived
                      ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 opacity-75'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {env.env_type} - {env.envId}
                      </span>
                      {env.archived && (
                        <span className="px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded">
                          {t('dataManagement.form.archived')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {env.deployment_type || '-'} - {env.redundancy}
                    </div>
                  </div>
                  {isAdminOrSupervisor && (
                    <button
                      onClick={() => handleArchiveEnvironment(env.envId, env.archived)}
                      disabled={archivingEnvironment}
                      className={`ml-4 px-3 py-1.5 text-sm font-medium rounded-md ${
                        env.archived
                          ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {archivingEnvironment
                        ? t('dataManagement.form.archiving')
                        : env.archived
                        ? t('dataManagement.form.unarchive')
                        : t('dataManagement.form.archive')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Formulaire environnement */}
          {selectedSolutionId && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('dataManagement.form.envType')} *
                  </label>
                  <select
                    value={environmentForm.env_type}
                    onChange={(e) => setEnvironmentForm({ ...environmentForm, env_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    required
                  >
                    <option value="production">Production</option>
                    <option value="test">Test</option>
                    <option value="dev">Dev</option>
                    <option value="backup">Backup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('dataManagement.form.redundancy')} *
                  </label>
                  <select
                    value={environmentForm.redundancy}
                    onChange={(e) => setEnvironmentForm({ ...environmentForm, redundancy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    required
                  >
                    <option value="none">None</option>
                    <option value="minimal">Minimal</option>
                    <option value="geo-redundant">Geo-redundant</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('dataManagement.form.deploymentType')}
                  </label>
                  <input
                    type="text"
                    value={environmentForm.deployment_type}
                    onChange={(e) => setEnvironmentForm({ ...environmentForm, deployment_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="monolith, microservices, hybrid"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleUpdateEnvironment}
                  disabled={updatingEnvironment || !selectedEnvId || !selectedSolutionId}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingEnvironment ? t('dataManagement.form.saving') : t('dataManagement.form.save')}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Message si aucune solution */}
      {activeSection === 'environments' && solutions.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {t('dataManagement.form.noSolutions')}
          </p>
        </div>
      )}
    </div>
  );
};

export default DataManagementForm;

