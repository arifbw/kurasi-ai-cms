import { useState } from 'react';
import { MasterModule, ConfigSchemaField, FieldType } from '../types';
import { Pencil, Trash2, Plus, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface MasterModuleManagementProps {
  modules: MasterModule[];
  onAdd: (module: MasterModule) => void;
  onUpdate: (moduleId: number, updates: Partial<MasterModule>) => void;
  onDelete: (moduleId: number) => void;
}

export function MasterModuleManagement({ 
  modules, 
  onAdd, 
  onUpdate, 
  onDelete 
}: MasterModuleManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<MasterModule | null>(null);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<MasterModule>>({
    name: '',
    query_name: '',
    tab: '',
    metrics: [],
    description: '',
    config_schema: []
  });
  const [metricsInput, setMetricsInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingModule) {
      onUpdate(editingModule.id, formData);
    } else {
      const newModule: MasterModule = {
        id: Date.now(),
        name: formData.name || '',
        query_name: formData.query_name || '',
        tab: formData.tab || '',
        metrics: formData.metrics || [],
        description: formData.description || '',
        config_schema: formData.config_schema || []
      };
      onAdd(newModule);
    }
    
    closeModal();
  };

  const openModal = (module?: MasterModule) => {
    if (module) {
      setEditingModule(module);
      setFormData(module);
      setMetricsInput(module.metrics.join(', '));
    } else {
      setEditingModule(null);
      setFormData({
        name: '',
        query_name: '',
        tab: '',
        metrics: [],
        description: '',
        config_schema: []
      });
      setMetricsInput('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingModule(null);
  };

  const addField = () => {
    const newField: ConfigSchemaField = {
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      default: ''
    };
    setFormData({
      ...formData,
      config_schema: [...(formData.config_schema || []), newField]
    });
  };

  const updateField = (index: number, updates: Partial<ConfigSchemaField>) => {
    const newSchema = [...(formData.config_schema || [])];
    newSchema[index] = { ...newSchema[index], ...updates };
    setFormData({ ...formData, config_schema: newSchema });
  };

  const removeField = (index: number) => {
    const newSchema = [...(formData.config_schema || [])];
    newSchema.splice(index, 1);
    setFormData({ ...formData, config_schema: newSchema });
  };

  const updateMetrics = (value: string) => {
    setMetricsInput(value);
    const metrics = value.split(',').map(m => m.trim()).filter(m => m);
    setFormData({ ...formData, metrics });
  };

  // Filter modules based on search query
  const filteredModules = modules.filter(module => {
    const query = searchQuery.toLowerCase();
    return (
      module.name.toLowerCase().includes(query) ||
      module.query_name.toLowerCase().includes(query) ||
      module.tab.toLowerCase().includes(query) ||
      module.description.toLowerCase().includes(query) ||
      module.metrics.some(metric => metric.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="mb-2">Master Module Management</h1>
          <p className="text-gray-600">Define global modules and their configuration schemas</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Module
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, query name, tab, description, or metrics..."
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
            Found {filteredModules.length} module{filteredModules.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {filteredModules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No modules found. Create your first master module to get started.
          </div>
        ) : (
          filteredModules.map((module) => (
            <div key={module.id} className="bg-white rounded-lg shadow">
              <div className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3>{module.name}</h3>
                    <span className="text-sm text-gray-500">({module.query_name})</span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                      {module.tab}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{module.description}</p>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {module.metrics.map((metric, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                  >
                    {expandedModule === module.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => openModal(module)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete module "${module.name}"?`)) {
                        onDelete(module.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {expandedModule === module.id && (
                <div className="border-t p-4 bg-gray-50">
                  <h4 className="mb-3">Configuration Schema</h4>
                  {module.config_schema.length === 0 ? (
                    <p className="text-gray-500">No configuration fields defined</p>
                  ) : (
                    <div className="space-y-2">
                      {module.config_schema.map((field, idx) => (
                        <div key={idx} className="bg-white p-3 rounded border flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                {field.type}
                              </span>
                              <span>{field.label}</span>
                              <span className="text-gray-500 text-sm">(Name: {field.name})</span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Default: {JSON.stringify(field.default)}
                              {field.options && ` | Options: ${field.options.join(', ')}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4">
              {editingModule ? 'Edit Module' : 'Add New Module'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Module Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Query Name</label>
                  <input
                    type="text"
                    value={formData.query_name}
                    onChange={(e) => setFormData({ ...formData, query_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Tab</label>
                <input
                  type="text"
                  value={formData.tab}
                  onChange={(e) => setFormData({ ...formData, tab: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Metrics (comma-separated)
                </label>
                <input
                  type="text"
                  value={metricsInput}
                  onChange={(e) => updateMetrics(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="metric1, metric2, metric3"
                />
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700">Configuration Schema</label>
                  <button
                    type="button"
                    onClick={addField}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Field
                  </button>
                </div>
                <div className="space-y-3 border rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
                  {(formData.config_schema || []).map((field, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Field Name</label>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(idx, { name: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Type</label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(idx, { type: e.target.value as FieldType })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            <option value="text">Text</option>
                            <option value="textarea">Textarea</option>
                            <option value="number">Number</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="select">Select</option>
                            <option value="multi-select">Multi-Select</option>
                            <option value="date">Date</option>
                            <option value="json">JSON</option>
                          </select>
                        </div>
                      </div>
                      <div className="mb-2">
                        <label className="block text-sm text-gray-600 mb-1">Label</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(idx, { label: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      {field.type === 'select' && (
                        <div className="mb-2">
                          <label className="block text-sm text-gray-600 mb-1">
                            Options (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={(field.options || []).join(', ')}
                            onChange={(e) => updateField(idx, { 
                              options: e.target.value.split(',').map(o => o.trim()).filter(o => o)
                            })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                      )}
                      <div className="mb-2">
                        <label className="block text-sm text-gray-600 mb-1">Default Value</label>
                        {field.type === 'checkbox' ? (
                          <input
                            type="checkbox"
                            checked={field.default === true}
                            onChange={(e) => updateField(idx, { default: e.target.checked })}
                            className="w-4 h-4"
                          />
                        ) : field.type === 'number' ? (
                          <input
                            type="number"
                            value={field.default || 0}
                            onChange={(e) => updateField(idx, { default: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        ) : (
                          <input
                            type="text"
                            value={field.default || ''}
                            onChange={(e) => updateField(idx, { default: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeField(idx)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Field
                      </button>
                    </div>
                  ))}
                  {(formData.config_schema || []).length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No fields defined. Click "Add Field" to create configuration fields.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingModule ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}