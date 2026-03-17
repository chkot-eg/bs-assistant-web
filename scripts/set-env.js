// set-env.js — Reads .env and generates Angular environment files
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
const envMap = {};

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) return;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    envMap[key] = value;
  });
  console.log(`[set-env] Loaded ${Object.keys(envMap).length} values from .env`);
} else {
  console.warn('[set-env] No .env file found — using defaults');
}

const isProd = process.argv.includes('--production');

const apiUrl = isProd ? '' : (envMap.API_URL || '');

const content = `// AUTO-GENERATED from .env by scripts/set-env.js — do not edit manually
export const environment = {
  production: ${isProd},
  apiUrl: '${apiUrl}',
  sessionTimeout: ${envMap.SESSION_TIMEOUT || 86400000},
  maxRetries: ${envMap.MAX_RETRIES || 3},
  retryDelay: ${envMap.RETRY_DELAY || 1000},
  sseTimeout: ${envMap.SSE_TIMEOUT || 300000},

  // Library / query defaults
  defaultLibrary: '${envMap.DEFAULT_LIBRARY || 'ADB800'}',
  maxIterations: ${envMap.MAX_ITERATIONS || 7},
  searchTopK: ${envMap.SEARCH_TOP_K || 5},
  maxUploadSizeMB: ${envMap.MAX_UPLOAD_SIZE_MB || 10},
  minRequestIntervalMs: ${envMap.MIN_REQUEST_INTERVAL_MS || 1000}
};
`;

const target = isProd
  ? path.resolve(__dirname, '..', 'src', 'environments', 'environment.prod.ts')
  : path.resolve(__dirname, '..', 'src', 'environments', 'environment.ts');

fs.writeFileSync(target, content, 'utf8');
console.log(`[set-env] Wrote ${isProd ? 'environment.prod.ts' : 'environment.ts'} (production=${isProd})`);
