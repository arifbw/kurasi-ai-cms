import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authenticated = isAuthenticated();
  return authenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [state, setState] = useState<AppState>(() => loadState());
  const navigate = useNavigate();
  const location = useLocation();

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
      navigate('/dashboard');
    } else {
      alert('Invalid credentials. Please use admin/admin123');
    }
  };

  const handleLogout = () => {
    authLogout();
    setAuthenticated(false);
    navigate('/login');
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
    setState(prev => {
      // Auto-inherit modules from sector if client has sector_id
      let clientWithModules = { ...client };

      if (client.sector_id) {
        const sector = prev.sectors.find(s => s.id === client.sector_id);
        if (sector && Object.keys(sector.modules).length > 0) {
          // Copy all modules from sector to client
          clientWithModules.modules = { ...sector.modules };
        }
      }

      return {
        ...prev,
        clients: [...prev.clients, clientWithModules]
      };
    });
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
    navigate(`/sectors/${sectorId}/modules`);
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
    navigate(`/clients/${clientId}/modules`);
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
    navigate(`/${page}`);
  };

  const navigateToSectorAssignment = (sectorId: string) => {
    navigate(`/sectors/${sectorId}/modules`);
  };

  const navigateToSectorConfig = (sectorId: string, moduleId: string) => {
    navigate(`/sectors/${sectorId}/modules/${moduleId}/config`);
  };

  const navigateToClientAssignment = (clientId: string) => {
    navigate(`/clients/${clientId}/modules`);
  };

  const navigateToClientConfig = (clientId: string, moduleId: string) => {
    navigate(`/clients/${clientId}/modules/${moduleId}/config`);
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.startsWith('/sectors')) return 'sectors';
    if (path.startsWith('/clients')) return 'clients';
    if (path.startsWith('/modules')) return 'modules';
    if (path.startsWith('/debug')) return 'debug';
    return 'dashboard';
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />

      <Route path="/*" element={
        <ProtectedRoute>
          <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar
              currentPage={getCurrentPage()}
              onNavigate={navigateToPage}
              onLogout={handleLogout}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
            />

            <div className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                  <Dashboard
                    state={state}
                    onNavigate={navigateToPage}
                  />
                } />

                <Route path="/sectors" element={
                  <SectorManagement
                    sectors={state.sectors}
                    onAdd={addSector}
                    onUpdate={updateSector}
                    onDelete={deleteSector}
                    onManageModules={navigateToSectorAssignment}
                  />
                } />

                <Route path="/sectors/:sectorId/modules" element={
                  <SectorModuleAssignmentWrapper
                    state={state}
                    masterModules={state.masterModules}
                    onAssignModule={assignSectorModule}
                    onUnassignModule={unassignSectorModule}
                    onToggleActive={toggleSectorModuleActive}
                    onUpdatePrompt={updateSectorModulePrompt}
                    onConfigureModule={navigateToSectorConfig}
                    onBack={() => navigateToPage('sectors')}
                  />
                } />

                <Route path="/sectors/:sectorId/modules/:moduleId/config" element={
                  <SectorConfigWrapper
                    state={state}
                    masterModules={state.masterModules}
                    onSave={updateSectorModuleConfig}
                    onBack={navigateToSectorAssignment}
                  />
                } />

                <Route path="/clients" element={
                  <ClientManagement
                    clients={state.clients}
                    sectors={state.sectors}
                    onAdd={addClient}
                    onUpdate={updateClient}
                    onDelete={deleteClient}
                    onManageModules={navigateToClientAssignment}
                  />
                } />

                <Route path="/clients/:clientId/modules" element={
                  <ClientModuleAssignmentWrapper
                    state={state}
                    masterModules={state.masterModules}
                    onAssignModule={assignClientModule}
                    onUnassignModule={unassignClientModule}
                    onToggleActive={toggleClientModuleActive}
                    onUpdatePrompt={updateClientModulePrompt}
                    onConfigureModule={navigateToClientConfig}
                    onBack={() => navigateToPage('clients')}
                  />
                } />

                <Route path="/clients/:clientId/modules/:moduleId/config" element={
                  <ClientConfigWrapper
                    state={state}
                    masterModules={state.masterModules}
                    onSave={updateClientModuleConfig}
                    onBack={navigateToClientAssignment}
                  />
                } />

                <Route path="/modules" element={
                  <MasterModuleManagement
                    modules={state.masterModules}
                    onAdd={addModule}
                    onUpdate={updateModule}
                    onDelete={deleteModule}
                  />
                } />

                <Route path="/debug" element={
                  <DebugExport
                    onExport={handleExport}
                    onImport={handleImport}
                    onClear={handleClear}
                  />
                } />
              </Routes>
            </div>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function SectorModuleAssignmentWrapper({ state, masterModules, onAssignModule, onUnassignModule, onToggleActive, onUpdatePrompt, onConfigureModule, onBack }: any) {
  const { sectorId } = useParams();
  const sector = state.sectors.find((s: Sector) => s.id === sectorId);

  if (!sector) return <div className="p-8">Sector not found</div>;

  return (
    <SectorModuleAssignment
      sector={sector}
      masterModules={masterModules}
      onAssignModule={onAssignModule}
      onUnassignModule={onUnassignModule}
      onToggleActive={onToggleActive}
      onUpdatePrompt={onUpdatePrompt}
      onConfigureModule={onConfigureModule}
      onBack={onBack}
    />
  );
}

