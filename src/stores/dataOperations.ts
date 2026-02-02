import { Sector, Client, MasterModule } from '../types';
import { useModuleStore } from './moduleStore';
import { useSectorStore } from './sectorStore';
import { useClientStore } from './clientStore';
import { removeLegacyData } from './migration';

interface ImportData {
  sectors?: Sector[];
  clients?: Client[];
  masterModules?: MasterModule[];
}

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
      if ((!isValidId(c.client_id) && !isValidId(c.id)) || typeof c.name !== 'string') {
        return { valid: false, error: 'Client must have client_id (or id) and name' };
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

const migrateImportData = (data: Record<string, unknown>): ImportData => {
  const migrated: ImportData = {};

  if (Array.isArray(data.masterModules)) {
    migrated.masterModules = data.masterModules.map((m: Record<string, unknown>) => ({
      ...m,
      id: String(m.id),
    })) as MasterModule[];
  }

  if (Array.isArray(data.sectors)) {
    migrated.sectors = data.sectors.map((s: Record<string, unknown>) => ({
      ...s,
      id: String(s.id),
    })) as Sector[];
  }

  if (Array.isArray(data.clients)) {
    migrated.clients = data.clients.map((c: Record<string, unknown>) => ({
      ...c,
      client_id: String(c.client_id || c.id),
    })) as Client[];
  }

  return migrated;
};

export function exportState(): string {
  const { masterModules } = useModuleStore.getState();
  const { sectors } = useSectorStore.getState();
  const { clients } = useClientStore.getState();

  return JSON.stringify({ sectors, clients, masterModules }, null, 2);
}

export function importState(jsonString: string): boolean {
  try {
    const imported = JSON.parse(jsonString);

    const validation = validateImportData(imported);
    if (!validation.valid) {
      console.error('Import validation failed:', validation.error);
      return false;
    }

    const migrated = migrateImportData(imported);

    if (migrated.masterModules) {
      useModuleStore.getState().setModules(migrated.masterModules);
    }
    if (migrated.sectors) {
      useSectorStore.getState().setSectors(migrated.sectors);
    }
    if (migrated.clients) {
      useClientStore.getState().setClients(migrated.clients);
    }

    return true;
  } catch (error) {
    console.error('Import failed:', error);
    return false;
  }
}

export function clearState(): void {
  useModuleStore.getState().clearModules();
  useSectorStore.getState().clearSectors();
  useClientStore.getState().clearClients();
}

export function deleteModuleCascade(moduleId: string): void {
  useModuleStore.getState().deleteModule(moduleId);
  useSectorStore.getState().removeModuleFromAllSectors(moduleId);
  useClientStore.getState().removeModuleFromAllClients(moduleId);
}

export function completeLegacyMigration(): void {
  removeLegacyData();
}
