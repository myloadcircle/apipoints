export interface SandboxData {
  sandbox_id: string;
  daytona_id?: string;
  daytona_sandbox_id?: string;
  status: string;
  vcpu_count: number;
  memory_mb: number;
  gpu_type?: string;
  vcpu_rate?: number;
  created_at?: string;
}

export interface CodeRunResult {
  execution_id: string;
  sandbox_id: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  elapsed_seconds: number;
  cost: {
    totalWholesale: number;
    totalRetail: number;
    breakdown: Array<{ type: string; units: number; wholesale: number; retail: number }>;
  };
}

export interface UsageSummary {
  tenant_id: string;
  tier: string;
  credit_balance_usd: number;
  monthly_spend_cap_usd: number;
  monthly_usage_usd: number;
  active_sandboxes: number;
  usage_by_resource: Array<{
    resource_type: string;
    total_units: number;
    total_wholesale: number;
    total_retail: number;
  }>;
}

export interface CreateSandboxOptions {
  name?: string;
  image?: string;
  vcpu_count?: number;
  memory_mb?: number;
  gpu_type?: 'rtx4090' | 'h100';
  egress_rules?: string[];
}