function SectorConfigWrapper({ state, masterModules, onSave, onBack }: any) {
  const { sectorId, moduleId } = useParams();
  const sector = state.sectors.find((s: Sector) => s.id === sectorId);
  const masterModule = masterModules.find((m: MasterModule) => m.id.toString() === moduleId);

  if (!sector || !masterModule) return <div className="p-8">Sector or Module not found</div>;

  return (
    <ModuleConfigEditor
      entity={sector}
      entityType="sector"
      moduleId={moduleId!}
      masterModule={masterModule}
      onSave={(configValues) => onSave(sectorId, moduleId, configValues)}
      onBack={() => onBack(sectorId!)}
    />
  );
}

function ClientModuleAssignmentWrapper({ state, masterModules, onAssignModule, onUnassignModule, onToggleActive, onUpdatePrompt, onConfigureModule, onBack }: any) {
  const { clientId } = useParams();
  const client = state.clients.find((c: Client) => c.client_id === clientId);

  if (!client) return <div className="p-8">Client not found</div>;

  return (
    <ModuleAssignment
      client={client}
      masterModules={masterModules}
      onAssignModule={onAssignModule}
      onUnassignModule={onUnassignModule}
      onToggleActive={onToggleActive}
      onUpdatePrompt={onUpdatePrompt}
      onConfigureModule={onConfigureModule}
      onBack={onBack}
    />
  );
}

function ClientConfigWrapper({ state, masterModules, onSave, onBack }: any) {
  const { clientId, moduleId } = useParams();
  const client = state.clients.find((c: Client) => c.client_id === clientId);
  const masterModule = masterModules.find((m: MasterModule) => m.id.toString() === moduleId);
  const sector = client?.sector_id ? state.sectors.find((s: Sector) => s.id === client.sector_id) : null;
  const sectorConfig = sector?.modules[moduleId!]?.config_values;

  if (!client || !masterModule) return <div className="p-8">Client or Module not found</div>;

  return (
    <ModuleConfigEditor
      entity={client}
      entityType="client"
      moduleId={moduleId!}
      masterModule={masterModule}
      sectorConfig={sectorConfig}
      onSave={(configValues, isOverride) => onSave(clientId, moduleId, configValues, isOverride)}
      onBack={() => onBack(clientId!)}
    />
  );
}
