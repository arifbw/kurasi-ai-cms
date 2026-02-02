import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Sector, Client, MasterModule, ModuleInstance, ModuleConfigValue, AppState } from '../types';

interface AppStore extends AppState {
  addSector: (sector: Sector) => void;
  updateSector: (id: string, updates: Partial<Sector>) => void;
  deleteSector: (id: string) => void;

  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addModule: (module: MasterModule) => void;
  updateModule: (id: number, updates: Partial<MasterModule>) => void;
  deleteModule: (id: number) => void;

  assignSectorModule: (sectorId: string, moduleId: string) => void;
  unassignSectorModule: (sectorId: string, moduleId: string) => void;
  toggleSectorModuleActive: (sectorId: string, moduleId: string) => void;
  updateSectorModulePrompt: (sectorId: string, moduleId: string, prompt: string) => void;
  updateSectorModuleConfig: (sectorId: string, moduleId: string, configValues: ModuleConfigValue) => void;

  assignClientModule: (clientId: string, moduleId: string) => void;
  unassignClientModule: (clientId: string, moduleId: string) => void;
  toggleClientModuleActive: (clientId: string, moduleId: string) => void;
  updateClientModulePrompt: (clientId: string, moduleId: string, prompt: string) => void;
  updateClientModuleConfig: (clientId: string, moduleId: string, configValues: ModuleConfigValue, isOverride?: boolean) => void;

  exportState: () => string;
  importState: (json: string) => boolean;
  clearState: () => void;
}

