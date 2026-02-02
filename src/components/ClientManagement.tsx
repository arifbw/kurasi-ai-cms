import React, { useState, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Client, Sector } from '../types';
import { Pencil, Trash2, Plus, Settings, Search, Upload, X } from 'lucide-react';

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
    client_id: '',
    name: '',
    project_id: 0,
    category: '',
    sector_id: '',
    logo: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData({ ...formData, logo: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingClient) {
      onUpdate(editingClient.client_id, {
        name: formData.name,
        project_id: formData.project_id,
        category: formData.category,
        sector_id: formData.sector_id,
        logo: formData.logo || undefined
      });
      toast.success('Client updated successfully');
    } else {
      const newClient: Client = {
        client_id: `client_${uuidv4()}`,
        name: formData.name,
        project_id: formData.project_id,
        category: formData.category,
        sector_id: formData.sector_id,
        logo: formData.logo || undefined,
        modules: {}
      };
      onAdd(newClient);
      toast.success('Client created successfully');
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
        sector_id: client.sector_id || '',
        logo: client.logo || ''
      });
    } else {
      setEditingClient(null);
      setFormData({ client_id: '', name: '', project_id: 0, category: '', sector_id: '', logo: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ client_id: '', name: '', project_id: 0, category: '', sector_id: '', logo: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const handleDelete = (client: Client) => {
    if (confirm(`Delete client "${client.name}"?`)) {
      onDelete(client.client_id);
      toast.success('Client deleted successfully');
    }
  };

  const filteredClients = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return clients.filter(client =>
      client.client_id.toLowerCase().includes(query) ||
      client.name.toLowerCase().includes(query) ||
      client.category?.toLowerCase().includes(query) ||
      client.project_id.toString().includes(query)
    );
  }, [clients, searchQuery]);

  const groupedClients = useMemo(() => {
    return filteredClients.reduce((groups, client) => {
      const groupKey = `${client.name}-${client.project_id}`;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(client);
      return groups;
    }, {} as Record<string, Client[]>);
  }, [filteredClients]);

  const filteredSectors = useMemo(() => {
    return sectors.filter(sector =>
      formData.category === 'medsos' ? sector.category === 'medsos' :
      formData.category === 'medkon' ? sector.category === 'medkon' :
      sector.category === 'others'
    );
  }, [sectors, formData.category]);

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
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Logo</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Name</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Project ID</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Data Source</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Modules</th>
              <th className="px-6 py-3 text-left text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedClients).map(([groupKey, groupClients]) => (
              <React.Fragment key={groupKey}>
                <tr
                  className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => toggleGroup(groupKey)}
                >
                  <td className="px-6 py-4">
                    {groupClients[0].logo ? (
                      <img
                        src={groupClients[0].logo}
                        alt={`${groupClients[0].name} logo`}
                        className="w-10 h-10 object-contain rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-gray-400 text-xs">
                        No logo
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    {groupClients[0].name}
                  </td>
                  <td className="px-6 py-4">
                    {groupClients[0].project_id}
                  </td>
                  <td className="px-6 py-4">
                    {groupClients.length > 1 ? `${groupClients.length} data sources` : groupClients[0].category}
                  </td>
                  <td className="px-6 py-4">
                    {groupClients.length > 1 ? '-' : `${Object.keys(groupClients[0].modules).length} assigned`}
                  </td>
                  <td className="px-6 py-4">
                    {groupClients.length > 1 ? 'Click to Expand' : (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onManageModules(groupClients[0].client_id); }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                          title="Manage Modules"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal(groupClients[0]); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(groupClients[0]); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                {expandedGroups[groupKey] && groupClients.length > 1 && groupClients.map((client, index) => (
                  <tr key={client.client_id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 pl-10">
                      {client.logo ? (
                        <img
                          src={client.logo}
                          alt={`${client.name} logo`}
                          className="w-8 h-8 object-contain rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-gray-400 text-xs">
                          -
                        </div>
                      )}
                    </td>
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
                          onClick={() => handleDelete(client)}
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
                  type="number"
                  value={formData.project_id || ''}
                  onChange={(e) => setFormData({ ...formData, project_id: parseInt(e.target.value) || 0 })}
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
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, sector_id: '' })}
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
                  {filteredSectors.map(sector => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  Logo
                </label>
                <div className="space-y-3">
                  {formData.logo ? (
                    <div className="relative inline-block">
                      <img
                        src={formData.logo}
                        alt="Logo preview"
                        className="w-24 h-24 object-contain border rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        title="Remove logo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">Upload</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500">
                    Accepted formats: JPG, PNG, GIF, SVG. Max 2MB.
                  </p>
                </div>
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
