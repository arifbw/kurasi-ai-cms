import { useState } from 'react';
import { Client, MasterModule, ModuleInstance } from '../types';
import { Plus, Trash2, Settings, Toggle, ToggleLeft, ToggleRight, Search } from 'lucide-react';

interface ModuleAssignmentProps {
  client: Client;
  masterModules: MasterModule[];
  onAssignModule: (clientId: string, moduleId: string) => void;
  onUnassignModule: (clientId: string, moduleId: string) => void;
  onToggleActive: (clientId: string, moduleId: string) => void;
  onUpdatePrompt: (clientId: string, moduleId: string, prompt: string) => void;
  onConfigureModule: (clientId: string, moduleId: string) => void;
  onBack: () => void;
}

export function ModuleAssignment({
  client,
  masterModules,
  onAssignModule,
  onUnassignModule,
  onToggleActive,
  onUpdatePrompt,
  onConfigureModule,
  onBack
}: ModuleAssignmentProps) {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<{ moduleId: string; prompt: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<number>>(new Set());

  const assignedModuleIds = Object.keys(client.modules);
  const availableModules = masterModules.filter(m => !assignedModuleIds.includes(m.id.toString()));
  const assignedModules = masterModules.filter(m => assignedModuleIds.includes(m.id.toString()));

  // Filter assigned modules based on search query
  const filteredAssignedModules = assignedModules.filter(module => {
    const query = searchQuery.toLowerCase();
    const moduleInstance = client.modules[module.id.toString()];
    return (
      module.name.toLowerCase().includes(query) ||
      module.query_name.toLowerCase().includes(query) ||
      moduleInstance.prompt.toLowerCase().includes(query)
    );
  });

  // Filter available modules in modal based on search
  const filteredAvailableModules = availableModules.filter(module => {
    const query = modalSearchQuery.toLowerCase();
    return (
      module.name.toLowerCase().includes(query) ||
      module.query_name.toLowerCase().includes(query) ||
      module.description.toLowerCase().includes(query) ||
      module.tab.toLowerCase().includes(query) ||
      module.metrics.some(metric => metric.toLowerCase().includes(query))
    );
  });

  const handleAssign = (moduleId: number) => {
    onAssignModule(client.client_id, moduleId.toString());
    setIsAssignModalOpen(false);
    setSelectedModuleIds(new Set());
    setModalSearchQuery('');
  };

  const handleAssignSelected = () => {
    selectedModuleIds.forEach(moduleId => {
      onAssignModule(client.client_id, moduleId.toString());
    });
    setIsAssignModalOpen(false);
    setSelectedModuleIds(new Set());
    setModalSearchQuery('');
  };

  const toggleModuleSelection = (moduleId: number) => {
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
      onUpdatePrompt(client.client_id, editingPrompt.moduleId, editingPrompt.prompt);
      setEditingPrompt(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 mb-4"
        >
          ← Back to Clients
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="mb-2">Module Assignment - {client.name}</h1>
            <p className="text-gray-600">
              Client ID: {client.client_id} | Project ID: {client.project_id}
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
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600 mt-2">
            Found {filteredAssignedModules.length} module{filteredAssignedModules.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-gray-700">Module Name</th>
              <th className="px-6 py-3 text-left text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-gray-700">Prompt</th>
              <th className="px-6 py-3 text-left text-gray-700">Config Fields</th>
              <th className="px-6 py-3 text-left text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignedModules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No modules assigned yet. Click "Assign Module" to get started.
                </td>
              </tr>
            ) : (
              filteredAssignedModules.map((module) => {
                const moduleInstance = client.modules[module.id.toString()];
                return (
                  <tr key={module.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div>{module.name}</div>
                        <div className="text-sm text-gray-500">{module.query_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onToggleActive(client.client_id, module.id.toString())}
                        className="flex items-center gap-2"
                      >
                        {moduleInstance.is_active ? (
                          <>
                            <ToggleRight className="w-6 h-6 text-green-600" />
                            <span className="text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                            <span className="text-gray-500">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {editingPrompt?.moduleId === module.id.toString() ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingPrompt.prompt}
                            onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: e.target.value })}
                            className="flex-1 px-2 py-1 border rounded text-sm"
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
                            className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => setEditingPrompt({ moduleId: module.id.toString(), prompt: moduleInstance.prompt })}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                        >
                          {moduleInstance.prompt || <span className="text-gray-400 italic">Click to add prompt</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                        {module.config_schema.length} fields
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onConfigureModule(client.client_id, module.id.toString())}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                          title="Configure"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Unassign module "${module.name}" from this client?`)) {
                              onUnassignModule(client.client_id, module.id.toString());
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
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
            {/* Header - Fixed */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Assign Module to {client.name}</h2>

              {/* Search */}
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

              {/* Select All */}
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

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {availableModules.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
                  All available modules have been assigned to this client.
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

            {/* Footer - Fixed */}
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