export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5678/webhook/cms-kurasi-ai';

export const API_ENDPOINTS = {
  saveData: `${API_BASE_URL}/save-data`,
  getData: `${API_BASE_URL}/get-data`,
} as const;
