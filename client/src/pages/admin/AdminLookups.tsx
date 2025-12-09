import React, { useState, useMemo } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';

const LIST_ALL_LOOKUPS = gql`
  query ListAllLookups($category: String) {
    listAllLookups(category: $category) {
      id
      key
      category
      entity
      formLabel
      description
      values {
        code
        label
        label_fr
        label_en
        description
        order
        active
      }
    }
  }
`;

const UPDATE_LOOKUP = gql`
  mutation UpdateLookup($input: UpdateLookupInput!) {
    updateLookup(input: $input) {
      id
      key
      category
      entity
      formLabel
      description
      values {
        code
        label
        description
        order
        active
      }
    }
  }
`;

interface LookupValue {
  code: string;
  label: string;
  label_fr?: string;
  label_en?: string;
  description?: string;
  order?: number;
  active?: boolean;
}

interface Lookup {
  id: string;
  key: string;
  category?: string;
  entity?: string;
  formLabel?: string;
  description?: string;
  values: LookupValue[];
}

const AdminLookups: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingLookup, setEditingLookup] = useState<Lookup | null>(null);
  const [newValue, setNewValue] = useState<Partial<LookupValue>>({
    code: '',
    label: '',
    description: '',
    order: 0,
    active: true,
  });

  const { data, loading, refetch } = useQuery(LIST_ALL_LOOKUPS, {
    variables: { category: null }, // Charger tous les lookups
  });

  const [updateLookup, { loading: saving }] = useMutation(UPDATE_LOOKUP);

  const allLookups: Lookup[] = data?.listAllLookups || [];

  // Extraction des entités et catégories uniques
  const entities = useMemo(() => {
    const uniqueEntities = Array.from(new Set(allLookups.map((l) => l.entity).filter(Boolean)));
    return uniqueEntities.sort();
  }, [allLookups]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(allLookups.map((l) => l.category).filter(Boolean)));
    return uniqueCategories.sort();
  }, [allLookups]);

  // Filtrage des lookups
  const filteredLookups = useMemo(() => {
    return allLookups.filter((lookup) => {
      // Filtre par entité
      if (selectedEntity !== 'all' && lookup.entity !== selectedEntity) {
        return false;
      }

      // Filtre par catégorie (criticité)
      if (selectedCategory !== 'all' && lookup.category !== selectedCategory) {
        return false;
      }

      // Filtre par recherche
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesKey = lookup.key.toLowerCase().includes(query);
        const matchesFormLabel = lookup.formLabel?.toLowerCase().includes(query);
        const matchesDescription = lookup.description?.toLowerCase().includes(query);
        const matchesValues = lookup.values.some(
          (v) =>
            v.code.toLowerCase().includes(query) ||
            v.label.toLowerCase().includes(query) ||
            v.description?.toLowerCase().includes(query)
        );

        if (!matchesKey && !matchesFormLabel && !matchesDescription && !matchesValues) {
          return false;
        }
      }

      return true;
    });
  }, [allLookups, selectedEntity, selectedCategory, searchQuery]);

  // Organisation des lookups par entité et catégorie
  const organizedLookups = useMemo(() => {
    const organized: Record<string, Record<string, Lookup[]>> = {};

    filteredLookups.forEach((lookup) => {
      const entity = lookup.entity || 'Autres';
      const category = lookup.category || 'Non classé';

      if (!organized[entity]) {
        organized[entity] = {};
      }
      if (!organized[entity][category]) {
        organized[entity][category] = [];
      }

      organized[entity][category].push(lookup);
    });

    return organized;
  }, [filteredLookups]);

  const handleSaveLookup = async () => {
    if (!editingLookup) return;

    const sortedValues = [...editingLookup.values].sort((a, b) => (a.order || 0) - (b.order || 0));

    // Nettoyer les valeurs pour supprimer __typename et ne garder que les champs valides
    const cleanedValues = sortedValues.map((value) => {
      const cleaned: any = {
        code: value.code,
        label: value.label,
      };
      
      // Ajouter les champs optionnels seulement s'ils existent
      if (value.label_fr) cleaned.label_fr = value.label_fr;
      if (value.label_en) cleaned.label_en = value.label_en;
      if (value.description) cleaned.description = value.description;
      if (value.order !== undefined) cleaned.order = value.order;
      if (value.active !== undefined) cleaned.active = value.active;
      
      return cleaned;
    });

    await updateLookup({
      variables: {
        input: {
          key: editingLookup.key,
          values: cleanedValues,
          category: editingLookup.category || null,
          entity: editingLookup.entity || null,
          formLabel: editingLookup.formLabel || null,
          description: editingLookup.description || null,
        },
      },
    });

    await refetch();
    setEditingLookup(null);
  };

  const handleAddValue = () => {
    if (!editingLookup || !newValue.code || !newValue.label) return;

    const updatedLookup = {
      ...editingLookup,
      values: [
        ...editingLookup.values,
        {
          code: newValue.code,
          label: newValue.label,
          label_fr: newValue.label_fr,
          label_en: newValue.label_en,
          description: newValue.description,
          order: newValue.order || editingLookup.values.length + 1,
          active: newValue.active !== false,
        },
      ],
    };

    setEditingLookup(updatedLookup);
    setNewValue({ code: '', label: '', description: '', order: 0, active: true });
  };

  const handleRemoveValue = (code: string) => {
    if (!editingLookup) return;

    const updatedLookup = {
      ...editingLookup,
      values: editingLookup.values.filter((v) => v.code !== code),
    };

    setEditingLookup(updatedLookup);
  };

  const handleToggleValueActive = (code: string) => {
    if (!editingLookup) return;

    const updatedLookup = {
      ...editingLookup,
      values: editingLookup.values.map((v) =>
        v.code === code ? { ...v, active: !v.active } : v
      ),
    };

    setEditingLookup(updatedLookup);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement des lookups...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche et filtres */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
        {/* Moteur de recherche */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🔍 Rechercher une liste de valeurs
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom (ex: 'Mode Logiciel (Type)'), clé technique, ou valeur..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {filteredLookups.length} résultat{filteredLookups.length !== 1 ? 's' : ''} trouvé{filteredLookups.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Filtres par entité et criticité */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtre par entité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entité
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">Toutes les entités</option>
              {entities.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par criticité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Criticité
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">Toutes les criticités</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vue organisée par entité et criticité */}
      {Object.keys(organizedLookups).length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <p className="text-yellow-800 dark:text-yellow-300">
            Aucune liste de valeurs ne correspond aux critères de recherche.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(organizedLookups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([entity, categoriesMap]) => (
              <div key={entity} className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 border-b-2 border-blue-500 dark:border-blue-400 pb-2">
                  📦 {entity}
                </h3>

                {Object.entries(categoriesMap)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([category, lookups]) => (
                    <div key={category} className="ml-4 space-y-4">
                      <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-bold rounded ${
                            category === 'P1'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                              : category === 'P2'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                              : category === 'P3'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {category}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({lookups.length} liste{lookups.length !== 1 ? 's' : ''})
                        </span>
                      </h4>

                      <div className="ml-4 space-y-4">
                        {lookups.map((lookup) => (
                          <div
                            key={lookup.id}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h5 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {lookup.formLabel || lookup.key}
                                  </h5>
                                  <code className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                    {lookup.key}
                                  </code>
                                </div>
                                {lookup.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{lookup.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  setEditingLookup(editingLookup?.id === lookup.id ? null : lookup)
                                }
                                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 whitespace-nowrap"
                              >
                                {editingLookup?.id === lookup.id ? 'Annuler' : 'Modifier'}
                              </button>
                            </div>

                            {editingLookup?.id === lookup.id ? (
                              <div className="space-y-4">
                                {/* Métadonnées du lookup */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                                  <h6 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                    Métadonnées
                                  </h6>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nom dans le formulaire
                                      </label>
                                      <input
                                        type="text"
                                        value={editingLookup.formLabel || ''}
                                        onChange={(e) =>
                                          setEditingLookup({
                                            ...editingLookup,
                                            formLabel: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                        placeholder="ex: Mode Logiciel (Type)"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Entité
                                      </label>
                                      <select
                                        value={editingLookup.entity || ''}
                                        onChange={(e) =>
                                          setEditingLookup({
                                            ...editingLookup,
                                            entity: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                      >
                                        <option value="">Sélectionner...</option>
                                        {entities.map((e) => (
                                          <option key={e} value={e}>
                                            {e}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Criticité
                                      </label>
                                      <select
                                        value={editingLookup.category || ''}
                                        onChange={(e) =>
                                          setEditingLookup({
                                            ...editingLookup,
                                            category: e.target.value,
                                          })
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                      >
                                        <option value="">Sélectionner...</option>
                                        {categories.map((c) => (
                                          <option key={c} value={c}>
                                            {c}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>

                                {/* Liste des valeurs existantes */}
                                <div className="space-y-2">
                                  <h6 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    Valeurs ({editingLookup.values.length})
                                  </h6>
                                  {editingLookup.values.map((value) => (
                                    <div
                                      key={value.code}
                                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                                    >
                                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <div>
                                          <span className="text-xs text-gray-500 dark:text-gray-400">Code</span>
                                          <div className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                            {value.code}
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-xs text-gray-500 dark:text-gray-400">Label</span>
                                          <div className="text-sm text-gray-900 dark:text-gray-100">{value.label}</div>
                                        </div>
                                        <div>
                                          <span className="text-xs text-gray-500 dark:text-gray-400">Description</span>
                                          <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {value.description || '-'}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleToggleValueActive(value.code)}
                                          className={`px-3 py-1 text-xs font-medium rounded ${
                                            value.active
                                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                              : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                                          }`}
                                        >
                                          {value.active ? 'Actif' : 'Inactif'}
                                        </button>
                                        <button
                                          onClick={() => handleRemoveValue(value.code)}
                                          className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                                        >
                                          Supprimer
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Formulaire d'ajout de valeur */}
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                  <h6 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                    Ajouter une valeur
                                  </h6>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Code *
                                      </label>
                                      <input
                                        type="text"
                                        value={newValue.code}
                                        onChange={(e) =>
                                          setNewValue({ ...newValue, code: e.target.value })
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                        placeholder="ex: VeryHigh"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Label *
                                      </label>
                                      <input
                                        type="text"
                                        value={newValue.label}
                                        onChange={(e) =>
                                          setNewValue({ ...newValue, label: e.target.value })
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                        placeholder="ex: Très Élevée"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                      </label>
                                      <input
                                        type="text"
                                        value={newValue.description || ''}
                                        onChange={(e) =>
                                          setNewValue({ ...newValue, description: e.target.value })
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                        placeholder="Texte pour l'infobulle"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Ordre
                                      </label>
                                      <input
                                        type="number"
                                        value={newValue.order || 0}
                                        onChange={(e) =>
                                          setNewValue({
                                            ...newValue,
                                            order: parseInt(e.target.value) || 0,
                                          })
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                                      />
                                    </div>
                                  </div>
                                  <button
                                    onClick={handleAddValue}
                                    disabled={!newValue.code || !newValue.label}
                                    className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Ajouter
                                  </button>
                                </div>

                                <button
                                  onClick={handleSaveLookup}
                                  disabled={saving}
                                  className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50"
                                >
                                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {lookup.values
                                  .filter((v) => v.active !== false)
                                  .map((value) => (
                                    <div
                                      key={value.code}
                                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                                    >
                                      <div>
                                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {value.code}
                                        </span>
                                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                                          {value.label}
                                        </span>
                                        {value.description && (
                                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {value.description}
                                          </p>
                                        )}
                                      </div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Ordre: {value.order || 0}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default AdminLookups;
