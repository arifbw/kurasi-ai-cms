import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MasterModule, ModuleConfigValue } from '../types';
import { getLegacyData, markLegacyMigrated } from './migration';

const STORAGE_KEY = 'modular_analytics_modules';

export const createDefaultConfigValues = (module: MasterModule): ModuleConfigValue => {
  const configValues: ModuleConfigValue = {};
  module.config_schema.forEach((field) => {
    configValues[field.name] = field.default !== undefined ? field.default : '';
  });
  return configValues;
};

interface ModuleStore {
  masterModules: MasterModule[];
  addModule: (module: MasterModule) => void;
  updateModule: (id: string, updates: Partial<MasterModule>) => void;
  deleteModule: (id: string) => void;
  getModuleById: (id: string) => MasterModule | undefined;
  setModules: (modules: MasterModule[]) => void;
  clearModules: () => void;
}

export const useModuleStore = create<ModuleStore>()(
  persist(
    (set, get) => ({
      masterModules: [],

      addModule: (module) =>
        set((state) => ({ masterModules: [...state.masterModules, module] })),

      updateModule: (moduleId, updates) =>
        set((state) => ({
          masterModules: state.masterModules.map((m) =>
            m.id === moduleId ? { ...m, ...updates } : m
          ),
        })),

      deleteModule: (moduleId) =>
        set((state) => ({
          masterModules: state.masterModules.filter((m) => m.id !== moduleId),
        })),

      getModuleById: (id) => {
        return get().masterModules.find((m) => m.id === id);
      },

      setModules: (modules) => set({ masterModules: modules }),

      clearModules: () => set({ masterModules: [] }),
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state && state.masterModules.length === 0) {
          const legacy = getLegacyData();
          if (legacy && legacy.masterModules.length > 0) {
            state.setModules(legacy.masterModules);
            markLegacyMigrated();
          }
        }
      },
    }
  )
);
