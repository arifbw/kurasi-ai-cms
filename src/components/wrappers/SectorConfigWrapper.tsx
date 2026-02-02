import { useParams, useNavigate } from 'react-router-dom';
import { useSectorStore, useModuleStore } from '../../stores';
import { ModuleConfigEditor } from '../ModuleConfigEditor';
import { ModuleConfigValue } from '../../types';

export function SectorConfigWrapper() {
  const { sectorId, moduleId } = useParams();
  const navigate = useNavigate();

  const sectors = useSectorStore((state) => state.sectors);
  const masterModules = useModuleStore((state) => state.masterModules);
  const updateSectorModuleConfig = useSectorStore((state) => state.updateSectorModuleConfig);

  const sector = sectors.find((s) => s.id === sectorId);
  const masterModule = masterModules.find((m) => m.id.toString() === moduleId);

  if (!sector || !masterModule) {
    return <div className="p-8">Sector or Module not found</div>;
  }

  const handleSave = (configValues: ModuleConfigValue) => {
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
