import { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import { config } from '../config';
import { getTotalMonthlyUsage, getGlobalMonthlyUsage } from '../services/metering';

export interface TierConfig {
  id: string;
  name: string;
  priceMonthly: number;
  dataCredits: number;
  computeCredits: number;
  canUseCompute: boolean;
  rateLimitReqMin: number;
  maxConcurrentSandboxes: number;
  vcpuRatePerHour: number;
  allowedEndpoints: string[];
}

export const PRICING_TIERS: Record<string, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    dataCredits: 100,
    computeCredits: 0,
    canUseCompute: false,
    rateLimitReqMin: 10,
    maxConcurrentSandboxes: 0,
    vcpuRatePerHour: 0,
    allowedEndpoints: ['/v1/llm-costs', '/v1/model-benchmarks', '/v1/deprecations', '/v1/providers', '/v1/changes'],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 49,
    dataCredits: 5_000,
    computeCredits: 49.0,
    canUseCompute: true,
    rateLimitReqMin: 60,
    maxConcurrentSandboxes: 3,
    vcpuRatePerHour: 0.0655,
    allowedEndpoints: ['*'],
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    priceMonthly: 149,
    dataCredits: 20_000,
    computeCredits: 149.0,
    canUseCompute: true,
    rateLimitReqMin: 300,
    maxConcurrentSandboxes: 15,
    vcpuRatePerHour: 0.0655,
    allowedEndpoints: ['*'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 499,
    dataCredits: 50_000,
    computeCredits: 499.0,
    canUseCompute: true,
    rateLimitReqMin: 1000,
    maxConcurrentSandboxes: 50,
    vcpuRatePerHour: 0.0655,
    allowedEndpoints: ['*'],
  },
};

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Evict expired entries every 5 minutes to prevent memory leak
let lastRateLimitCleanup = Date.now();
function cleanupRateLimitStore() {
  const now = Date.now();
  if (now - lastRateLimitCleanup < 300000) return;
  lastRateLimitCleanup = now;
  const windowMs = 60_000;
  for (const [k, v] of rateLimitStore) {
    if (now - v.windowStart > windowMs * 2) rateLimitStore.delete(k);
  }
}

export function createAuthMiddleware(db: Database.Database) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-apipoints-key'] as string;
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing X-APIPOINTS-Key header' });
    }

    const keyHash = await sha256Hex(apiKey);
    const keyRow = db.prepare(`
      SELECT k.user_id, u.email
      FROM api_keys k
      JOIN users u ON k.user_id = u.id
      WHERE k.key_hash = ? AND k.active = 1
    `).get(keyHash) as { user_id: string; email: string } | undefined;

    if (!keyRow) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    db.prepare(`UPDATE api_keys SET last_used_at = datetime('now') WHERE key_hash = ?`).run(keyHash);

    const tenantId = keyRow.user_id;

    let wallet = db.prepare(`SELECT * FROM tenant_wallets WHERE tenant_id = ?`).get(tenantId) as any;
    if (!wallet) {
      const sub = db.prepare(`SELECT plan FROM subscriptions WHERE user_id = ?`).get(tenantId) as { plan: string } | undefined;
      const tier = sub?.plan || 'free';
      const tierConfig = PRICING_TIERS[tier] || PRICING_TIERS.free;

      db.prepare(`
        INSERT OR REPLACE INTO tenant_wallets (tenant_id, organization_name, tier, credit_balance_usd, monthly_spend_cap_usd, monthly_usage_usd, active_sandboxes)
        VALUES (?, '', ?, ?, ?, 0, 0)
      `).run(tenantId, tier, tierConfig.computeCredits, tierConfig.priceMonthly);

      wallet = db.prepare(`SELECT * FROM tenant_wallets WHERE tenant_id = ?`).get(tenantId);
    }

    const tierConfig = PRICING_TIERS[wallet.tier] || PRICING_TIERS.free;

    (req as any).tenantId = tenantId;
    (req as any).tenant = wallet;
    (req as any).tierConfig = tierConfig;

    next();
  };
}

export function createRateLimitMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    cleanupRateLimitStore();
    const tenantId = (req as any).tenantId;
    const tierConfig = (req as any).tierConfig as TierConfig;
    const maxReqs = tierConfig.rateLimitReqMin;
    const now = Date.now();
    const windowStart = now - config.rateLimits.windowMs;

    const entry = rateLimitStore.get(tenantId);
    if (entry && entry.windowStart > windowStart) {
      if (entry.count >= maxReqs) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          limit: maxReqs,
          window: '1 minute',
          retryAfter: Math.ceil((entry.windowStart + config.rateLimits.windowMs - now) / 1000),
        });
      }
      entry.count++;
    } else {
      rateLimitStore.set(tenantId, { count: 1, windowStart: now });
    }

    next();
  };
}

export function createComputeGuardMiddleware(db: Database.Database) {
  return (req: Request, res: Response, next: NextFunction) => {
    const tenantId = (req as any).tenantId;
    const tierConfig = (req as any).tierConfig as TierConfig;
    const wallet = (req as any).tenant as any;

    if (!tierConfig.canUseCompute) {
      return res.status(402).json({
        error: 'Sandbox compute requires a paid plan. Upgrade to Starter ($49/mo) to unlock $49 in compute credits.',
      });
    }

    if (wallet.credit_balance_usd <= 0) {
      return res.status(402).json({
        error: 'Insufficient compute credit balance. Please top up or renew your plan.',
      });
    }

    const activeCount = db.prepare(`
      SELECT COUNT(*) as cnt FROM compute_sandboxes WHERE tenant_id = ? AND status IN ('running', 'provisioning')
    `).get(tenantId) as { cnt: number };

    if (activeCount.cnt >= tierConfig.maxConcurrentSandboxes) {
      return res.status(429).json({
        error: `Max concurrent sandboxes (${tierConfig.maxConcurrentSandboxes}) reached for your ${tierConfig.name} tier.`,
        maxConcurrent: tierConfig.maxConcurrentSandboxes,
        active: activeCount.cnt,
      });
    }

    const monthlyUsage = getTotalMonthlyUsage(db, tenantId);
    if (monthlyUsage >= tierConfig.priceMonthly * 0.95) {
      return res.status(402).json({
        error: 'Monthly spend cap approaching limit. Usage at ' + Math.round((monthlyUsage / tierConfig.priceMonthly) * 100) + '%.',
        monthlyUsage,
        cap: tierConfig.priceMonthly,
      });
    }

    const globalUsage = getGlobalMonthlyUsage(db);
    if (globalUsage >= config.circuitBreaker.globalMonthlyCapUsd * config.circuitBreaker.haltThresholdPct) {
      if (tierConfig.id !== 'enterprise') {
        return res.status(503).json({
          error: 'System-wide compute capacity near limit. Enterprise tier unaffected. Please try again later.',
        });
      }
    }

    next();
  };
}

export function createAuditMiddleware(db: Database.Database) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = (req as any).tenantId;
    const action = `${req.method} ${req.path}`;
    const bodyStr = req.body ? JSON.stringify(req.body) : '';
    const inputHash = await sha256Hex(bodyStr + req.url);

    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      const outputHash = sha256HexSync(JSON.stringify(body));
      db.prepare(`
        INSERT INTO compute_audit_log (tenant_id, action, resource_id, input_hash, output_hash)
        VALUES (?, ?, ?, ?, ?)
      `).run(tenantId, action, (req.params as any).sandbox_id || '', inputHash, outputHash);
      return originalJson(body);
    };

    next();
  };
}

async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

function sha256HexSync(message: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(message).digest('hex');
}
