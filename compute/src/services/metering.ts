import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';

export interface MeteringRate {
  resourceType: string;
  wholesaleRatePerUnit: number;
  retailRatePerUnit: number;
  marginPct: number;
  unit: string;
}

export const METERING_RATES: Record<string, MeteringRate> = {
  vcpu_hour: {
    resourceType: 'vcpu_hour',
    wholesaleRatePerUnit: 0.0504,
    retailRatePerUnit: 0.0655,
    marginPct: 30,
    unit: 'vCPU-hour',
  },
  memory_gib_hour: {
    resourceType: 'memory_gib_hour',
    wholesaleRatePerUnit: 0.0162,
    retailRatePerUnit: 0.0210,
    marginPct: 30,
    unit: 'GiB-hour',
  },
  gpu_hour: {
    resourceType: 'gpu_hour',
    wholesaleRatePerUnit: 0.99,
    retailRatePerUnit: 1.24,
    marginPct: 25,
    unit: 'GPU-hour',
  },
  gpu_hour_h100: {
    resourceType: 'gpu_hour_h100',
    wholesaleRatePerUnit: 3.50,
    retailRatePerUnit: 4.55,
    marginPct: 30,
    unit: 'H100 GPU-hour',
  },
  storage_gb_month: {
    resourceType: 'storage_gb_month',
    wholesaleRatePerUnit: 0.08,
    retailRatePerUnit: 0.12,
    marginPct: 50,
    unit: 'GB-month',
  },
  agent_steps: {
    resourceType: 'agent_steps',
    wholesaleRatePerUnit: 0.004,
    retailRatePerUnit: 0.005,
    marginPct: 25,
    unit: '1K steps',
  },
};

export function calculateRetailCost(
  resourceType: string,
  unitsConsumed: number
): { wholesale: number; retail: number; margin: number } {
  const rate = METERING_RATES[resourceType];
  if (!rate) throw new Error(`Unknown resource type: ${resourceType}`);

  const wholesale = rate.wholesaleRatePerUnit * unitsConsumed;
  const retail = rate.retailRatePerUnit * unitsConsumed;
  const margin = retail - wholesale;

  return {
    wholesale: Math.round(wholesale * 1_000_000) / 1_000_000,
    retail: Math.round(retail * 1_000_000) / 1_000_000,
    margin: Math.round(margin * 1_000_000) / 1_000_000,
  };
}

export function calculateSandboxCost(
  vcpuHours: number,
  memoryGibHours: number,
  gpuHours: number = 0,
  gpuType: string = 'rtx4090',
  storageGbMonths: number = 0,
  agentStepsThousands: number = 0
): { totalWholesale: number; totalRetail: number; breakdown: Array<{ type: string; units: number; wholesale: number; retail: number }> } {
  const breakdown: Array<{ type: string; units: number; wholesale: number; retail: number }> = [];
  let totalWholesale = 0;
  let totalRetail = 0;

  if (vcpuHours > 0) {
    const cost = calculateRetailCost('vcpu_hour', vcpuHours);
    breakdown.push({ type: 'vCPU', units: vcpuHours, wholesale: cost.wholesale, retail: cost.retail });
    totalWholesale += cost.wholesale;
    totalRetail += cost.retail;
  }

  if (memoryGibHours > 0) {
    const cost = calculateRetailCost('memory_gib_hour', memoryGibHours);
    breakdown.push({ type: 'Memory', units: memoryGibHours, wholesale: cost.wholesale, retail: cost.retail });
    totalWholesale += cost.wholesale;
    totalRetail += cost.retail;
  }

  if (gpuHours > 0) {
    const rateKey = gpuType === 'h100' ? 'gpu_hour_h100' : 'gpu_hour';
    const cost = calculateRetailCost(rateKey, gpuHours);
    breakdown.push({ type: `GPU (${gpuType.toUpperCase()})`, units: gpuHours, wholesale: cost.wholesale, retail: cost.retail });
    totalWholesale += cost.wholesale;
    totalRetail += cost.retail;
  }

  if (storageGbMonths > 0) {
    const cost = calculateRetailCost('storage_gb_month', storageGbMonths);
    breakdown.push({ type: 'Storage', units: storageGbMonths, wholesale: cost.wholesale, retail: cost.retail });
    totalWholesale += cost.wholesale;
    totalRetail += cost.retail;
  }

  if (agentStepsThousands > 0) {
    const cost = calculateRetailCost('agent_steps', agentStepsThousands);
    breakdown.push({ type: 'Agent Steps', units: agentStepsThousands, wholesale: cost.wholesale, retail: cost.retail });
    totalWholesale += cost.wholesale;
    totalRetail += cost.retail;
  }

  return {
    totalWholesale: Math.round(totalWholesale * 1_000_000) / 1_000_000,
    totalRetail: Math.round(totalRetail * 1_000_000) / 1_000_000,
    breakdown,
  };
}

export function writeLedgerEntry(
  db: Database.Database,
  tenantId: string,
  sandboxId: string,
  resourceType: string,
  unitsConsumed: number
): string {
  const cost = calculateRetailCost(resourceType, unitsConsumed);
  const ledgerId = uuid();

  db.prepare(`
    INSERT INTO compute_usage_ledger (ledger_id, tenant_id, sandbox_id, resource_type, units_consumed, daytona_wholesale_cost, apipoints_margin_pct, apipoints_retail_charged)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ledgerId, tenantId, sandboxId, resourceType, unitsConsumed, cost.wholesale, METERING_RATES[resourceType]?.marginPct || 0, cost.retail);

  db.prepare(`
    UPDATE tenant_wallets
    SET credit_balance_usd = credit_balance_usd - ?,
        monthly_usage_usd = monthly_usage_usd + ?,
        updated_at = datetime('now')
    WHERE tenant_id = ?
  `).run(cost.retail, cost.retail, tenantId);

  return ledgerId;
}

export function getTotalMonthlyUsage(db: Database.Database, tenantId: string): number {
  const row = db.prepare(`
    SELECT COALESCE(SUM(apipoints_retail_charged), 0) as total
    FROM compute_usage_ledger
    WHERE tenant_id = ? AND timestamp >= date('now', 'start of month')
  `).get(tenantId) as { total: number } | undefined;
  return row?.total || 0;
}

export function getGlobalMonthlyUsage(db: Database.Database): number {
  const row = db.prepare(`
    SELECT COALESCE(SUM(daytona_wholesale_cost), 0) as total
    FROM compute_usage_ledger
    WHERE timestamp >= date('now', 'start of month')
  `).get() as { total: number } | undefined;
  return row?.total || 0;
}
