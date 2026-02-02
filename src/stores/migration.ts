import { Sector, Client, MasterModule } from '../types';

const OLD_STORAGE_KEY = 'modular_analytics_system';

export interface LegacyAppState {
  sectors: Sector[];
  clients: Client[];
  masterModules: MasterModule[];
}

export function hasLegacyData(): boolean {
  const legacy = localStorage.getItem(OLD_STORAGE_KEY);
  return legacy !== null;
}

export function getLegacyData(): LegacyAppState | null {
  const legacy = localStorage.getItem(OLD_STORAGE_KEY);
  if (!legacy) return null;

  try {
    const parsed = JSON.parse(legacy);
    const state = parsed.state || parsed;
    return {
      sectors: state.sectors || [],
      clients: state.clients || [],
      masterModules: state.masterModules || [],
    };
  } catch {
    return null;
  }
}

export function markLegacyMigrated(): void {
  const legacy = localStorage.getItem(OLD_STORAGE_KEY);
  if (legacy) {
    localStorage.setItem(`${OLD_STORAGE_KEY}_backup`, legacy);
  }
}

export function removeLegacyData(): void {
  localStorage.removeItem(OLD_STORAGE_KEY);
}
