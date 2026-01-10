import { useState } from 'react';
import { Download, Upload, Trash2, Save } from 'lucide-react';

interface DebugExportProps {
  onExport: () => string;
  onImport: (jsonString: string) => boolean;
  onClear: () => void;
}

export function DebugExport({ onExport, onImport, onClear }: DebugExportProps) {
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = () => {
    const data = onExport();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-system-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setMessage({ type: 'success', text: 'Data exported successfully!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setMessage({ type: 'error', text: 'Please paste JSON data to import' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const success = onImport(importText);
    if (success) {
      setMessage({ type: 'success', text: 'Data imported successfully! Reload the page to see changes.' });
      setImportText('');
    } else {
      setMessage({ type: 'error', text: 'Failed to import data. Please check the JSON format.' });
    }
    setTimeout(() => setMessage(null), 5000);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      onClear();
      setMessage({ type: 'success', text: 'All data cleared successfully!' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleCopyToClipboard = () => {
    const data = onExport();
    navigator.clipboard.writeText(data).then(() => {
      setMessage({ type: 'success', text: 'JSON copied to clipboard!' });
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleSaveToServer = () => {
    const data = onExport();
    fetch('http://154.26.134.72:5678/webhook/cms-kurasi-ai/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
    }).then(response => {
      if (response.ok) {
        setMessage({ type: 'success', text: 'Data saved to server successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save data to server.' });
      }
      setTimeout(() => setMessage(null), 3000);
    }).catch(() => {
      setMessage({ type: 'error', text: 'Network error while saving data to server.' });
      setTimeout(() => setMessage(null), 3000);
    });
  }

  const handleImportFromServer = () => {
    // implement like in handleImport but fetch data from server
    fetch('http://154.26.134.72:5678/webhook/cms-kurasi-ai/get-data')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load data from server.');
        }
        return response.json();
      })
      .then(data => {
        const success = onImport(JSON.stringify(data[0].data));
        if (success) {
          setMessage({ type: 'success', text: 'Data loaded from server successfully! Reload the page to see changes.' });
        } else {
          setMessage({ type: 'error', text: 'Failed to import data from server.' });
        }
        setTimeout(() => setMessage(null), 5000);
      })
      .catch(() => {
        setMessage({ type: 'error', text: 'Network error while loading data from server.' });
        setTimeout(() => setMessage(null), 3000);
      });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="mb-2">Debug & Export</h1>
        <p className="text-gray-600">Export, import, or clear your application data</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="mb-4">Save & Export Data</h2>
          <p className="text-gray-600 mb-4">
            Download all your clients and modules data as a JSON file.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleSaveToServer}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Data to Server
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
              className="w-full border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="mb-4">Import & Load Data</h2>
          <p className="text-gray-600 mb-4">
            Paste JSON data to import clients and modules.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg mb-3"
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
            className="w-full mt-3 border border-gray-300 px-4 py-2 mt-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Load data from server
          </button>
        </div>
      </div>

      {/* Current Data Preview */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <details className="cursor-pointer">
          <summary className="text-lg font-semibold mb-4 hover:text-blue-600">
            Current Data Preview
          </summary>
          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto mt-4">
            <pre className="text-sm">
              {onExport()}
            </pre>
          </div>
        </details>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow p-6 mt-6 border-2 border-red-200">
        <h2 className="mb-2 text-red-600">Danger Zone</h2>
        <p className="text-gray-600 mb-4">
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
