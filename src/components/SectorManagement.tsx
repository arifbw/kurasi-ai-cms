import React, { useState } from 'react';
import { Sector } from '../types';
import { Pencil, Trash2, Plus, Settings, Search, Delete, Trash } from 'lucide-react';

interface SectorManagementProps {
  sectors: Sector[];
  onAdd: (sector: Sector) => void;
  onUpdate: (sectorId: string, updates: Partial<Sector>) => void;
  onDelete: (sectorId: string) => void;
  onManageModules: (sectorId: string) => void;
}

export function SectorManagement({
  sectors,
  onAdd,
  onUpdate,
  onDelete,
  onManageModules
}: SectorManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState({
    id: `sector_${Date.now()}`,
    name: '',
    description: '',
    category: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSector) {
      onUpdate(editingSector.id, {
        name: formData.name,
        description: formData.description,
        category: formData.category
      });
    } else {
      const newSector: Sector = {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        modules: {}
      };
      onAdd(newSector);
    }
    
    closeModal();
  };

  const openModal = (sector?: Sector) => {
    if (sector) {
      setEditingSector(sector);
      setFormData({
        id: sector.id,
        name: sector.name,
        description: sector.description,
        category: sector.category
      });
    } else {
      setEditingSector(null);
      setFormData({ id: `sector_${Date.now()}`, name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSector(null);
    setFormData({ id: '', name: '', description: '', category: '' });
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Filter sectors based on search query
  const filteredSectors = sectors.filter(sector => {
    const query = searchQuery.toLowerCase();
    return (
      sector.name.toLowerCase().includes(query) ||
      sector.description.toLowerCase().includes(query) ||
      sector.category.toLowerCase().includes(query)
    );
  });

  // Group sectors by name
  const groupedSectors = filteredSectors.reduce<{ [key: string]: Sector[] }>((groups, sector) => {
    const groupKey = sector.name;
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(sector);
    return groups;
  }, {});

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-2">Sector Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage sectors and their default module configurations (Level 1 Config)
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Sector
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by sector name, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Name</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Data Source</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Description</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedSectors).map(([groupKey, sectors]) => (
              <React.Fragment key={groupKey}>
                <tr
                  className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => toggleGroup(groupKey)}
                >
                  <td className="px-6 py-4 font-semibold">
                    {groupKey}
                  </td>
                  <td className="px-6 py-4">
                    {sectors.length > 1 ? `${sectors.length} data sources` : sectors[0].category}
                  </td>
                  <td className="px-6 py-4">
                    {sectors.length > 1 ? '-' : sectors[0].description}
                  </td>
                  <td className="px-6 py-4">
                    {sectors.length > 1 ? '🔽 Click to Expand' : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onManageModules(sectors[0].id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                          title="Manage Modules"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal(sectors[0])}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete sector "${sectors[0].name}"?`)) {
                              onDelete(sectors[0].id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                {expandedGroups[groupKey] && sectors.length > 1 && sectors.map((sector, index) => (
                  <tr key={sector.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 pl-10 text-gray-600">
                      {index + 1}. {sector.category}
                    </td>
                    <td className="px-6 py-4">-</td>
                    <td className="px-6 py-4">{sector.description}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onManageModules(sector.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                          title="Manage Modules"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal(sector)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete sector "${sector.name}"?`)) {
                              onDelete(sector.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h2 className="mb-4 text-gray-900 dark:text-white">
              {editingSector ? 'Edit Sector' : 'Add New Sector'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  placeholder="Sector Name"
                />
              </div>
              <div>
                {/* <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Sector ID
                </label> */}
                <input
                  type="hidden"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  placeholder="Unique Sector ID"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Data Source
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="" disabled>Select Data Source</option>
                  <option value="medsos">Media Sosial</option>
                  <option value="medkon">Media Konvensional</option>
                  <option value="others">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  required
                  placeholder="Sector Description"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSector ? 'Update' : 'Add'} Sector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
