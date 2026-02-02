import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from './stores/appStore';
import { useAuthStore } from './stores/authStore';
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
  return checkAuth() ? <>{children}</> : <Navigate to="/login" replace />;
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

  const { sectors, clients, masterModules } = useAppStore(
    useShallow((state) => ({
      sectors: state.sectors,
      clients: state.clients,
      masterModules: state.masterModules,
    }))
  );

  const actions = useAppStore(
    useShallow((state) => ({
      addSector: state.addSector,
      updateSector: state.updateSector,
      deleteSector: state.deleteSector,
      addClient: state.addClient,
      updateClient: state.updateClient,
      deleteClient: state.deleteClient,
      addModule: state.addModule,
      updateModule: state.updateModule,
      deleteModule: state.deleteModule,
      exportState: state.exportState,
      importState: state.importState,
      clearState: state.clearState,
    }))
  );

  const handleLogin = (username: string, password: string) => {
    if (login(username, password)) {
      navigate('/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
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
                    onAdd={actions.addSector}
                    onUpdate={actions.updateSector}
                    onDelete={actions.deleteSector}
                    onManageModules={navigateToSectorAssignment}
                  />
                } />

                <Route path="/sectors/:sectorId/modules" element={<SectorModuleAssignmentWrapper />} />
                <Route path="/sectors/:sectorId/modules/:moduleId/config" element={<SectorConfigWrapper />} />

                <Route path="/clients" element={
                  <ClientManagement
                    clients={clients}
                    sectors={sectors}
                    onAdd={actions.addClient}
                    onUpdate={actions.updateClient}
                    onDelete={actions.deleteClient}
                    onManageModules={navigateToClientAssignment}
                  />
                } />

                <Route path="/clients/:clientId/modules" element={<ClientModuleAssignmentWrapper />} />
                <Route path="/clients/:clientId/modules/:moduleId/config" element={<ClientConfigWrapper />} />

                <Route path="/modules" element={
                  <MasterModuleManagement
                    modules={masterModules}
                    onAdd={actions.addModule}
                    onUpdate={actions.updateModule}
                    onDelete={actions.deleteModule}
                  />
                } />

                <Route path="/debug" element={
                  <DebugExport
                    onExport={actions.exportState}
                    onImport={actions.importState}
                    onClear={actions.clearState}
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
