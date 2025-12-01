import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';

const LIST_AUDIT_LOGS = gql`
  query ListAuditLogs(
    $entityType: String
    $entityId: ID
    $userId: ID
    $action: String
    $startDate: String
    $endDate: String
    $limit: Int
  ) {
    listAuditLogs(
      entityType: $entityType
      entityId: $entityId
      userId: $userId
      action: $action
      startDate: $startDate
      endDate: $endDate
      limit: $limit
    ) {
      id
      userId
      userEmail
      userRole
      action
      entityType
      entityId
      changes {
        field
        oldValue
        newValue
      }
      before
      after
      ipAddress
      userAgent
      description
      timestamp
      createdAt
    }
  }
`;

const GET_AUDIT_LOGS_FOR_ENTITY = gql`
  query GetAuditLogsForEntity($entityType: String!, $entityId: ID!) {
    getAuditLogsForEntity(entityType: $entityType, entityId: $entityId) {
      id
      userId
      userEmail
      userRole
      action
      entityType
      entityId
      changes {
        field
        oldValue
        newValue
      }
      before
      after
      ipAddress
      userAgent
      description
      timestamp
      createdAt
    }
  }
`;

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE' | 'LOGIN' | 'LOGOUT';
type EntityType =
  | 'User'
  | 'Lookup'
  | 'Permission'
  | 'PageAccessPermission'
  | 'Editor'
  | 'Solution'
  | 'Environment'
  | 'Hosting'
  | 'SecurityProfile'
  | 'MonitoringObservability'
  | 'EntityCost'
  | 'ScoringSnapshot'
  | 'Document'
  | 'RoadmapItem'
  | 'CodeBase'
  | 'DevelopmentMetrics'
  | 'DevelopmentTeam'
  | 'AIFeatures';

const ACTIONS: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'RESTORE', 'LOGIN', 'LOGOUT'];
const ENTITY_TYPES: EntityType[] = [
  'User',
  'Lookup',
  'Permission',
  'PageAccessPermission',
  'Editor',
  'Solution',
  'Environment',
  'Hosting',
  'SecurityProfile',
  'MonitoringObservability',
  'EntityCost',
  'ScoringSnapshot',
  'Document',
  'RoadmapItem',
  'CodeBase',
  'DevelopmentMetrics',
  'DevelopmentTeam',
  'AIFeatures',
];

const actionColors: Record<AuditAction, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  ARCHIVE: 'bg-orange-100 text-orange-800',
  RESTORE: 'bg-purple-100 text-purple-800',
  LOGIN: 'bg-indigo-100 text-indigo-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
};

const AdminAuditLogs: React.FC = () => {
  const [filters, setFilters] = useState({
    entityType: '',
    entityId: '',
    userId: '',
    action: '',
    startDate: '',
    endDate: '',
    limit: 100,
  });

  const { data, loading, error, refetch } = useQuery(LIST_AUDIT_LOGS, {
    variables: {
      entityType: filters.entityType || undefined,
      entityId: filters.entityId || undefined,
      userId: filters.userId || undefined,
      action: filters.action || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      limit: filters.limit,
    },
    fetchPolicy: 'cache-and-network',
  });

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    refetch();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'medium',
      });
    } catch {
      return dateString;
    }
  };

  const formatJSON = (jsonString: string | null) => {
    if (!jsonString) return null;
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chargement des logs d'audit...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-semibold">Erreur</p>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const logs = data?.listAuditLogs || [];

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres de recherche</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="entityType" className="block text-sm font-medium text-gray-700 mb-1">
              Type d'entité
            </label>
            <select
              id="entityType"
              value={filters.entityType}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous</option>
              {ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="entityId" className="block text-sm font-medium text-gray-700 mb-1">
              ID de l'entité
            </label>
            <input
              id="entityId"
              type="text"
              value={filters.entityId}
              onChange={(e) => handleFilterChange('entityId', e.target.value)}
              placeholder="Ex: user-0001"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
              ID Utilisateur
            </label>
            <input
              id="userId"
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="Ex: user-0001"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              id="action"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes</option>
              {ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              id="startDate"
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              id="endDate"
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de résultats
            </label>
            <input
              id="limit"
              type="number"
              min="1"
              max="1000"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value) || 100)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Appliquer les filtres
          </button>
        </div>
      </div>

      {/* Résultats */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Logs d'audit ({logs.length} résultat{logs.length !== 1 ? 's' : ''})
          </h3>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Aucun log d'audit trouvé avec les filtres sélectionnés.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Changements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.userEmail || log.userId}</div>
                      <div className="text-xs text-gray-500">{log.userRole}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${actionColors[log.action as AuditAction] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.entityType}</div>
                      <div className="text-xs text-gray-500">{log.entityId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.changes && log.changes.length > 0 ? (
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-800">
                            {log.changes.length} changement{log.changes.length !== 1 ? 's' : ''}
                          </summary>
                          <div className="mt-2 space-y-1 text-xs">
                            {log.changes.map((change: any, idx: number) => (
                              <div key={idx} className="bg-gray-50 p-2 rounded">
                                <span className="font-medium">{change.field}:</span>{' '}
                                <span className="text-red-600 line-through">{String(change.oldValue || 'null')}</span>{' '}
                                →{' '}
                                <span className="text-green-600">{String(change.newValue || 'null')}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      ) : (
                        <span className="text-gray-400">Aucun changement détaillé</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.description || '-'}
                      {log.ipAddress && (
                        <div className="text-xs text-gray-400 mt-1">IP: {log.ipAddress}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogs;

