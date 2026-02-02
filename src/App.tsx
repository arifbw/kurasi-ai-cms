import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore, useModuleStore, useSectorStore, useClientStore, exportState, importState, clearState, deleteModuleCascade } from './stores';
import { useDarkMode } from './hooks';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { SectorManagement } from './components/SectorManagement';
import { ClientManagement } from './components/ClientManagement';
import { MasterModuleManagement } from './components/MasterModuleManagement';
import { DebugExport } from './components/DebugExport';
import {
  SectorModuleAssignmentWrapper,
  SectorConfigWrapper,
  ClientModuleAssignmentWrapper,
  ClientConfigWrapper,
} from './components/wrappers';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const refreshSessionIfActive = useAuthStore((state) => state.refreshSessionIfActive);

  const isAuthenticated = checkAuth();
  if (isAuthenticated) {
    refreshSessionIfActive();
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const darkMode = useDarkMode();

  const { login, logout, toggleDarkMode } = useAuthStore(
    useShallow((state) => ({
      login: state.login,
      logout: state.logout,
      toggleDarkMode: state.toggleDarkMode,
    }))
  );

  const masterModules = useModuleStore((state) => state.masterModules);
  const sectors = useSectorStore((state) => state.sectors);
  const clients = useClientStore((state) => state.clients);

  const moduleActions = useModuleStore(
    useShallow((state) => ({
      addModule: state.addModule,
      updateModule: state.updateModule,
    }))
  );

  const sectorActions = useSectorStore(
    useShallow((state) => ({
      addSector: state.addSector,
      updateSector: state.updateSector,
      deleteSector: state.deleteSector,
    }))
  );

  const clientActions = useClientStore(
    useShallow((state) => ({
      addClient: state.addClient,
      updateClient: state.updateClient,
      deleteClient: state.deleteClient,
    }))
  );

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    const success = await login(username, password);
    if (success) {
      navigate('/dashboard');
    }
    return success;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateToPage = (page: string) => navigate(`/${page}`);
  const navigateToSectorAssignment = (sectorId: string) => navigate(`/sectors/${sectorId}/modules`);
  const navigateToClientAssignment = (clientId: string) => navigate(`/clients/${clientId}/modules`);

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
              onToggleDarkMode={toggleDarkMode}
            />

            <div className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                  <Dashboard
                    state={{ sectors, clients, masterModules }}
                    onNavigate={navigateToPage}
                  />
                } />

                <Route path="/sectors" element={
                  <SectorManagement
                    sectors={sectors}
                    onAdd={sectorActions.addSector}
                    onUpdate={sectorActions.updateSector}
                    onDelete={sectorActions.deleteSector}
                    onManageModules={navigateToSectorAssignment}
                  />
                } />

                <Route path="/sectors/:sectorId/modules" element={<SectorModuleAssignmentWrapper />} />
                <Route path="/sectors/:sectorId/modules/:moduleId/config" element={<SectorConfigWrapper />} />

                <Route path="/clients" element={
                  <ClientManagement
                    clients={clients}
                    sectors={sectors}
                    onAdd={clientActions.addClient}
                    onUpdate={clientActions.updateClient}
                    onDelete={clientActions.deleteClient}
                    onManageModules={navigateToClientAssignment}
                  />
                } />

                <Route path="/clients/:clientId/modules" element={<ClientModuleAssignmentWrapper />} />
                <Route path="/clients/:clientId/modules/:moduleId/config" element={<ClientConfigWrapper />} />

                <Route path="/modules" element={
                  <MasterModuleManagement
                    modules={masterModules}
                    onAdd={moduleActions.addModule}
                    onUpdate={moduleActions.updateModule}
                    onDelete={deleteModuleCascade}
                  />
                } />

                <Route path="/debug" element={
                  <DebugExport
                    onExport={exportState}
                    onImport={importState}
                    onClear={clearState}
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
