import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Sector, Client, MasterModule, ModuleInstance, ModuleConfigValue } from '../types';

interface AppStore {
  sectors: Sector[];
  clients: Client[];
  masterModules: MasterModule[];

  addSector: (sector: Sector) => void;
  updateSector: (id: string, updates: Partial<Sector>) => void;
  deleteSector: (id: string) => void;
  assignSectorModule: (sectorId: string, moduleId: string) => void;
  unassignSectorModule: (sectorId: string, moduleId: string) => void;
  toggleSectorModuleActive: (sectorId: string, moduleId: string) => void;
  updateSectorModulePrompt: (sectorId: string, moduleId: string, prompt: string) => void;
  updateSectorModuleConfig: (sectorId: string, moduleId: string, configValues: ModuleConfigValue) => void;

  // Client actions
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  assignClientModule: (clientId: string, moduleId: string) => void;
  unassignClientModule: (clientId: string, moduleId: string) => void;
  toggleClientModuleActive: (clientId: string, moduleId: string) => void;
  updateClientModulePrompt: (clientId: string, moduleId: string, prompt: string) => void;
  updateClientModuleConfig: (clientId: string, moduleId: string, configValues: ModuleConfigValue, isOverride?: boolean) => void;

  // Module actions
  addModule: (module: MasterModule) => void;
  updateModule: (id: string, updates: Partial<MasterModule>) => void;
  deleteModule: (id: string) => void;

  // Data operations
  exportState: () => string;
  importState: (json: string) => boolean;
  clearState: () => void;
}

const STORAGE_KEY = 'modular_analytics_system';

const createDefaultConfigValues = (module: MasterModule): ModuleConfigValue => {
  const configValues: ModuleConfigValue = {};
  module.config_schema.forEach((field) => {
    configValues[field.name] = field.default !== undefined ? field.default : '';
  });
  return configValues;
};

const isValidId = (value: unknown): boolean => {
  return typeof value === 'string' || typeof value === 'number';
};

const validateImportData = (data: unknown): { valid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Data must be an object' };
  }

  const obj = data as Record<string, unknown>;

  if (obj.sectors !== undefined) {
    if (!Array.isArray(obj.sectors)) {
      return { valid: false, error: 'sectors must be an array' };
    }
    for (const sector of obj.sectors) {
      if (!sector || typeof sector !== 'object') {
        return { valid: false, error: 'Each sector must be an object' };
      }
      const s = sector as Record<string, unknown>;
      if (!isValidId(s.id) || typeof s.name !== 'string') {
        return { valid: false, error: 'Sector must have id and name' };
      }
      if (s.modules !== undefined && typeof s.modules !== 'object') {
        return { valid: false, error: 'Sector modules must be an object' };
      }
    }
  }

  if (obj.clients !== undefined) {
    if (!Array.isArray(obj.clients)) {
      return { valid: false, error: 'clients must be an array' };
    }
    for (const client of obj.clients) {
      if (!client || typeof client !== 'object') {
        return { valid: false, error: 'Each client must be an object' };
      }
      const c = client as Record<string, unknown>;
      if (!isValidId(c.client_id) || typeof c.name !== 'string') {
        return { valid: false, error: 'Client must have client_id and name' };
      }
      if (c.modules !== undefined && typeof c.modules !== 'object') {
        return { valid: false, error: 'Client modules must be an object' };
      }
    }
  }

  if (obj.masterModules !== undefined) {
    if (!Array.isArray(obj.masterModules)) {
      return { valid: false, error: 'masterModules must be an array' };
    }
    for (const module of obj.masterModules) {
      if (!module || typeof module !== 'object') {
        return { valid: false, error: 'Each module must be an object' };
      }
      const m = module as Record<string, unknown>;
      if (!isValidId(m.id) || typeof m.name !== 'string') {
        return { valid: false, error: 'Module must have id and name' };
      }
      if (!Array.isArray(m.config_schema)) {
        return { valid: false, error: 'Module must have config_schema as array' };
      }
    }
  }

  return { valid: true };
};

