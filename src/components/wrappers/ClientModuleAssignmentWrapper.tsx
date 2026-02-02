import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { EntityModuleAssignment } from '../EntityModuleAssignment';

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
    return <div className="p-8 text-gray-900 dark:text-white">Client not found</div>;
  }

  const entity = {
    id: client.client_id,
    name: client.name,
    modules: client.modules,
  };

  return (
    <EntityModuleAssignment
      entity={entity}
      entityType="client"
      masterModules={masterModules}
      onAssignModule={assignClientModule}
      onUnassignModule={unassignClientModule}
      onToggleActive={toggleClientModuleActive}
      onUpdatePrompt={updateClientModulePrompt}
      onConfigureModule={(clientId, moduleId) => navigate(`/clients/${clientId}/modules/${moduleId}/config`)}
      onBack={() => navigate('/clients')}
      subtitle={`Client ID: ${client.client_id} | Project ID: ${client.project_id}`}
    />
  );
}
