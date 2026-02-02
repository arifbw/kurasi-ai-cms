import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Sector, ModuleInstance, ModuleConfigValue } from '../types';
import { useModuleStore, createDefaultConfigValues } from './moduleStore';
import { getLegacyData, markLegacyMigrated } from './migration';

const STORAGE_KEY = 'modular_analytics_sectors';

interface SectorStore {
  sectors: Sector[];
  addSector: (sector: Sector) => void;
  updateSector: (id: string, updates: Partial<Sector>) => void;
  deleteSector: (id: string) => void;
  getSectorById: (id: string) => Sector | undefined;
  assignSectorModule: (sectorId: string, moduleId: string) => void;
  unassignSectorModule: (sectorId: string, moduleId: string) => void;
  toggleSectorModuleActive: (sectorId: string, moduleId: string) => void;
  updateSectorModulePrompt: (sectorId: string, moduleId: string, prompt: string) => void;
  updateSectorModuleConfig: (sectorId: string, moduleId: string, configValues: ModuleConfigValue) => void;
  removeModuleFromAllSectors: (moduleId: string) => void;
  setSectors: (sectors: Sector[]) => void;
  clearSectors: () => void;
}

export const useSectorStore = create<SectorStore>()(
  persist(
    (set, get) => ({
      sectors: [],

      addSector: (sector) =>
        set((state) => ({ sectors: [...state.sectors, sector] })),

      updateSector: (sectorId, updates) =>
        set((state) => ({
          sectors: state.sectors.map((s) =>
            s.id === sectorId ? { ...s, ...updates } : s
          ),
        })),

      deleteSector: (sectorId) =>
        set((state) => ({
          sectors: state.sectors.filter((s) => s.id !== sectorId),
        })),

      getSectorById: (id) => {
        return get().sectors.find((s) => s.id === id);
      },

      assignSectorModule: (sectorId, moduleId) => {
        const module = useModuleStore.getState().getModuleById(moduleId);
        if (!module) return;

        const moduleInstance: ModuleInstance = {
          is_active: false,
          prompt: '',
          config_values: createDefaultConfigValues(module),
        };

        set((state) => ({
          sectors: state.sectors.map((s) =>
            s.id === sectorId
              ? { ...s, modules: { ...s.modules, [moduleId]: moduleInstance } }
              : s
          ),
        }));
      },

      unassignSectorModule: (sectorId, moduleId) =>
        set((state) => ({
          sectors: state.sectors.map((s) => {
            if (s.id !== sectorId) return s;
            const { [moduleId]: _, ...remainingModules } = s.modules;
            return { ...s, modules: remainingModules };
          }),
        })),

      toggleSectorModuleActive: (sectorId, moduleId) =>
        set((state) => ({
          sectors: state.sectors.map((s) => {
            if (s.id !== sectorId || !s.modules[moduleId]) return s;
            return {
              ...s,
              modules: {
                ...s.modules,
                [moduleId]: {
                  ...s.modules[moduleId],
                  is_active: !s.modules[moduleId].is_active,
                },
              },
            };
          }),
        })),

      updateSectorModulePrompt: (sectorId, moduleId, prompt) =>
        set((state) => ({
          sectors: state.sectors.map((s) => {
            if (s.id !== sectorId || !s.modules[moduleId]) return s;
            return {
              ...s,
              modules: {
                ...s.modules,
                [moduleId]: { ...s.modules[moduleId], prompt },
              },
            };
          }),
        })),

      updateSectorModuleConfig: (sectorId, moduleId, configValues) =>
        set((state) => ({
          sectors: state.sectors.map((s) => {
            if (s.id !== sectorId || !s.modules[moduleId]) return s;
            return {
              ...s,
              modules: {
                ...s.modules,
                [moduleId]: { ...s.modules[moduleId], config_values: configValues },
              },
            };
          }),
        })),

      removeModuleFromAllSectors: (moduleId) =>
        set((state) => ({
          sectors: state.sectors.map((s) => {
            const { [moduleId]: _, ...remainingModules } = s.modules;
            return { ...s, modules: remainingModules };
          }),
        })),

      setSectors: (sectors) => set({ sectors }),

      clearSectors: () => set({ sectors: [] }),
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state && state.sectors.length === 0) {
          const legacy = getLegacyData();
          if (legacy && legacy.sectors.length > 0) {
            state.setSectors(legacy.sectors);
            markLegacyMigrated();
          }
        }
      },
    }
  )
);
