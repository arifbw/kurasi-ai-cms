import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { EntityModuleAssignment } from '../EntityModuleAssignment';

export function SectorModuleAssignmentWrapper() {
  const { sectorId } = useParams();
  const navigate = useNavigate();

  const sectors = useAppStore((state) => state.sectors);
  const masterModules = useAppStore((state) => state.masterModules);
  const assignSectorModule = useAppStore((state) => state.assignSectorModule);
  const unassignSectorModule = useAppStore((state) => state.unassignSectorModule);
  const toggleSectorModuleActive = useAppStore((state) => state.toggleSectorModuleActive);
  const updateSectorModulePrompt = useAppStore((state) => state.updateSectorModulePrompt);

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
