import { useState, useEffect } from 'react';
import { Client, Sector, MasterModule, ConfigSchemaField, ModuleConfigValue } from '../types';
import { Save, AlertCircle, Copy } from 'lucide-react';

interface ModuleConfigEditorProps {
  entity: Client | Sector;
  entityType: 'client' | 'sector';
  moduleId: string;
  masterModule: MasterModule;
  sectorConfig?: ModuleConfigValue; // untuk client, ini adalah config dari sector
  onSave: (configValues: ModuleConfigValue, isOverride?: boolean) => void;
  onBack: () => void;
}

export function ModuleConfigEditor({
  entity,
  entityType,
  moduleId,
  masterModule,
  sectorConfig,
  onSave,
  onBack
}: ModuleConfigEditorProps) {
  const moduleInstance = entity.modules[moduleId];
  const [configValues, setConfigValues] = useState<ModuleConfigValue>(
    moduleInstance?.config_values || {}
  );
  const [isOverride, setIsOverride] = useState(
    entityType === 'client' ? (moduleInstance?.is_override || false) : false
  );
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize with default values or sector config
    const initialValues: ModuleConfigValue = {};
    masterModule.config_schema.forEach(field => {
      if (configValues[field.name] !== undefined) {
        initialValues[field.name] = configValues[field.name];
      } else if (sectorConfig && sectorConfig[field.name] !== undefined && !isOverride) {
        initialValues[field.name] = sectorConfig[field.name];
      } else if (field.default !== undefined) {
        initialValues[field.name] = field.default;
      } else {
        // Set appropriate default based on field type
        switch (field.type) {
          case 'checkbox':
            initialValues[field.name] = false;
            break;
          case 'number':
            initialValues[field.name] = 0;
            break;
          case 'multi-select':
            initialValues[field.name] = [];
            break;
          case 'json':
            initialValues[field.name] = {};
            break;
          default:
            initialValues[field.name] = '';
        }
      }
    });
    setConfigValues(initialValues);
  }, [masterModule, sectorConfig, isOverride]);

  const handleCopySectorConfig = () => {
    if (sectorConfig) {
      setConfigValues({ ...sectorConfig });
      setIsOverride(true);
    }
  };

  const handleFieldChange = (fieldName: string, value: any, fieldType: string) => {
    // Validate JSON fields
    if (fieldType === 'json') {
      try {
        JSON.parse(value);
        setJsonErrors({ ...jsonErrors, [fieldName]: '' });
      } catch (e) {
        setJsonErrors({ ...jsonErrors, [fieldName]: 'Invalid JSON format' });
      }
    }

    setConfigValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate JSON fields before submit
    const hasJsonErrors = Object.values(jsonErrors).some(error => error);
    if (hasJsonErrors) {
      alert('Please fix JSON validation errors before saving');
      return;
    }

    // Parse JSON strings to objects
    const finalValues = { ...configValues };
    masterModule.config_schema.forEach(field => {
      if (field.type === 'json' && typeof finalValues[field.name] === 'string') {
        try {
          finalValues[field.name] = JSON.parse(finalValues[field.name]);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
    });

    onSave(finalValues, isOverride);
  };

  const renderField = (field: ConfigSchemaField) => {
    const value = configValues[field.name];
    const isInherited = entityType === 'client' && !isOverride && sectorConfig && sectorConfig[field.name] !== undefined;

    const fieldClasses = `w-full px-3 py-2 border ${
      isInherited ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white`;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value, field.type)}
            className={fieldClasses}
            required={field.required}
            disabled={isInherited}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value, field.type)}
            className={fieldClasses}
            rows={4}
            required={field.required}
            disabled={isInherited}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || 0, field.type)}
            className={fieldClasses}
            required={field.required}
            disabled={isInherited}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked, field.type)}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
              disabled={isInherited}
            />
            <span className="text-gray-700 dark:text-gray-300">
              {field.label}
            </span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value, field.type)}
            className={fieldClasses}
            required={field.required}
            disabled={isInherited}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multi-select':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(value || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = value || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option);
                    handleFieldChange(field.name, newValues, field.type);
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                  disabled={isInherited}
                />
                <span className="text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value, field.type)}
            className={fieldClasses}
            required={field.required}
            disabled={isInherited}
          />
        );

      case 'json':
        const jsonValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : (value || '{}');
        return (
          <div>
            <textarea
              value={jsonValue}
              onChange={(e) => handleFieldChange(field.name, e.target.value, field.type)}
              className={`${fieldClasses} font-mono text-sm`}
              rows={6}
              required={field.required}
              disabled={isInherited}
              placeholder='{"key": "value"}'
            />
            {jsonErrors[field.name] && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {jsonErrors[field.name]}
              </p>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value, field.type)}
            className={fieldClasses}
            disabled={isInherited}
          />
        );
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={onBack}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
      >
        ← Back
      </button>

      <div className="mb-6">
        <h1 className="text-gray-900 dark:text-white mb-2">
          Configure Module: {masterModule.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {entityType === 'client' ? `Client: ${(entity as Client).name}` : `Sector: ${(entity as Sector).name}`}
        </p>
      </div>

      {entityType === 'client' && sectorConfig && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-blue-900 dark:text-blue-300 mb-2">Configuration Mode</h3>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={isOverride}
                  onChange={(e) => setIsOverride(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-blue-800 dark:text-blue-300">
                  Override sector configuration
                </span>
              </label>
              {!isOverride && (
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Currently using sector default configuration. Fields are read-only. Check the box above to override.
                </p>
              )}
              {isOverride && (
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Custom configuration enabled. You can modify all fields.
                </p>
              )}
            </div>
            {!isOverride && (
              <button
                onClick={handleCopySectorConfig}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Copy className="w-4 h-4" />
                Copy & Override
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6 border border-gray-200 dark:border-gray-700">
        {masterModule.config_schema.map((field) => {
          const isInherited = entityType === 'client' && !isOverride && sectorConfig && sectorConfig[field.name] !== undefined;
          
          return (
            <div key={field.name}>
              {field.type !== 'checkbox' && (
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                  {isInherited && (
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                      Inherited from sector
                    </span>
                  )}
                </label>
              )}
              {field.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{field.description}</p>
              )}
              {renderField(field)}
            </div>
          );
        })}

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
