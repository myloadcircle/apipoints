import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { createAuthMiddleware, createRateLimitMiddleware, createComputeGuardMiddleware, createAuditMiddleware } from './middleware/authAndGovernance';
import { createComputeProxyRoutes } from './routes/computeProxy';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const dbDir = path.dirname(config.database.path);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(config.database.path);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaPath = path.join(__dirname, 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

const authMiddleware = createAuthMiddleware(db);
const rateLimitMiddleware = createRateLimitMiddleware();
const computeGuardMiddleware = createComputeGuardMiddleware(db);
const auditMiddleware = createAuditMiddleware(db);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'apipoints-compute', timestamp: new Date().toISOString() });
});

app.get('/v1/compute/tiers', (_req, res) => {
  const { PRICING_TIERS } = require('./middleware/authAndGovernance');
  res.json({ tiers: Object.values(PRICING_TIERS) });
});

app.use('/v1/compute', authMiddleware, rateLimitMiddleware, computeGuardMiddleware, auditMiddleware);
app.use('/v1/compute', createComputeProxyRoutes(db));

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(config.port, () => {
  console.log(`[APIPOINTS Compute] Gateway running on port ${config.port}`);
  console.log(`[APIPOINTS Compute] Daytona: ${config.daytona.baseUrl}`);
  console.log(`[APIPOINTS Compute] Database: ${config.database.path}`);
});

process.on('SIGTERM', () => {
  console.log('[APIPOINTS Compute] Shutting down...');
  server.close();
  db.close();
});

process.on('SIGINT', () => {
  console.log('[APIPOINTS Compute] Shutting down...');
  server.close();
  db.close();
});

export default app;