const STORAGE_KEY = 'modular_analytics_system';

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      sectors: [],
      clients: [],
      masterModules: [],

      addSector: (sector) => {
        set((state) => ({
          sectors: [...state.sectors, sector],
        }));
      },

      updateSector: (sectorId, updates) => {
        set((state) => ({
          sectors: state.sectors.map((s) =>
            s.id === sectorId ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteSector: (sectorId) => {
        set((state) => ({
          sectors: state.sectors.filter((s) => s.id !== sectorId),
        }));
      },

      addClient: (client) => {
        set((state) => {
          let clientWithModules = { ...client };

          if (client.sector_id) {
            const sector = state.sectors.find((s) => s.id === client.sector_id);
            if (sector && Object.keys(sector.modules).length > 0) {
              clientWithModules.modules = { ...sector.modules };
            }
          }

          return {
            clients: [...state.clients, clientWithModules],
          };
        });
      },

      updateClient: (clientId, updates) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.client_id === clientId ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteClient: (clientId) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.client_id !== clientId),
        }));
      },

      addModule: (module) => {
        set((state) => ({
          masterModules: [...state.masterModules, module],
        }));
      },

      updateModule: (moduleId, updates) => {
        set((state) => ({
          masterModules: state.masterModules.map((m) =>
            m.id === moduleId ? { ...m, ...updates } : m
          ),
        }));
      },

      deleteModule: (moduleId) => {
        set((state) => {
          const moduleIdStr = moduleId.toString();

          const updatedSectors = state.sectors.map((sector) => {
            const { [moduleIdStr]: _, ...remainingModules } = sector.modules;
            return { ...sector, modules: remainingModules };
          });

          const updatedClients = state.clients.map((client) => {
            const { [moduleIdStr]: _, ...remainingModules } = client.modules;
            return { ...client, modules: remainingModules };
          });

          return {
            masterModules: state.masterModules.filter((m) => m.id !== moduleId),
            sectors: updatedSectors,
            clients: updatedClients,
          };
        });
      },

      assignSectorModule: (sectorId, moduleId) => {
        set((state) => {
          const module = state.masterModules.find(
            (m) => m.id.toString() === moduleId
          );
          if (!module) return state;

          const configValues: ModuleConfigValue = {};
          module.config_schema.forEach((field) => {
            configValues[field.name] =
              field.default !== undefined ? field.default : '';
          });

          const moduleInstance: ModuleInstance = {
            is_active: false,
            prompt: '',
            config_values: configValues,
          };

          return {
            sectors: state.sectors.map((s) =>
              s.id === sectorId
                ? { ...s, modules: { ...s.modules, [moduleId]: moduleInstance } }
                : s
            ),
          };
        });
      },

      unassignSectorModule: (sectorId, moduleId) => {
        set((state) => ({
          sectors: state.sectors.map((s) => {
            if (s.id === sectorId) {
              const { [moduleId]: _, ...remainingModules } = s.modules;
              return { ...s, modules: remainingModules };
            }
            return s;
          }),
        }));
      },

      toggleSectorModuleActive: (sectorId, moduleId) => {
        set((state) => ({
          sectors: state.sectors.map((s) => {
            if (s.id === sectorId && s.modules[moduleId]) {
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
            }
            return s;
          }),
        }));
      },

      updateSectorModulePrompt: (sectorId, moduleId, prompt) => {
        set((state) => ({
          sectors: state.sectors.map((s) => {
            if (s.id === sectorId && s.modules[moduleId]) {
              return {
                ...s,
                modules: {
                  ...s.modules,
                  [moduleId]: {
                    ...s.modules[moduleId],
                    prompt,
                  },
                },
              };
            }
            return s;
          }),
        }));
      },

      updateSectorModuleConfig: (sectorId, moduleId, configValues) => {
        set((state) => ({
          sectors: state.sectors.map((s) => {
            if (s.id === sectorId && s.modules[moduleId]) {
              return {
                ...s,
                modules: {
                  ...s.modules,
                  [moduleId]: {
                    ...s.modules[moduleId],
                    config_values: configValues,
                  },
                },
              };
            }
            return s;
          }),
        }));
      },

      assignClientModule: (clientId, moduleId) => {
        set((state) => {
          const client = state.clients.find((c) => c.client_id === clientId);
          const module = state.masterModules.find(
            (m) => m.id.toString() === moduleId
          );
          if (!module || !client) return state;

          const sector = client.sector_id
            ? state.sectors.find((s) => s.id === client.sector_id)
            : null;
          const sectorModuleConfig = sector?.modules[moduleId];

          const configValues: ModuleConfigValue = {};
          module.config_schema.forEach((field) => {
            if (
              sectorModuleConfig &&
              sectorModuleConfig.config_values[field.name] !== undefined
            ) {
              configValues[field.name] =
                sectorModuleConfig.config_values[field.name];
            } else if (field.default !== undefined) {
              configValues[field.name] = field.default;
            } else {
              configValues[field.name] = '';
            }
          });

          const moduleInstance: ModuleInstance = {
            is_active: sectorModuleConfig?.is_active || false,
            prompt: sectorModuleConfig?.prompt || '',
            config_values: configValues,
            is_override: false,
          };

          return {
            clients: state.clients.map((c) =>
              c.client_id === clientId
                ? { ...c, modules: { ...c.modules, [moduleId]: moduleInstance } }
                : c
            ),
          };
        });
      },

      unassignClientModule: (clientId, moduleId) => {
        set((state) => ({
          clients: state.clients.map((c) => {
            if (c.client_id === clientId) {
              const { [moduleId]: _, ...remainingModules } = c.modules;
              return { ...c, modules: remainingModules };
            }
            return c;
          }),
        }));
      },

      toggleClientModuleActive: (clientId, moduleId) => {
        set((state) => ({
          clients: state.clients.map((c) => {
            if (c.client_id === clientId && c.modules[moduleId]) {
              return {
                ...c,
                modules: {
                  ...c.modules,
                  [moduleId]: {
                    ...c.modules[moduleId],
                    is_active: !c.modules[moduleId].is_active,
                    is_override: true,
                  },
                },
              };
            }
            return c;
          }),
        }));
      },

      updateClientModulePrompt: (clientId, moduleId, prompt) => {
        set((state) => ({
          clients: state.clients.map((c) => {
            if (c.client_id === clientId && c.modules[moduleId]) {
              return {
                ...c,
                modules: {
                  ...c.modules,
                  [moduleId]: {
                    ...c.modules[moduleId],
                    prompt,
                    is_override: true,
                  },
                },
              };
            }
            return c;
          }),
        }));
      },

      updateClientModuleConfig: (clientId, moduleId, configValues, isOverride) => {
        set((state) => ({
          clients: state.clients.map((c) => {
            if (c.client_id === clientId && c.modules[moduleId]) {
              return {
                ...c,
                modules: {
                  ...c.modules,
                  [moduleId]: {
                    ...c.modules[moduleId],
                    config_values: configValues,
                    is_override:
                      isOverride !== undefined
                        ? isOverride
                        : c.modules[moduleId].is_override,
                  },
                },
              };
            }
            return c;
          }),
        }));
      },

      exportState: () => {
        const { sectors, clients, masterModules } = get();
        return JSON.stringify({ sectors, clients, masterModules }, null, 2);
      },

      importState: (jsonString) => {
        try {
          const imported = JSON.parse(jsonString);
          set({
            sectors: imported.sectors || [],
            clients: imported.clients || [],
            masterModules: imported.masterModules || [],
          });
          return true;
        } catch {
          return false;
        }
      },

      clearState: () => {
        set({
          sectors: [],
          clients: [],
          masterModules: [],
        });
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);
