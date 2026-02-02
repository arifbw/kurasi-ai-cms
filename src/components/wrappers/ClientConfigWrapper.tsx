import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { ModuleConfigEditor } from '../ModuleConfigEditor';

export function ClientConfigWrapper() {
  const { clientId, moduleId } = useParams();
  const navigate = useNavigate();

  const clients = useAppStore((state) => state.clients);
  const sectors = useAppStore((state) => state.sectors);
  const masterModules = useAppStore((state) => state.masterModules);
  const updateClientModuleConfig = useAppStore((state) => state.updateClientModuleConfig);

  const client = clients.find((c) => c.client_id === clientId);
  const masterModule = masterModules.find((m) => m.id.toString() === moduleId);
  const sector = client?.sector_id
    ? sectors.find((s) => s.id === client.sector_id)
    : null;
  const sectorConfig = sector?.modules[moduleId!]?.config_values;

  if (!client || !masterModule) {
    return <div className="p-8">Client or Module not found</div>;
  }

  const handleSave = (configValues: Record<string, any>, isOverride?: boolean) => {
    updateClientModuleConfig(clientId!, moduleId!, configValues, isOverride);
    navigate(`/clients/${clientId}/modules`);
  };

  const handleBack = () => {
    navigate(`/clients/${clientId}/modules`);
  };

  return (
    <ModuleConfigEditor
      entity={client}
      entityType="client"
      moduleId={moduleId!}
      masterModule={masterModule}
      sectorConfig={sectorConfig}
      onSave={handleSave}
      onBack={handleBack}
    />
  );
}
