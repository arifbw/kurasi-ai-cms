import React, { useState } from 'react';
import { Client, Sector } from '../types';
import { Pencil, Trash2, Plus, Settings, Search } from 'lucide-react';

interface ClientManagementProps {
  clients: Client[];
  sectors: Sector[];
  onAdd: (client: Client) => void;
  onUpdate: (clientId: string, updates: Partial<Client>) => void;
  onDelete: (clientId: string) => void;
  onManageModules: (clientId: string) => void;
}

export function ClientManagement({ 
  clients,
  sectors,
  onAdd, 
  onUpdate, 
  onDelete,
  onManageModules 
}: ClientManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    client_id: `client_${Date.now()}`, // Automated client_id
    name: '',
    project_id: 0,
    category: '',
    sector_id: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingClient) {
      onUpdate(editingClient.client_id, {
        name: formData.name,
        project_id: formData.project_id,
        category: formData.category,
        sector_id: formData.sector_id
      });
    } else {
      const newClient: Client = {
        client_id: formData.client_id,
        name: formData.name,
        project_id: formData.project_id,
        category: formData.category,
        sector_id: formData.sector_id,
        modules: {}
      };
      onAdd(newClient);
    }
    
    closeModal();
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        client_id: client.client_id,
        name: client.name,
        project_id: client.project_id,
        category: client.category || '',
        sector_id: client.sector_id || ''
      });
    } else {
      setEditingClient(null);
      setFormData({ client_id: `client_${Date.now()}`, name: '', project_id: '', category: '', sector_id: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ client_id: '', name: '', project_id: 0, category: '', sector_id: '' });
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    return (
      client.client_id.toLowerCase().includes(query) ||
      client.name.toLowerCase().includes(query) ||
      client.category?.toLowerCase().includes(query) ||
      client.project_id.toString().includes(query)
    );
  });

  const groupedClients = filteredClients.reduce((groups, client) => {
    const groupKey = `${client.name}-${client.project_id}`;
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(client);
    return groups;
  }, {} as Record<string, Client[]>);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="mb-2">Client Management</h1>
          <p className="text-gray-600">Manage your clients and their analytics modules</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by client ID, name, category, or project ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600 mt-2">
            Found {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Name</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Project ID</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Data Source</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Modules</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedClients).map(([groupKey, clients]) => (
              <React.Fragment key={groupKey}>
                <tr
                  className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => toggleGroup(groupKey)}
                >
                  <td className="px-6 py-4 font-semibold">
                    {clients[0].name}
                  </td>
                  <td className="px-6 py-4">
                    {clients[0].project_id}
                  </td>
                  <td className="px-6 py-4">
                    {clients.length > 1 ? `${clients.length} data sources` : clients[0].category}
                  </td>
                  <td className="px-6 py-4">
                    {clients.length > 1 ? '-' : `${Object.keys(clients[0].modules).length} assigned`}
                  </td>
                  <td className="px-6 py-4">
                    {clients.length > 1 ? '⬇️ Click to Expand' : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onManageModules(clients[0].client_id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                          title="Manage Modules"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal(clients[0])}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete client "${clients[0].name}"?`)) {
                              onDelete(clients[0].client_id);
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
                {expandedGroups[groupKey] && clients.length > 1 && clients.map((client, index) => (
                  <tr key={client.client_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 pl-10 text-gray-600">
                      {index + 1}. {client.category}
                    </td>
                    <td className="px-6 py-4">-</td>
                    <td className="px-6 py-4">-</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {Object.keys(client.modules).length} assigned
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onManageModules(client.client_id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                          title="Manage Modules"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal(client)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete client "${client.name}"?`)) {
                              onDelete(client.client_id);
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="mb-4">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Removed Client ID input field */}
              <input type="hidden" className="w-full px-3 py-2 border rounded-lg" value={formData.client_id} />
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  placeholder="Client Name"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  Client ID
                </label>
                <input
                  placeholder="Client ID"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  Data Source
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select a Data Source</option>
                  <option value="medsos">Media Sosial</option>
                  <option value="medkon">Media Konvensional</option>
                  <option value="others">Lainnya</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  Sector
                </label>
                <select
                  value={formData.sector_id}
                  onChange={(e) => setFormData({ ...formData, sector_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select a sector</option>
                  {/* only show sectors with category 'medsos', 'medkon', or 'others' depends on formData.category */}
                  {sectors
                    .filter(sector => 
                      formData.category === 'medsos' ? sector.category === 'medsos' :
                      formData.category === 'medkon' ? sector.category === 'medkon' :
                      sector.category === 'others'
                    )
                    .map(sector => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingClient ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}