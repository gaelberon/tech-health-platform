import React, { useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';

const LIST_EDITORS = gql`
  query ListEditors {
    listEditors {
      editorId
      name
      country
      size
      business_criticality
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_EDITOR = gql`
  mutation UpdateEditor($input: UpdateEditorInput!) {
    updateEditor(input: $input) {
      editorId
      name
      country
      size
      business_criticality
    }
  }
`;

interface Editor {
  editorId: string;
  name: string;
  country?: string;
  size?: string;
  business_criticality: string;
  createdAt?: string;
  updatedAt?: string;
}

const AdminDataManagement: React.FC = () => {
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [editingEditor, setEditingEditor] = useState<Editor | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data, loading, refetch } = useQuery(LIST_EDITORS);
  const [updateEditor, { loading: updating }] = useMutation(UPDATE_EDITOR);

  const editors: Editor[] = data?.listEditors || [];

  // Filtrage par recherche
  const filteredEditors = editors.filter((editor) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      editor.name.toLowerCase().includes(query) ||
      editor.editorId.toLowerCase().includes(query) ||
      editor.country?.toLowerCase().includes(query) ||
      editor.business_criticality.toLowerCase().includes(query)
    );
  });

  // Formulaire de création/édition
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    size: '',
    business_criticality: 'Medium',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      country: '',
      size: '',
      business_criticality: 'Medium',
    });
    setShowCreateForm(false);
    setEditingEditor(null);
  };

  const handleCreate = async () => {
    try {
      // Pour créer un éditeur, on utilise updateEditor sans editorId
      await updateEditor({
        variables: {
          input: {
            name: formData.name,
            country: formData.country || null,
            size: formData.size || null,
            business_criticality: formData.business_criticality,
          },
        },
      });
      await refetch();
      resetForm();
      alert('Éditeur créé avec succès');
    } catch (error: any) {
      alert(`Erreur lors de la création : ${error.message}`);
    }
  };

  const handleUpdate = async () => {
    if (!editingEditor) return;

    try {
      await updateEditor({
        variables: {
          input: {
            editorId: editingEditor.editorId,
            name: formData.name,
            country: formData.country || null,
            size: formData.size || null,
            business_criticality: formData.business_criticality,
          },
        },
      });
      await refetch();
      resetForm();
      alert('Éditeur mis à jour avec succès');
    } catch (error: any) {
      alert(`Erreur lors de la mise à jour : ${error.message}`);
    }
  };

  const startEdit = (editor: Editor) => {
    setEditingEditor(editor);
    setFormData({
      name: editor.name,
      country: editor.country || '',
      size: editor.size || '',
      business_criticality: editor.business_criticality,
    });
    setShowCreateForm(true);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Chargement des éditeurs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestion des Éditeurs</h3>
          <p className="text-sm text-gray-600 mt-1">
            {filteredEditors.length} éditeur{filteredEditors.length !== 1 ? 's' : ''} enregistré{filteredEditors.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateForm(true);
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          + Nouvel éditeur
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom, ID, pays ou criticité..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Formulaire de création/édition */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {editingEditor ? 'Modifier un éditeur' : 'Créer un nouvel éditeur'}
            </h4>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'éditeur *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Criticité Métier *
              </label>
              <select
                value={formData.business_criticality}
                onChange={(e) => setFormData({ ...formData, business_criticality: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pays
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: France"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taille
              </label>
              <select
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                <option value="Micro">Micro</option>
                <option value="SME">SME</option>
                <option value="Mid">Mid</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              onClick={editingEditor ? handleUpdate : handleCreate}
              disabled={updating || !formData.name || !formData.business_criticality}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Enregistrement...' : editingEditor ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des éditeurs */}
      {filteredEditors.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pays
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taille
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criticité
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEditors.map((editor) => (
                <tr key={editor.editorId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {editor.editorId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editor.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {editor.country || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {editor.size || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        editor.business_criticality === 'Critical'
                          ? 'bg-red-100 text-red-800'
                          : editor.business_criticality === 'High'
                          ? 'bg-orange-100 text-orange-800'
                          : editor.business_criticality === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {editor.business_criticality}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => startEdit(editor)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            {searchQuery ? 'Aucun éditeur ne correspond à votre recherche.' : 'Aucun éditeur trouvé.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminDataManagement;

