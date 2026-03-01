/**
 * Application Configuration
 * Manages environment-specific URLs and settings
 */

// Determine the base URL based on environment
export const getBaseUrl = (): string => {
  // In production, use the vquant.ai domain
  if (import.meta.env.PROD) {
    return 'https://www.vquant.ai';
  }

  // In development, use localhost
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:3001';
};

// API base URL (same as base URL since API is served from same origin)
export const API_BASE_URL = getBaseUrl();

// Application metadata
export const APP_CONFIG = {
  name: 'VQuant',
  fullName: 'VQuant Financial Intelligence Platform',
  domain: 'www.vquant.ai',
  description: 'Plateforme d\'analyse financière de niveau institutionnel propulsée par Claude AI',
  version: '2.0.0',

  // Feature flags
  features: {
    pythonCustomCode: true,
    pdfDownload: true,
    sharing: true,
    exportData: true,
    multiSource: true,
  },

  // API Endpoints (relative paths)
  endpoints: {
    chat: '/api/chat',
    share: '/api/share',
    generatePDF: '/api/generate-pdf',
    generateDOCX: '/api/generate-docx',
    download: '/api/download',
  },

  // Limits
  limits: {
    maxToolsPerBatch: 5,
    maxPdfChars: 3000000, // 3M chars = ~750 pages
    maxQueryLength: 10000,
  },
};

export default APP_CONFIG;
