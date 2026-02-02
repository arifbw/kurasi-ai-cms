import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { ModuleConfigEditor } from '../ModuleConfigEditor';

export function SectorConfigWrapper() {
  const { sectorId, moduleId } = useParams();
  const navigate = useNavigate();

  const sectors = useAppStore((state) => state.sectors);
  const masterModules = useAppStore((state) => state.masterModules);
  const updateSectorModuleConfig = useAppStore((state) => state.updateSectorModuleConfig);

  const sector = sectors.find((s) => s.id === sectorId);
  const masterModule = masterModules.find((m) => m.id.toString() === moduleId);

  if (!sector || !masterModule) {
    return <div className="p-8">Sector or Module not found</div>;
  }

  const handleSave = (configValues: Record<string, any>) => {
    updateSectorModuleConfig(sectorId!, moduleId!, configValues);
    navigate(`/sectors/${sectorId}/modules`);
  };

  const handleBack = () => {
    navigate(`/sectors/${sectorId}/modules`);
  };

  return (
    <ModuleConfigEditor
      entity={sector}
      entityType="sector"
      moduleId={moduleId!}
      masterModule={masterModule}
      onSave={handleSave}
      onBack={handleBack}
    />
  );
}
