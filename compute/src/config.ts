export const config = {
  port: parseInt(process.env.COMPUTE_PORT || '3100', 10),

  daytona: {
    apiKey: process.env.DAYTONA_API_KEY || '',
    baseUrl: process.env.DAYTONA_BASE_URL || 'https://app.daytona.io/api',
  },

  database: {
    path: process.env.COMPUTE_DB_PATH || './data/compute.db',
  },

  apiPoints: {
    workerUrl: process.env.APIPOINTS_WORKER_URL || 'https://apipoints-worker.francis-e3b.workers.dev',
    jwtSecret: process.env.JWT_SECRET || 'apipoints-jwt-secret-2026-prod',
  },

  rateLimits: {
    windowMs: 60_000,
  },

  circuitBreaker: {
    globalMonthlyCapUsd: parseFloat(process.env.GLOBAL_MONTHLY_CAP || '10000'),
    haltThresholdPct: 0.9,
  },
} as const;
