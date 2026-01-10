import { AppState } from '../types';
import { Users, Box, Settings, Activity, TrendingUp, Layers, ArrowRight } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onNavigate: (page: string) => void;
}

export function Dashboard({ state, onNavigate }: DashboardProps) {
  const totalClients = state.clients.length;
  const totalSectors = state.sectors.length;
  const availableModules = state.masterModules.length;
  
  // Calculate active configs (modules yang active di clients)
  const activeConfigs = state.clients.reduce((count, client) => {
    return count + Object.values(client.modules).filter(m => m.is_active).length;
  }, 0);

  // Calculate active configs in sectors
  const activeSectorConfigs = state.sectors.reduce((count, sector) => {
    return count + Object.values(sector.modules).filter(m => m.is_active).length;
  }, 0);

  const stats = [
    {
      name: 'Total Clients',
      value: totalClients,
      icon: Users,
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      name: 'Total Sectors',
      value: totalSectors,
      icon: Layers,
      color: 'bg-purple-500',
      lightBg: 'bg-purple-50 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      name: 'Available Modules',
      value: availableModules,
      icon: Box,
      color: 'bg-green-500',
      lightBg: 'bg-green-50 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      name: 'Active Configs',
      value: activeConfigs + activeSectorConfigs,
      icon: Settings,
      color: 'bg-orange-500',
      lightBg: 'bg-orange-50 dark:bg-orange-900/30',
      textColor: 'text-orange-600 dark:text-orange-400'
    }
  ];

  const quickActions = [
    { label: 'Manage Sectors', page: 'sectors', icon: Layers, color: 'purple' },
    { label: 'Manage Clients', page: 'clients', icon: Users, color: 'blue' },
    { label: 'Master Modules', page: 'modules', icon: Box, color: 'green' },
    { label: 'Debug & Export', page: 'debug', icon: Activity, color: 'gray' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome to Modular Analytics Management System
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.lightBg} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-gray-900 dark:text-white">Quick Actions</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.page}
              onClick={() => onNavigate(action.page)}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`bg-${action.color}-100 dark:bg-${action.color}-900/30 p-2 rounded-lg`}>
                  <action.icon className={`w-5 h-5 text-${action.color}-600 dark:text-${action.color}-400`} />
                </div>
                <span className="text-gray-900 dark:text-white">{action.label}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            </button>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-gray-900 dark:text-white">System Status</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700 dark:text-gray-300">Database Connection</span>
            </div>
            <span className="text-sm text-green-600 dark:text-green-400">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700 dark:text-gray-300">Local Storage</span>
            </div>
            <span className="text-sm text-green-600 dark:text-green-400">Available</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700 dark:text-gray-300">Configuration Hierarchy</span>
            </div>
            <span className="text-sm text-green-600 dark:text-green-400">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">Last Sync</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Just now</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-gray-900 dark:text-white">System Overview</h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-gray-700 dark:text-gray-300">
                Hierarchical config system: <strong>Sector → Client Override</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-gray-700 dark:text-gray-300">
                Support for 8 field types including multi-select, date, and JSON
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-purple-500" />
              <span className="text-gray-700 dark:text-gray-300">
                Dynamic form generation based on module configuration
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
