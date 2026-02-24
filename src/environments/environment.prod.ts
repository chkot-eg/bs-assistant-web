export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080',
  sessionTimeout: 86400000,
  maxRetries: 3,
  retryDelay: 1000,
  sseTimeout: 300000,

  // Library / query defaults
  defaultLibrary: 'ADB800',
  maxIterations: 7,
  searchTopK: 5,
  maxUploadSizeMB: 10,
  minRequestIntervalMs: 1000
};