const migrateImportData = (data: Record<string, unknown>): Record<string, unknown> => {
  const migrated = { ...data };

  if (Array.isArray(migrated.masterModules)) {
    migrated.masterModules = migrated.masterModules.map((m: Record<string, unknown>) => ({
      ...m,
      id: String(m.id),
    }));
  }

  if (Array.isArray(migrated.sectors)) {
    migrated.sectors = migrated.sectors.map((s: Record<string, unknown>) => ({
      ...s,
      id: String(s.id),
    }));
  }

  if (Array.isArray(migrated.clients)) {
    migrated.clients = migrated.clients.map((c: Record<string, unknown>) => ({
      ...c,
      client_id: String(c.client_id),
    }));
  }

  return migrated;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      sectors: [],
      clients: [],
      masterModules: [],

      // Sector CRUD
      addSector: (sector) => set((state) => ({ sectors: [...state.sectors, sector] })),

      updateSector: (sectorId, updates) => set((state) => ({
        sectors: state.sectors.map((s) => s.id === sectorId ? { ...s, ...updates } : s),
      })),

      deleteSector: (sectorId) => set((state) => ({
        sectors: state.sectors.filter((s) => s.id !== sectorId),
      })),

      // Sector module operations
      assignSectorModule: (sectorId, moduleId) => set((state) => {
        const module = state.masterModules.find((m) => m.id === moduleId);
        if (!module) return state;

        const moduleInstance: ModuleInstance = {
          is_active: false,
          prompt: '',
          config_values: createDefaultConfigValues(module),
        };

        return {
          sectors: state.sectors.map((s) =>
            s.id === sectorId
              ? { ...s, modules: { ...s.modules, [moduleId]: moduleInstance } }
              : s
          ),
        };
      }),

      unassignSectorModule: (sectorId, moduleId) => set((state) => ({
        sectors: state.sectors.map((s) => {
          if (s.id !== sectorId) return s;
          const { [moduleId]: _, ...remainingModules } = s.modules;
          return { ...s, modules: remainingModules };
        }),
      })),

      toggleSectorModuleActive: (sectorId, moduleId) => set((state) => ({
        sectors: state.sectors.map((s) => {
          if (s.id !== sectorId || !s.modules[moduleId]) return s;
          return {
            ...s,
            modules: {
              ...s.modules,
              [moduleId]: { ...s.modules[moduleId], is_active: !s.modules[moduleId].is_active },
            },
          };
        }),
      })),

      updateSectorModulePrompt: (sectorId, moduleId, prompt) => set((state) => ({
        sectors: state.sectors.map((s) => {
          if (s.id !== sectorId || !s.modules[moduleId]) return s;
          return {
            ...s,
            modules: { ...s.modules, [moduleId]: { ...s.modules[moduleId], prompt } },
          };
        }),
      })),

      updateSectorModuleConfig: (sectorId, moduleId, configValues) => set((state) => ({
        sectors: state.sectors.map((s) => {
          if (s.id !== sectorId || !s.modules[moduleId]) return s;
          return {
            ...s,
            modules: { ...s.modules, [moduleId]: { ...s.modules[moduleId], config_values: configValues } },
          };
        }),
      })),

      // Client CRUD
      addClient: (client) => set((state) => {
        let clientWithModules = { ...client };
        if (client.sector_id) {
          const sector = state.sectors.find((s) => s.id === client.sector_id);
          if (sector && Object.keys(sector.modules).length > 0) {
            clientWithModules.modules = { ...sector.modules };
          }
        }
        return { clients: [...state.clients, clientWithModules] };
      }),

      updateClient: (clientId, updates) => set((state) => ({
        clients: state.clients.map((c) => c.client_id === clientId ? { ...c, ...updates } : c),
      })),

      deleteClient: (clientId) => set((state) => ({
        clients: state.clients.filter((c) => c.client_id !== clientId),
      })),

      // Client module operations
      assignClientModule: (clientId, moduleId) => set((state) => {
        const client = state.clients.find((c) => c.client_id === clientId);
        const module = state.masterModules.find((m) => m.id === moduleId);
        if (!module || !client) return state;

        const sector = client.sector_id
          ? state.sectors.find((s) => s.id === client.sector_id)
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

        return {
          clients: state.clients.map((c) =>
            c.client_id === clientId
              ? { ...c, modules: { ...c.modules, [moduleId]: moduleInstance } }
              : c
          ),
        };
      }),

      unassignClientModule: (clientId, moduleId) => set((state) => ({
        clients: state.clients.map((c) => {
          if (c.client_id !== clientId) return c;
          const { [moduleId]: _, ...remainingModules } = c.modules;
          return { ...c, modules: remainingModules };
        }),
      })),

      toggleClientModuleActive: (clientId, moduleId) => set((state) => ({
        clients: state.clients.map((c) => {
          if (c.client_id !== clientId || !c.modules[moduleId]) return c;
          return {
            ...c,
            modules: {
              ...c.modules,
              [moduleId]: { ...c.modules[moduleId], is_active: !c.modules[moduleId].is_active, is_override: true },
            },
          };
        }),
      })),

      updateClientModulePrompt: (clientId, moduleId, prompt) => set((state) => ({
        clients: state.clients.map((c) => {
          if (c.client_id !== clientId || !c.modules[moduleId]) return c;
          return {
            ...c,
            modules: { ...c.modules, [moduleId]: { ...c.modules[moduleId], prompt, is_override: true } },
          };
        }),
      })),

      updateClientModuleConfig: (clientId, moduleId, configValues, isOverride) => set((state) => ({
        clients: state.clients.map((c) => {
          if (c.client_id !== clientId || !c.modules[moduleId]) return c;
          return {
            ...c,
            modules: {
              ...c.modules,
              [moduleId]: {
                ...c.modules[moduleId],
                config_values: configValues,
                is_override: isOverride !== undefined ? isOverride : c.modules[moduleId].is_override,
              },
            },
          };
        }),
      })),

      // Module CRUD
      addModule: (module) => set((state) => ({ masterModules: [...state.masterModules, module] })),

      updateModule: (moduleId, updates) => set((state) => ({
        masterModules: state.masterModules.map((m) => m.id === moduleId ? { ...m, ...updates } : m),
      })),

      deleteModule: (moduleId) => set((state) => ({
        masterModules: state.masterModules.filter((m) => m.id !== moduleId),
        sectors: state.sectors.map((s) => {
          const { [moduleId]: _, ...remainingModules } = s.modules;
          return { ...s, modules: remainingModules };
        }),
        clients: state.clients.map((c) => {
          const { [moduleId]: _, ...remainingModules } = c.modules;
          return { ...c, modules: remainingModules };
        }),
      })),

      // Data operations
      exportState: () => {
        const { sectors, clients, masterModules } = get();
        return JSON.stringify({ sectors, clients, masterModules }, null, 2);
      },

      importState: (jsonString) => {
        try {
          const imported = JSON.parse(jsonString);

          const validation = validateImportData(imported);
          if (!validation.valid) {
            console.error('Import validation failed:', validation.error);
            return false;
          }

          const migrated = migrateImportData(imported);

          set({
            sectors: (migrated.sectors as Sector[]) || [],
            clients: (migrated.clients as Client[]) || [],
            masterModules: (migrated.masterModules as MasterModule[]) || [],
          });
          return true;
        } catch (error) {
          console.error('Import failed:', error);
          return false;
        }
      },

      clearState: () => set({ sectors: [], clients: [], masterModules: [] }),
    }),
    { name: STORAGE_KEY }
  )
);
