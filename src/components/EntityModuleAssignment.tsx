import { useState, useMemo } from 'react';
import { MasterModule, ModuleAssignableEntity } from '../types';
import { Plus, Trash2, Settings, ToggleLeft, ToggleRight, Search } from 'lucide-react';

export type EntityType = 'sector' | 'client';

interface EntityModuleAssignmentProps {
  entity: ModuleAssignableEntity;
  entityType: EntityType;
  masterModules: MasterModule[];
  onAssignModule: (entityId: string, moduleId: string) => void;
  onUnassignModule: (entityId: string, moduleId: string) => void;
  onToggleActive: (entityId: string, moduleId: string) => void;
  onUpdatePrompt: (entityId: string, moduleId: string, prompt: string) => void;
  onConfigureModule: (entityId: string, moduleId: string) => void;
  onBack: () => void;
  subtitle?: string;
}

const entityConfig = {
  sector: {
    backLabel: 'Back to Sectors',
    titlePrefix: 'Module Configuration',
    subtitleLabel: 'Sector ID',
    subtitleSuffix: 'Level 1 Configuration',
    emptyMessage: 'All available modules have been assigned to this sector.',
    unassignMessage: (name: string) => `Unassign module "${name}" from this sector?`,
  },
  client: {
    backLabel: 'Back to Clients',
    titlePrefix: 'Module Assignment',
    subtitleLabel: 'Client ID',
    subtitleSuffix: '',
    emptyMessage: 'All available modules have been assigned to this client.',
    unassignMessage: (name: string) => `Unassign module "${name}" from this client?`,
  },
};

export function EntityModuleAssignment({
  entity,
  entityType,
  masterModules,
  onAssignModule,
  onUnassignModule,
  onToggleActive,
  onUpdatePrompt,
  onConfigureModule,
  onBack,
  subtitle,
}: EntityModuleAssignmentProps) {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<{ moduleId: string; prompt: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(new Set());

  const config = entityConfig[entityType];

  const assignedModuleIds = Object.keys(entity.modules);

  const availableModules = useMemo(
    () => masterModules.filter(m => !assignedModuleIds.includes(m.id)),
    [masterModules, assignedModuleIds]
  );

  const assignedModules = useMemo(
    () => masterModules.filter(m => assignedModuleIds.includes(m.id)),
    [masterModules, assignedModuleIds]
  );

  const filteredAssignedModules = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return assignedModules.filter(module => {
      const moduleInstance = entity.modules[module.id];
      return (
        module.name.toLowerCase().includes(query) ||
        module.query_name.toLowerCase().includes(query) ||
        moduleInstance.prompt.toLowerCase().includes(query)
      );
    });
  }, [assignedModules, entity.modules, searchQuery]);

  const filteredAvailableModules = useMemo(() => {
    const query = modalSearchQuery.toLowerCase();
    return availableModules.filter(module => (
      module.name.toLowerCase().includes(query) ||
      module.query_name.toLowerCase().includes(query) ||
      module.description.toLowerCase().includes(query) ||
      module.tab.toLowerCase().includes(query) ||
      module.metrics.some(metric => metric.toLowerCase().includes(query))
    ));
  }, [availableModules, modalSearchQuery]);

  const handleAssignSelected = () => {
    selectedModuleIds.forEach(moduleId => {
      onAssignModule(entity.id, moduleId);
    });
    setIsAssignModalOpen(false);
    setSelectedModuleIds(new Set());
    setModalSearchQuery('');
  };

  const toggleModuleSelection = (moduleId: string) => {
    const newSelected = new Set(selectedModuleIds);
    if (newSelected.has(moduleId)) {
      newSelected.delete(moduleId);
    } else {
      newSelected.add(moduleId);
    }
    setSelectedModuleIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedModuleIds.size === filteredAvailableModules.length) {
      setSelectedModuleIds(new Set());
    } else {
      setSelectedModuleIds(new Set(filteredAvailableModules.map(m => m.id)));
    }
  };

  const handleSavePrompt = () => {
    if (editingPrompt) {
      onUpdatePrompt(entity.id, editingPrompt.moduleId, editingPrompt.prompt);
      setEditingPrompt(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
        >
          ← {config.backLabel}
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-gray-900 dark:text-white mb-2">
              {config.titlePrefix} - {entity.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {subtitle || `${config.subtitleLabel}: ${entity.id}${config.subtitleSuffix ? ` | ${config.subtitleSuffix}` : ''}`}
            </p>
          </div>
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Assign Module
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search assigned modules by name, query name, or prompt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Found {filteredAssignedModules.length} module{filteredAssignedModules.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Module Name</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Status</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Prompt</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Config Fields</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignedModules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No modules assigned yet. Click "Assign Module" to get started.
                </td>
              </tr>
            ) : (
              filteredAssignedModules.map((module) => {
                const moduleInstance = entity.modules[module.id];
                return (
                  <tr key={module.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-gray-900 dark:text-white">{module.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{module.query_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onToggleActive(entity.id, module.id)}
                        className="flex items-center gap-2"
                      >
                        {moduleInstance.is_active ? (
                          <>
                            <ToggleRight className="w-6 h-6 text-green-600 dark:text-green-400" />
                            <span className="text-green-600 dark:text-green-400">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                            <span className="text-gray-500 dark:text-gray-400">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {editingPrompt?.moduleId === module.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingPrompt.prompt}
                            onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: e.target.value })}
                            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={handleSavePrompt}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPrompt(null)}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => setEditingPrompt({ moduleId: module.id, prompt: moduleInstance.prompt })}
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-white"
                        >
                          {moduleInstance.prompt || <span className="text-gray-400 dark:text-gray-500 italic">Click to add prompt</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-2 py-1 rounded text-sm">
                        {module.config_schema.length} fields
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onConfigureModule(entity.id, module.id)}
                          className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded"
                          title="Configure"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(config.unassignMessage(module.name))) {
                              onUnassignModule(entity.id, module.id);
                            }
                          }}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                          title="Unassign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Assign Module to {entity.name}
              </h2>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search modules by name, description, tab, or metrics..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                {modalSearchQuery && (
                  <button
                    onClick={() => setModalSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                )}
              </div>

              {filteredAvailableModules.length > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectedModuleIds.size === filteredAvailableModules.length && filteredAvailableModules.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="select-all" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    Select All ({filteredAvailableModules.length} modules)
                  </label>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {availableModules.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
                  {config.emptyMessage}
                </p>
              ) : filteredAvailableModules.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
                  No modules found matching "{modalSearchQuery}"
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredAvailableModules.map((module) => (
                    <div
                      key={module.id}
                      className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                        selectedModuleIds.has(module.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => toggleModuleSelection(module.id)}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedModuleIds.has(module.id)}
                          onChange={() => toggleModuleSelection(module.id)}
                          className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">{module.name}</h3>
                            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-2 py-0.5 rounded text-xs">
                              {module.tab}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{module.description}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {module.metrics.map((metric, idx) => (
                              <span key={idx} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs">
                                {metric}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedModuleIds.size > 0 ? `${selectedModuleIds.size} module${selectedModuleIds.size !== 1 ? 's' : ''} selected` : ''}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsAssignModalOpen(false);
                      setSelectedModuleIds(new Set());
                      setModalSearchQuery('');
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignSelected}
                    disabled={selectedModuleIds.size === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign Selected ({selectedModuleIds.size})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
