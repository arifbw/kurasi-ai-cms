import { ModuleInstance, ModuleConfigValue, MasterModule } from '../types';
import { createDefaultConfigValues } from './moduleStore';
export interface EntityWithModules {
  modules: Record<string, ModuleInstance>;
}

export function createModuleOperations<T extends EntityWithModules>(
  getEntityId: (entity: T) => string
) {
  const assignModule = (
    entities: T[],
    entityId: string,
    moduleId: string,
    masterModule: MasterModule,
    inheritedConfig?: ModuleInstance
  ): T[] => {
    const configValues: ModuleConfigValue = {};

    masterModule.config_schema.forEach((field) => {
      if (inheritedConfig?.config_values[field.name] !== undefined) {
        configValues[field.name] = inheritedConfig.config_values[field.name];
      } else {
        configValues[field.name] = field.default !== undefined ? field.default : '';
      }
    });

    const moduleInstance: ModuleInstance = {
      is_active: inheritedConfig?.is_active || false,
      prompt: inheritedConfig?.prompt || '',
      config_values: configValues,
      is_override: inheritedConfig ? false : undefined,
    };

    return entities.map((entity) =>
      getEntityId(entity) === entityId
        ? { ...entity, modules: { ...entity.modules, [moduleId]: moduleInstance } }
        : entity
    );
  };

  const unassignModule = (
    entities: T[],
    entityId: string,
    moduleId: string
  ): T[] => {
    return entities.map((entity) => {
      if (getEntityId(entity) !== entityId) return entity;
      const { [moduleId]: _, ...remainingModules } = entity.modules;
      return { ...entity, modules: remainingModules };
    });
  };

  const toggleModuleActive = (
    entities: T[],
    entityId: string,
    moduleId: string,
    markAsOverride: boolean = false
  ): T[] => {
    return entities.map((entity) => {
      if (getEntityId(entity) !== entityId || !entity.modules[moduleId]) return entity;
      return {
        ...entity,
        modules: {
          ...entity.modules,
          [moduleId]: {
            ...entity.modules[moduleId],
            is_active: !entity.modules[moduleId].is_active,
            ...(markAsOverride ? { is_override: true } : {}),
          },
        },
      };
    });
  };

  const updateModulePrompt = (
    entities: T[],
    entityId: string,
    moduleId: string,
    prompt: string,
    markAsOverride: boolean = false
  ): T[] => {
    return entities.map((entity) => {
      if (getEntityId(entity) !== entityId || !entity.modules[moduleId]) return entity;
      return {
        ...entity,
        modules: {
          ...entity.modules,
          [moduleId]: {
            ...entity.modules[moduleId],
            prompt,
            ...(markAsOverride ? { is_override: true } : {}),
          },
        },
      };
    });
  };

  const updateModuleConfig = (
    entities: T[],
    entityId: string,
    moduleId: string,
    configValues: ModuleConfigValue,
    isOverride?: boolean
  ): T[] => {
    return entities.map((entity) => {
      if (getEntityId(entity) !== entityId || !entity.modules[moduleId]) return entity;
      return {
        ...entity,
        modules: {
          ...entity.modules,
          [moduleId]: {
            ...entity.modules[moduleId],
            config_values: configValues,
            ...(isOverride !== undefined
              ? { is_override: isOverride }
              : {}),
          },
        },
      };
    });
  };

  const removeModuleFromAll = (
    entities: T[],
    moduleId: string
  ): T[] => {
    return entities.map((entity) => {
      const { [moduleId]: _, ...remainingModules } = entity.modules;
      return { ...entity, modules: remainingModules };
    });
  };

  return {
    assignModule,
    unassignModule,
    toggleModuleActive,
    updateModulePrompt,
    updateModuleConfig,
    removeModuleFromAll,
  };
}
