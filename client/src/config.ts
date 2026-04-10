/**
 * Application Configuration
 * Manages environment-specific URLs and settings
 */

// Determine the base URL based on environment
export const getBaseUrl = (): string => {
  // In production, use the autoscholar.ai domain
  if (import.meta.env.PROD) {
    return 'https://autoscholar.ai';
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
  name: 'AutoScholar',
  fullName: 'AutoScholar.ai — Autonomous Academic Research Platform',
  domain: 'autoscholar.ai',
  description: 'Autonomous AI-powered academic research platform. Generate publication-grade papers, structured literature reviews, and rigorous analyses.',
  version: '3.0.0',

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
    maxPdfChars: 3000000,
    maxQueryLength: 10000,
  },
};

export default APP_CONFIG;
