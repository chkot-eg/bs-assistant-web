export const environment = {
  production: false,
  apiUrl: '',  // Use relative URL to leverage proxy - no CORS issues
  sessionTimeout: 86400000,
  maxRetries: 3,
  retryDelay: 1000,
  sseTimeout: 300000,

  // Library / query defaults
  defaultLibrary: 'ADBEGT',
  maxIterations: 7,
  searchTopK: 5,
  maxUploadSizeMB: 10,
  minRequestIntervalMs: 1000
};