import { useState } from 'react';
import { Download, Upload, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../config/api';

interface DebugExportProps {
  onExport: () => string;
  onImport: (jsonString: string) => boolean;
  onClear: () => void;
}

export function DebugExport({ onExport, onImport, onClear }: DebugExportProps) {
  const [importText, setImportText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = () => {
    const data = onExport();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-system-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully!');
  };

  const handleImport = () => {
    if (!importText.trim()) {
      toast.error('Please paste JSON data to import');
      return;
    }

    const success = onImport(importText);
    if (success) {
      toast.success('Data imported successfully!');
      setImportText('');
    } else {
      toast.error('Failed to import data. Please check the JSON format.');
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      onClear();
      toast.success('All data cleared successfully!');
    }
  };

  const handleCopyToClipboard = () => {
    const data = onExport();
    navigator.clipboard.writeText(data).then(() => {
      toast.success('JSON copied to clipboard!');
    });
  };

  const handleSaveToServer = async () => {
    const data = onExport();
    setIsSaving(true);
    try {
      const response = await fetch(API_ENDPOINTS.saveData, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      toast.success('Data saved to server successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error while saving data';
      toast.error(message);
      console.error('Save to server failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportFromServer = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.getData);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('Server returned empty or invalid data');
      }

      if (!data[0] || typeof data[0].data !== 'object') {
        throw new Error('Server data format is invalid');
      }

      const success = onImport(JSON.stringify(data[0].data));
      if (success) {
        toast.success('Data loaded from server successfully!');
      } else {
        toast.error('Failed to import data from server. Data may be corrupted.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error while loading data';
      toast.error(message);
      console.error('Load from server failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-gray-900 dark:text-white mb-2">Debug & Export</h1>
        <p className="text-gray-600 dark:text-gray-400">Export, import, or clear your application data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-gray-900 dark:text-white mb-4">Save & Export Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Download all your clients and modules data as a JSON file.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleSaveToServer}
              disabled={isSaving}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Data to Server
                </>
              )}
            </button>
            <button
              onClick={handleExport}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download JSON File
            </button>
            <button
              onClick={handleCopyToClipboard}
              className="w-full border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 text-gray-900 dark:text-white"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-gray-900 dark:text-white mb-4">Import & Load Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Paste JSON data to import clients and modules.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={5}
            placeholder="Paste JSON data here..."
          />
          <button
            onClick={handleImport}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </button>
          <button
            onClick={handleImportFromServer}
            disabled={isLoading}
            className="w-full mt-3 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Load data from server
              </>
            )}
          </button>
        </div>
      </div>

      {/* Current Data Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6 border border-gray-200 dark:border-gray-700">
        <details className="cursor-pointer">
          <summary className="text-lg font-semibold mb-4 hover:text-blue-600 text-gray-900 dark:text-white">
            Current Data Preview
          </summary>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto mt-4">
            <pre className="text-sm text-gray-900 dark:text-gray-100">
              {onExport()}
            </pre>
          </div>
        </details>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6 border-2 border-red-200 dark:border-red-800">
        <h2 className="mb-2 text-red-600 dark:text-red-400">Danger Zone</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Clear all data from local storage. This action cannot be undone.
        </p>
        <button
          onClick={handleClear}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Data
        </button>
      </div>
    </div>
  );
}
