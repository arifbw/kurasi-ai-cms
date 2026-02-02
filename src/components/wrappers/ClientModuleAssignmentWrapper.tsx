import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { ModuleAssignment } from '../ModuleAssignment';

export function ClientModuleAssignmentWrapper() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const clients = useAppStore((state) => state.clients);
  const masterModules = useAppStore((state) => state.masterModules);
  const assignClientModule = useAppStore((state) => state.assignClientModule);
  const unassignClientModule = useAppStore((state) => state.unassignClientModule);
  const toggleClientModuleActive = useAppStore((state) => state.toggleClientModuleActive);
  const updateClientModulePrompt = useAppStore((state) => state.updateClientModulePrompt);

  const client = clients.find((c) => c.client_id === clientId);

  if (!client) {
    return <div className="p-8">Client not found</div>;
  }

  const handleConfigureModule = (clientId: string, moduleId: string) => {
    navigate(`/clients/${clientId}/modules/${moduleId}/config`);
  };

  const handleBack = () => {
    navigate('/clients');
  };

  return (
    <ModuleAssignment
      client={client}
      masterModules={masterModules}
      onAssignModule={assignClientModule}
      onUnassignModule={unassignClientModule}
      onToggleActive={toggleClientModuleActive}
      onUpdatePrompt={updateClientModulePrompt}
      onConfigureModule={handleConfigureModule}
      onBack={handleBack}
    />
  );
}
