import { useState, useEffect } from 'react';
import { Client, MasterModule } from '../types';

interface ModuleConfigurationProps {
  client: Client;
  module: MasterModule;
  onSave: (clientId: string, moduleId: string, configValues: Record<string, any>) => void;
  onBack: () => void;
}

export function ModuleConfiguration({
  client,
  module,
  onSave,
  onBack
}: ModuleConfigurationProps) {
  const moduleInstance = client.modules[module.id.toString()];
  const [configValues, setConfigValues] = useState<Record<string, any>>(
    moduleInstance?.config_values || {}
  );

  useEffect(() => {
    // Initialize with defaults if no values exist
    const initialValues = { ...configValues };
    module.config_schema.forEach((field) => {
      if (!(field.id in initialValues)) {
        initialValues[field.id] = field.default;
      }
    });
    setConfigValues(initialValues);
  }, [module.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(client.client_id, module.id.toString(), configValues);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setConfigValues({ ...configValues, [fieldId]: value });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-700 mb-4"
        >
          ← Back to Module Assignment
        </button>
        <div>
          <h1 className="mb-2">Configure Module - {module.name}</h1>
          <p className="text-gray-600">
            Client: {client.name} ({client.client_id})
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h3 className="mb-2">Module Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Query Name:</span>
              <span className="ml-2">{module.query_name}</span>
            </div>
            <div>
              <span className="text-gray-600">Tab:</span>
              <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded">
                {module.tab}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Description:</span>
              <p className="mt-1">{module.description}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Metrics:</span>
              <div className="flex gap-2 mt-1 flex-wrap">
                {module.metrics.map((metric, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                    {metric}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="mb-4">Configuration Fields</h3>
          {module.config_schema.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              This module has no configuration fields.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {module.config_schema.map((field) => {
                  const value = configValues[field.id] ?? field.default;
                  
                  return (
                    <div key={field.id}>
                      <label className="block text-gray-700 mb-2">
                        {field.label}
                        <span className="text-gray-500 text-sm ml-2">({field.type})</span>
                      </label>
                      
                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={value || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      )}
                      
                      {field.type === 'textarea' && (
                        <textarea
                          value={value || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                          rows={4}
                        />
                      )}
                      
                      {field.type === 'number' && (
                        <input
                          type="number"
                          value={value || 0}
                          onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      )}
                      
                      {field.type === 'checkbox' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={value === true}
                            onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300"
                          />
                          <span className="text-gray-600">
                            {value === true ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      )}
                      
                      {field.type === 'select' && (
                        <select
                          value={value || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="">-- Select an option --</option>
                          {(field.options || []).map((option, idx) => (
                            <option key={idx} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      <div className="text-sm text-gray-500 mt-1">
                        Default: {JSON.stringify(field.default)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
