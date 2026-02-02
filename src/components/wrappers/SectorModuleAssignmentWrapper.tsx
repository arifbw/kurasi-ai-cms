import { useParams, useNavigate } from 'react-router-dom';
import { useSectorStore, useModuleStore } from '../../stores';
import { EntityModuleAssignment } from '../EntityModuleAssignment';

export function SectorModuleAssignmentWrapper() {
  const { sectorId } = useParams();
  const navigate = useNavigate();

  const sectors = useSectorStore((state) => state.sectors);
  const masterModules = useModuleStore((state) => state.masterModules);
  const assignSectorModule = useSectorStore((state) => state.assignSectorModule);
  const unassignSectorModule = useSectorStore((state) => state.unassignSectorModule);
  const toggleSectorModuleActive = useSectorStore((state) => state.toggleSectorModuleActive);
  const updateSectorModulePrompt = useSectorStore((state) => state.updateSectorModulePrompt);

  const sector = sectors.find((s) => s.id === sectorId);

  if (!sector) {
    return <div className="p-8 text-gray-900 dark:text-white">Sector not found</div>;
  }

  return (
    <EntityModuleAssignment
      entity={sector}
      entityType="sector"
      masterModules={masterModules}
      onAssignModule={assignSectorModule}
      onUnassignModule={unassignSectorModule}
      onToggleActive={toggleSectorModuleActive}
      onUpdatePrompt={updateSectorModulePrompt}
      onConfigureModule={(sectorId, moduleId) => navigate(`/sectors/${sectorId}/modules/${moduleId}/config`)}
      onBack={() => navigate('/sectors')}
    />
  );
}
