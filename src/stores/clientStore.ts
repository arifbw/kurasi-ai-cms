import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client, ModuleInstance, ModuleConfigValue } from '../types';
import { useModuleStore, createDefaultConfigValues } from './moduleStore';
import { useSectorStore } from './sectorStore';
import { getLegacyData, markLegacyMigrated } from './migration';

const STORAGE_KEY = 'modular_analytics_clients';

interface ClientStore {
  clients: Client[];
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
  assignClientModule: (clientId: string, moduleId: string) => void;
  unassignClientModule: (clientId: string, moduleId: string) => void;
  toggleClientModuleActive: (clientId: string, moduleId: string) => void;
  updateClientModulePrompt: (clientId: string, moduleId: string, prompt: string) => void;
  updateClientModuleConfig: (clientId: string, moduleId: string, configValues: ModuleConfigValue, isOverride?: boolean) => void;
  removeModuleFromAllClients: (moduleId: string) => void;
  setClients: (clients: Client[]) => void;
  clearClients: () => void;
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set, get) => ({
      clients: [],

      addClient: (client) => {
        let clientWithModules = { ...client };

        if (client.sector_id) {
          const sector = useSectorStore.getState().getSectorById(client.sector_id);
          if (sector && Object.keys(sector.modules).length > 0) {
            clientWithModules.modules = { ...sector.modules };
          }
        }

        set((state) => ({ clients: [...state.clients, clientWithModules] }));
      },

      updateClient: (clientId, updates) =>
        set((state) => ({
          clients: state.clients.map((c) =>
            c.client_id === clientId ? { ...c, ...updates } : c
          ),
        })),

      deleteClient: (clientId) =>
        set((state) => ({
          clients: state.clients.filter((c) => c.client_id !== clientId),
        })),

      getClientById: (id) => {
        return get().clients.find((c) => c.client_id === id);
      },

      assignClientModule: (clientId, moduleId) => {
        const client = get().getClientById(clientId);
        const module = useModuleStore.getState().getModuleById(moduleId);
        if (!module || !client) return;

        const sector = client.sector_id
          ? useSectorStore.getState().getSectorById(client.sector_id)
          : null;
        const sectorConfig = sector?.modules[moduleId];

        const configValues: ModuleConfigValue = {};
        module.config_schema.forEach((field) => {
          if (sectorConfig?.config_values[field.name] !== undefined) {
            configValues[field.name] = sectorConfig.config_values[field.name];
          } else {
            configValues[field.name] = field.default !== undefined ? field.default : '';
          }
        });

        const moduleInstance: ModuleInstance = {
          is_active: sectorConfig?.is_active || false,
          prompt: sectorConfig?.prompt || '',
          config_values: configValues,
          is_override: false,
        };

        set((state) => ({
          clients: state.clients.map((c) =>
            c.client_id === clientId
              ? { ...c, modules: { ...c.modules, [moduleId]: moduleInstance } }
              : c
          ),
        }));
      },

      unassignClientModule: (clientId, moduleId) =>
        set((state) => ({
          clients: state.clients.map((c) => {
            if (c.client_id !== clientId) return c;
            const { [moduleId]: _, ...remainingModules } = c.modules;
            return { ...c, modules: remainingModules };
          }),
        })),

      toggleClientModuleActive: (clientId, moduleId) =>
        set((state) => ({
          clients: state.clients.map((c) => {
            if (c.client_id !== clientId || !c.modules[moduleId]) return c;
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
          }),
        })),

      updateClientModulePrompt: (clientId, moduleId, prompt) =>
        set((state) => ({
          clients: state.clients.map((c) => {
            if (c.client_id !== clientId || !c.modules[moduleId]) return c;
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
          }),
        })),

      updateClientModuleConfig: (clientId, moduleId, configValues, isOverride) =>
        set((state) => ({
          clients: state.clients.map((c) => {
            if (c.client_id !== clientId || !c.modules[moduleId]) return c;
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
          }),
        })),

      removeModuleFromAllClients: (moduleId) =>
        set((state) => ({
          clients: state.clients.map((c) => {
            const { [moduleId]: _, ...remainingModules } = c.modules;
            return { ...c, modules: remainingModules };
          }),
        })),

      setClients: (clients) => set({ clients }),

      clearClients: () => set({ clients: [] }),
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (state && state.clients.length === 0) {
          const legacy = getLegacyData();
          if (legacy && legacy.clients.length > 0) {
            state.setClients(legacy.clients);
            markLegacyMigrated();
          }
        }
      },
    }
  )
);
