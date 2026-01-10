import { useState, useEffect } from 'react';
import { Client, Sector, MasterModule, ModuleInstance, AppState, ModuleConfigValue } from './types';
import { loadState, saveState, isAuthenticated, login as authLogin, logout as authLogout } from './lib/storage';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { SectorManagement } from './components/SectorManagement';
import { ClientManagement } from './components/ClientManagement';
import { MasterModuleManagement } from './components/MasterModuleManagement';
import { SectorModuleAssignment } from './components/SectorModuleAssignment';
import { ModuleAssignment } from './components/ModuleAssignment';
import { ModuleConfigEditor } from './components/ModuleConfigEditor';
import { DebugExport } from './components/DebugExport';

type View = 
  | { type: 'dashboard' }
  | { type: 'sectors' }
  | { type: 'clients' }
  | { type: 'modules' }
  | { type: 'sector-assignment'; sectorId: string }
  | { type: 'sector-config'; sectorId: string; moduleId: string }
  | { type: 'client-assignment'; clientId: string }
  | { type: 'client-config'; clientId: string; moduleId: string }
  | { type: 'debug' };

export default function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [state, setState] = useState<AppState>(() => loadState());
  const [currentView, setCurrentView] = useState<View>({ type: 'dashboard' });

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Authentication
  const handleLogin = (username: string, password: string) => {
    if (authLogin(username, password)) {
      setAuthenticated(true);
    } else {
      alert('Invalid credentials. Please use admin/admin123');
    }
  };

  const handleLogout = () => {
    authLogout();
    setAuthenticated(false);
    setCurrentView({ type: 'dashboard' });
  };

  // Sector operations
  const addSector = (sector: Sector) => {
    setState(prev => ({
      ...prev,
      sectors: [...prev.sectors, sector]
    }));
  };

  const updateSector = (sectorId: string, updates: Partial<Sector>) => {
    setState(prev => ({
      ...prev,
      sectors: prev.sectors.map(s => 
        s.id === sectorId ? { ...s, ...updates } : s
      )
    }));
  };

  const deleteSector = (sectorId: string) => {
    setState(prev => ({
      ...prev,
      sectors: prev.sectors.filter(s => s.id !== sectorId)
    }));
  };

  // Client operations
  const addClient = (client: Client) => {
    setState(prev => ({
      ...prev,
      clients: [...prev.clients, client]
    }));
  };

  const updateClient = (clientId: string, updates: Partial<Client>) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.map(c => 
        c.client_id === clientId ? { ...c, ...updates } : c
      )
    }));
  };

  const deleteClient = (clientId: string) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.client_id !== clientId)
    }));
  };

  // Module operations
  const addModule = (module: MasterModule) => {
    setState(prev => ({
      ...prev,
      masterModules: [...prev.masterModules, module]
    }));
  };

  const updateModule = (moduleId: number, updates: Partial<MasterModule>) => {
    setState(prev => ({
      ...prev,
      masterModules: prev.masterModules.map(m => 
        m.id === moduleId ? { ...m, ...updates } : m
      )
    }));
  };

  const deleteModule = (moduleId: number) => {
    setState(prev => {
      const moduleIdStr = moduleId.toString();
      
      // Remove from all sectors and clients
      const updatedSectors = prev.sectors.map(sector => {
        const { [moduleIdStr]: removed, ...remainingModules } = sector.modules;
        return { ...sector, modules: remainingModules };
      });

      const updatedClients = prev.clients.map(client => {
        const { [moduleIdStr]: removed, ...remainingModules } = client.modules;
        return { ...client, modules: remainingModules };
      });

      return {
        ...prev,
        masterModules: prev.masterModules.filter(m => m.id !== moduleId),
        sectors: updatedSectors,
        clients: updatedClients
      };
    });
  };

  // Sector module assignment
  const assignSectorModule = (sectorId: string, moduleId: string) => {
    setState(prev => {
      const module = prev.masterModules.find(m => m.id.toString() === moduleId);
      if (!module) return prev;

      const configValues: ModuleConfigValue = {};
      module.config_schema.forEach(field => {
        configValues[field.name] = field.default !== undefined ? field.default : '';
      });

      const moduleInstance: ModuleInstance = {
        is_active: false,
        prompt: '',
        config_values: configValues
      };

      return {
        ...prev,
        sectors: prev.sectors.map(s =>
          s.id === sectorId
            ? { ...s, modules: { ...s.modules, [moduleId]: moduleInstance } }
            : s
        )
      };
    });
  };

  const unassignSectorModule = (sectorId: string, moduleId: string) => {
    setState(prev => ({
      ...prev,
      sectors: prev.sectors.map(s => {
        if (s.id === sectorId) {
          const { [moduleId]: removed, ...remainingModules } = s.modules;
          return { ...s, modules: remainingModules };
        }
        return s;
      })
    }));
  };

  const toggleSectorModuleActive = (sectorId: string, moduleId: string) => {
    setState(prev => ({
      ...prev,
      sectors: prev.sectors.map(s => {
        if (s.id === sectorId && s.modules[moduleId]) {
          return {
            ...s,
            modules: {
              ...s.modules,
              [moduleId]: {
                ...s.modules[moduleId],
                is_active: !s.modules[moduleId].is_active
              }
            }
          };
        }
        return s;
      })
    }));
  };

  const updateSectorModulePrompt = (sectorId: string, moduleId: string, prompt: string) => {
    setState(prev => ({
      ...prev,
      sectors: prev.sectors.map(s => {
        if (s.id === sectorId && s.modules[moduleId]) {
          return {
            ...s,
            modules: {
              ...s.modules,
              [moduleId]: {
                ...s.modules[moduleId],
                prompt
              }
            }
          };
        }
        return s;
      })
    }));
  };

  const updateSectorModuleConfig = (sectorId: string, moduleId: string, configValues: ModuleConfigValue) => {
    setState(prev => ({
      ...prev,
      sectors: prev.sectors.map(s => {
        if (s.id === sectorId && s.modules[moduleId]) {
          return {
            ...s,
            modules: {
              ...s.modules,
              [moduleId]: {
                ...s.modules[moduleId],
                config_values: configValues
              }
            }
          };
        }
        return s;
      })
    }));
    setCurrentView({ type: 'sector-assignment', sectorId });
  };

  // Client module assignment
  const assignClientModule = (clientId: string, moduleId: string) => {
    setState(prev => {
      const client = prev.clients.find(c => c.client_id === clientId);
      const module = prev.masterModules.find(m => m.id.toString() === moduleId);
      if (!module || !client) return prev;

      // Check if client has sector and sector has this module
      const sector = client.sector_id ? prev.sectors.find(s => s.id === client.sector_id) : null;
      const sectorModuleConfig = sector?.modules[moduleId];

      const configValues: ModuleConfigValue = {};
      module.config_schema.forEach(field => {
        // Use sector config as default if available
        if (sectorModuleConfig && sectorModuleConfig.config_values[field.name] !== undefined) {
          configValues[field.name] = sectorModuleConfig.config_values[field.name];
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
        is_override: false // Initially not overridden
      };

      return {
        ...prev,
        clients: prev.clients.map(c =>
          c.client_id === clientId
            ? { ...c, modules: { ...c.modules, [moduleId]: moduleInstance } }
            : c
        )
      };
    });
  };

  const unassignClientModule = (clientId: string, moduleId: string) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.map(c => {
        if (c.client_id === clientId) {
          const { [moduleId]: removed, ...remainingModules } = c.modules;
          return { ...c, modules: remainingModules };
        }
        return c;
      })
    }));
  };

  const toggleClientModuleActive = (clientId: string, moduleId: string) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.map(c => {
        if (c.client_id === clientId && c.modules[moduleId]) {
          return {
            ...c,
            modules: {
              ...c.modules,
              [moduleId]: {
                ...c.modules[moduleId],
                is_active: !c.modules[moduleId].is_active,
                is_override: true // Toggling makes it an override
              }
            }
          };
        }
        return c;
      })
    }));
  };

  const updateClientModulePrompt = (clientId: string, moduleId: string, prompt: string) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.map(c => {
        if (c.client_id === clientId && c.modules[moduleId]) {
          return {
            ...c,
            modules: {
              ...c.modules,
              [moduleId]: {
                ...c.modules[moduleId],
                prompt,
                is_override: true // Editing prompt makes it an override
              }
            }
          };
        }
        return c;
      })
    }));
  };

  const updateClientModuleConfig = (clientId: string, moduleId: string, configValues: ModuleConfigValue, isOverride?: boolean) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.map(c => {
        if (c.client_id === clientId && c.modules[moduleId]) {
          return {
            ...c,
            modules: {
              ...c.modules,
              [moduleId]: {
                ...c.modules[moduleId],
                config_values: configValues,
                is_override: isOverride !== undefined ? isOverride : c.modules[moduleId].is_override
              }
            }
          };
        }
        return c;
      })
    }));
    setCurrentView({ type: 'client-assignment', clientId });
  };

  // Data operations
  const handleExport = () => {
    return JSON.stringify(state, null, 2);
  };

  const handleImport = (jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString);
      setState(imported);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleClear = () => {
    setState({ sectors: [], clients: [], masterModules: [] });
  };

  // Navigation
  const navigateToPage = (page: string) => {
    switch (page) {
      case 'dashboard':
        setCurrentView({ type: 'dashboard' });
        break;
      case 'sectors':
        setCurrentView({ type: 'sectors' });
        break;
      case 'clients':
        setCurrentView({ type: 'clients' });
        break;
      case 'modules':
        setCurrentView({ type: 'modules' });
        break;
      case 'debug':
        setCurrentView({ type: 'debug' });
        break;
    }
  };

  const navigateToSectorAssignment = (sectorId: string) => {
    setCurrentView({ type: 'sector-assignment', sectorId });
  };

  const navigateToSectorConfig = (sectorId: string, moduleId: string) => {
    setCurrentView({ type: 'sector-config', sectorId, moduleId });
  };

  const navigateToClientAssignment = (clientId: string) => {
    setCurrentView({ type: 'client-assignment', clientId });
  };

  const navigateToClientConfig = (clientId: string, moduleId: string) => {
    setCurrentView({ type: 'client-config', clientId, moduleId });
  };

  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Get current entities
  const getCurrentSector = () => {
    if (currentView.type === 'sector-assignment' || currentView.type === 'sector-config') {
      return state.sectors.find(s => s.id === currentView.sectorId);
    }
  };

  const getCurrentClient = () => {
    if (currentView.type === 'client-assignment' || currentView.type === 'client-config') {
      return state.clients.find(c => c.client_id === currentView.clientId);
    }
  };

  const getCurrentModule = () => {
    if (currentView.type === 'sector-config') {
      return state.masterModules.find(m => m.id.toString() === currentView.moduleId);
    }
    if (currentView.type === 'client-config') {
      return state.masterModules.find(m => m.id.toString() === currentView.moduleId);
    }
  };

  const getSectorConfigForClient = () => {
    if (currentView.type === 'client-config') {
      const client = getCurrentClient();
      const sector = client?.sector_id ? state.sectors.find(s => s.id === client.sector_id) : null;
      return sector?.modules[currentView.moduleId]?.config_values;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar
        currentPage={currentView.type.split('-')[0]}
        onNavigate={navigateToPage}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />
      
      <div className="flex-1 overflow-auto">
        {currentView.type === 'dashboard' && (
          <Dashboard
            state={state}
            onNavigate={navigateToPage}
          />
        )}

        {currentView.type === 'sectors' && (
          <SectorManagement
            sectors={state.sectors}
            onAdd={addSector}
            onUpdate={updateSector}
            onDelete={deleteSector}
            onManageModules={navigateToSectorAssignment}
          />
        )}

        {currentView.type === 'clients' && (
          <ClientManagement
            clients={state.clients}
            sectors={state.sectors}
            onAdd={addClient}
            onUpdate={updateClient}
            onDelete={deleteClient}
            onManageModules={navigateToClientAssignment}
          />
        )}

        {currentView.type === 'modules' && (
          <MasterModuleManagement
            modules={state.masterModules}
            onAdd={addModule}
            onUpdate={updateModule}
            onDelete={deleteModule}
          />
        )}

        {currentView.type === 'sector-assignment' && getCurrentSector() && (
          <SectorModuleAssignment
            sector={getCurrentSector()!}
            masterModules={state.masterModules}
            onAssignModule={assignSectorModule}
            onUnassignModule={unassignSectorModule}
            onToggleActive={toggleSectorModuleActive}
            onUpdatePrompt={updateSectorModulePrompt}
            onConfigureModule={navigateToSectorConfig}
            onBack={() => navigateToPage('sectors')}
          />
        )}

        {currentView.type === 'sector-config' && getCurrentSector() && getCurrentModule() && (
          <ModuleConfigEditor
            entity={getCurrentSector()!}
            entityType="sector"
            moduleId={currentView.moduleId}
            masterModule={getCurrentModule()!}
            onSave={(configValues) => updateSectorModuleConfig(currentView.sectorId, currentView.moduleId, configValues)}
            onBack={() => navigateToSectorAssignment(currentView.sectorId)}
          />
        )}

        {currentView.type === 'client-assignment' && getCurrentClient() && (
          <ModuleAssignment
            client={getCurrentClient()!}
            masterModules={state.masterModules}
            onAssignModule={assignClientModule}
            onUnassignModule={unassignClientModule}
            onToggleActive={toggleClientModuleActive}
            onUpdatePrompt={updateClientModulePrompt}
            onConfigureModule={navigateToClientConfig}
            onBack={() => navigateToPage('clients')}
          />
        )}

        {currentView.type === 'client-config' && getCurrentClient() && getCurrentModule() && (
          <ModuleConfigEditor
            entity={getCurrentClient()!}
            entityType="client"
            moduleId={currentView.moduleId}
            masterModule={getCurrentModule()!}
            sectorConfig={getSectorConfigForClient()}
            onSave={(configValues, isOverride) => updateClientModuleConfig(currentView.clientId, currentView.moduleId, configValues, isOverride)}
            onBack={() => navigateToClientAssignment(currentView.clientId)}
          />
        )}

        {currentView.type === 'debug' && (
          <DebugExport
            onExport={handleExport}
            onImport={handleImport}
            onClear={handleClear}
          />
        )}
      </div>
    </div>
  );
}
