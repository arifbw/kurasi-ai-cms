import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
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

  // Auth store
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const toggleDarkMode = useAuthStore((state) => state.toggleDarkMode);

  // App store
  const sectors = useAppStore((state) => state.sectors);
  const clients = useAppStore((state) => state.clients);
  const masterModules = useAppStore((state) => state.masterModules);
  const addSector = useAppStore((state) => state.addSector);
  const updateSector = useAppStore((state) => state.updateSector);
  const deleteSector = useAppStore((state) => state.deleteSector);
  const addClient = useAppStore((state) => state.addClient);
  const updateClient = useAppStore((state) => state.updateClient);
  const deleteClient = useAppStore((state) => state.deleteClient);
  const addModule = useAppStore((state) => state.addModule);
  const updateModule = useAppStore((state) => state.updateModule);
  const deleteModule = useAppStore((state) => state.deleteModule);
  const exportState = useAppStore((state) => state.exportState);
  const importState = useAppStore((state) => state.importState);
  const clearState = useAppStore((state) => state.clearState);

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
                    onAdd={addSector}
                    onUpdate={updateSector}
                    onDelete={deleteSector}
                    onManageModules={navigateToSectorAssignment}
                  />
                } />

                <Route path="/sectors/:sectorId/modules" element={<SectorModuleAssignmentWrapper />} />
                <Route path="/sectors/:sectorId/modules/:moduleId/config" element={<SectorConfigWrapper />} />

                <Route path="/clients" element={
                  <ClientManagement
                    clients={clients}
                    sectors={sectors}
                    onAdd={addClient}
                    onUpdate={updateClient}
                    onDelete={deleteClient}
                    onManageModules={navigateToClientAssignment}
                  />
                } />

                <Route path="/clients/:clientId/modules" element={<ClientModuleAssignmentWrapper />} />
                <Route path="/clients/:clientId/modules/:moduleId/config" element={<ClientConfigWrapper />} />

                <Route path="/modules" element={
                  <MasterModuleManagement
                    modules={masterModules}
                    onAdd={addModule}
                    onUpdate={updateModule}
                    onDelete={deleteModule}
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
