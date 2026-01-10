// Type definitions for the Modular Analytics Management System

export type FieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'multi-select' | 'date' | 'json';

export interface ConfigSchemaField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  default?: any;
  options?: string[];
  description?: string;
}

export interface ModuleConfigValue {
  [fieldName: string]: any;
}

export interface ModuleInstance {
  is_active: boolean;
  prompt: string;
  config_values: ModuleConfigValue;
  is_override?: boolean; // untuk client, menandakan apakah config di-override dari sector
}

export interface Sector {
  id: string;
  name: string;
  description: string;
  category: string;
  modules: Record<string, ModuleInstance>; // moduleId -> instance
}

export interface Client {
  client_id: string;
  name: string;
  project_id: number;
  category: string;
  sector_id?: string; // link ke sector
  modules: Record<string, ModuleInstance>;
}

export interface MasterModule {
  id: number;
  name: string;
  query_name: string;
  tab: string;
  description: string;
  config_schema: ConfigSchemaField[];
  metrics: string[];
}

export interface AppState {
  sectors: Sector[];
  clients: Client[];
  masterModules: MasterModule[];
}