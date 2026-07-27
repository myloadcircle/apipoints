import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { config } from '../config';
import { writeLedgerEntry, calculateSandboxCost, METERING_RATES } from '../services/metering';

export function createComputeProxyRoutes(db: Database.Database): Router {
  const router = Router();

  // POST /v1/compute/sandboxes — Create sandbox
  router.post('/sandboxes', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const tierConfig = (req as any).tierConfig;
    const { name, image, vcpu_count, memory_mb, gpu_type, egress_rules } = req.body;

    const sandboxId = uuid();
    const daytonaPayload: any = {
      name: name || `sandbox-${sandboxId.slice(0, 8)}`,
      image: image || 'node:20-slim',
      cpu: vcpu_count || 1,
      memory: memory_mb || 512,
    };

    if (gpu_type) daytonaPayload.gpu = gpu_type;
    if (egress_rules) daytonaPayload.egressRules = egress_rules;

    try {
      const response = await fetch(`${config.daytona.baseUrl}/sandboxes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.daytona.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(daytonaPayload),
      });

      const daytonaData = await response.json() as any;

      if (!response.ok) {
        return res.status(response.status).json({ error: daytonaData.message || 'Daytona sandbox creation failed' });
      }

      const sandboxStatus = daytonaData.status || 'running';

      db.prepare(`
        INSERT INTO compute_sandboxes (sandbox_id, tenant_id, daytona_sandbox_id, status, resource_type, vcpu_count, memory_mb, gpu_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(sandboxId, tenantId, daytonaData.id || daytonaData.sandboxId, sandboxStatus, gpu_type ? 'gpu' : 'vcpu', vcpu_count || 1, memory_mb || 512, gpu_type || '');

      if (sandboxStatus === 'running' || sandboxStatus === 'provisioning') {
        db.prepare(`
          UPDATE tenant_wallets SET active_sandboxes = active_sandboxes + 1, updated_at = datetime('now')
          WHERE tenant_id = ?
        `).run(tenantId);
      }

      await writeAuditEntry(db, tenantId, 'sandbox.create', sandboxId, req.body, daytonaData);

      res.status(201).json({
        sandbox_id: sandboxId,
        daytona_id: daytonaData.id || daytonaData.sandboxId,
        status: sandboxStatus,
        vcpu_count: vcpu_count || 1,
        memory_mb: memory_mb || 512,
        gpu_type: gpu_type || null,
        tier: tierConfig.name,
        vcpu_rate: tierConfig.vcpuRatePerHour,
      });
    } catch (err: any) {
      console.error('Sandbox create error:', err?.message);
      res.status(500).json({ error: 'Failed to create sandbox' });
    }
  });

  // POST /v1/compute/sandboxes/:sandbox_id/code-run — Execute code
  router.post('/sandboxes/:sandbox_id/code-run', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { sandbox_id } = req.params;
    const { language, code, timeout } = req.body;

    const sandbox = db.prepare(`
      SELECT * FROM compute_sandboxes WHERE sandbox_id = ? AND tenant_id = ?
    `).get(sandbox_id) as any;

    if (!sandbox) return res.status(404).json({ error: 'Sandbox not found' });
    if (sandbox.status !== 'running') return res.status(409).json({ error: 'Sandbox is not running' });

    try {
      const response = await fetch(`${config.daytona.baseUrl}/sandboxes/${sandbox.daytona_sandbox_id}/code-run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.daytona.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language, code, timeout }),
      });

      const daytonaData = await response.json() as any;

      if (!response.ok) {
        return res.status(response.status).json({ error: daytonaData.message || 'Code execution failed' });
      }

      const elapsedSeconds = daytonaData.elapsed_seconds || (timeout || 30);
      const vcpuHours = (sandbox.vcpu_count * elapsedSeconds) / 3600;
      const memoryGibHours = ((sandbox.memory_mb / 1024) * elapsedSeconds) / 3600;

      writeLedgerEntry(db, tenantId, sandbox_id, 'vcpu_hour', vcpuHours);
      writeLedgerEntry(db, tenantId, sandbox_id, 'memory_gib_hour', memoryGibHours);

      if (sandbox.gpu_type) {
        const gpuHours = elapsedSeconds / 3600;
        const rateKey = sandbox.gpu_type === 'h100' ? 'gpu_hour_h100' : 'gpu_hour';
        writeLedgerEntry(db, tenantId, sandbox_id, rateKey, gpuHours);
      }

      await writeAuditEntry(db, tenantId, 'sandbox.code-run', sandbox_id, { language, code_length: code?.length }, daytonaData);

      res.json({
        execution_id: uuid(),
        sandbox_id,
        stdout: daytonaData.stdout || '',
        stderr: daytonaData.stderr || '',
        exit_code: daytonaData.exit_code || 0,
        elapsed_seconds: elapsedSeconds,
        cost: calculateSandboxCost(vcpuHours, memoryGibHours, sandbox.gpu_type ? elapsedSeconds / 3600 : 0, sandbox.gpu_type || 'rtx4090'),
      });
    } catch (err: any) {
      console.error('Code execution error:', err?.message);
      res.status(500).json({ error: 'Code execution failed' });
    }
  });

  // POST /v1/compute/snapshots — Create snapshot
  router.post('/snapshots', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { sandbox_id, name } = req.body;

    const sandbox = db.prepare(`
      SELECT * FROM compute_sandboxes WHERE sandbox_id = ? AND tenant_id = ?
    `).get(sandbox_id) as any;

    if (!sandbox) return res.status(404).json({ error: 'Sandbox not found' });

    try {
      const response = await fetch(`${config.daytona.baseUrl}/snapshots`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.daytona.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sandboxId: sandbox.daytona_sandbox_id, name }),
      });

      const daytonaData = await response.json() as any;

      if (!response.ok) {
        return res.status(response.status).json({ error: daytonaData.message || 'Snapshot creation failed' });
      }

      const sizeGb = daytonaData.sizeGb || 1;
      writeLedgerEntry(db, tenantId, sandbox_id, 'storage_gb_month', sizeGb);

      await writeAuditEntry(db, tenantId, 'snapshot.create', sandbox_id, { name }, daytonaData);

      res.status(201).json({
        snapshot_id: daytonaData.id || uuid(),
        sandbox_id,
        name: name || `snapshot-${sandbox_id.slice(0, 8)}`,
        size_gb: sizeGb,
        cost: calculateSandboxCost(0, 0, 0, 'rtx4090', sizeGb),
      });
    } catch (err: any) {
      console.error('Snapshot create error:', err?.message);
      res.status(500).json({ error: 'Snapshot creation failed' });
    }
  });

  // POST /v1/compute/desktops — Provision desktop
  router.post('/desktops', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { name, image, gpu_type, resolution } = req.body;

    try {
      const response = await fetch(`${config.daytona.baseUrl}/desktops`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.daytona.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, image, gpu: gpu_type, resolution }),
      });

      const daytonaData = await response.json() as any;

      if (!response.ok) {
        return res.status(response.status).json({ error: daytonaData.message || 'Desktop provisioning failed' });
      }

      const desktopId = uuid();
      db.prepare(`
        INSERT INTO compute_sandboxes (sandbox_id, tenant_id, daytona_sandbox_id, status, resource_type, vcpu_count, memory_mb, gpu_type)
        VALUES (?, ?, ?, 'running', 'desktop', 2, 4096, ?)
      `).run(desktopId, tenantId, daytonaData.id || daytonaData.desktopId, gpu_type || '');

      db.prepare(`UPDATE tenant_wallets SET active_sandboxes = active_sandboxes + 1, updated_at = datetime('now') WHERE tenant_id = ?`).run(tenantId);

      await writeAuditEntry(db, tenantId, 'desktop.create', desktopId, req.body, daytonaData);

      res.status(201).json({
        desktop_id: desktopId,
        daytona_id: daytonaData.id || daytonaData.desktopId,
        status: 'running',
        vnc_url: daytonaData.vncUrl || '',
        webrtc_url: daytonaData.webrtcUrl || '',
        gpu_type: gpu_type || null,
      });
    } catch (err: any) {
      console.error('Desktop provisioning error:', err?.message);
      res.status(500).json({ error: 'Desktop provisioning failed' });
    }
  });

  // GET /v1/compute/sandboxes/:sandbox_id/logs/stream — SSE log stream
  router.get('/sandboxes/:sandbox_id/logs/stream', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { sandbox_id } = req.params;

    const sandbox = db.prepare(`
      SELECT * FROM compute_sandboxes WHERE sandbox_id = ? AND tenant_id = ?
    `).get(sandbox_id) as any;

    if (!sandbox) return res.status(404).json({ error: 'Sandbox not found' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const response = await fetch(`${config.daytona.baseUrl}/sandboxes/${sandbox.daytona_sandbox_id}/logs/stream`, {
        headers: { 'Authorization': `Bearer ${config.daytona.apiKey}` },
      });

      if (!response.ok || !response.body) {
        res.write(`data: ${JSON.stringify({ error: 'Failed to connect to log stream' })}\n\n`);
        res.end();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      req.on('close', () => {
        reader.cancel();
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        res.write(`data: ${chunk}\n\n`);
      }
    } catch (err: any) {
      console.error('Log stream error:', err?.message);
      res.write(`data: ${JSON.stringify({ error: 'Log stream connection failed' })}\n\n`);
    }

    res.end();
  });

  // GET /v1/compute/sandboxes — List sandboxes
  router.get('/sandboxes', (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const sandboxes = db.prepare(`
      SELECT sandbox_id, daytona_sandbox_id, status, resource_type, vcpu_count, memory_mb, gpu_type, created_at, stopped_at
      FROM compute_sandboxes WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 50
    `).all(tenantId);

    res.json({ data: sandboxes });
  });

  // DELETE /v1/compute/sandboxes/:sandbox_id — Stop & destroy sandbox
  router.delete('/sandboxes/:sandbox_id', async (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const { sandbox_id } = req.params;

    const sandbox = db.prepare(`
      SELECT * FROM compute_sandboxes WHERE sandbox_id = ? AND tenant_id = ?
    `).get(sandbox_id) as any;

    if (!sandbox) return res.status(404).json({ error: 'Sandbox not found' });

    try {
      await fetch(`${config.daytona.baseUrl}/sandboxes/${sandbox.daytona_sandbox_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${config.daytona.apiKey}` },
      });

      db.prepare(`
        UPDATE compute_sandboxes SET status = 'destroyed', stopped_at = datetime('now') WHERE sandbox_id = ?
      `).run(sandbox_id);

      db.prepare(`
        UPDATE tenant_wallets SET active_sandboxes = (SELECT COUNT(*) FROM compute_sandboxes WHERE tenant_id = ? AND status IN ('running', 'provisioning')), updated_at = datetime('now')
        WHERE tenant_id = ?
      `).run(tenantId, tenantId);

      await writeAuditEntry(db, tenantId, 'sandbox.destroy', sandbox_id, {}, {});

      res.json({ sandbox_id, status: 'destroyed' });
    } catch (err: any) {
      console.error('Sandbox destroy error:', err?.message);
      res.status(500).json({ error: 'Failed to destroy sandbox' });
    }
  });

  // GET /v1/compute/usage — Get usage summary
  router.get('/usage', (req: Request, res: Response) => {
    const tenantId = (req as any).tenantId;
    const wallet = db.prepare(`SELECT * FROM tenant_wallets WHERE tenant_id = ?`).get(tenantId) as any;

    const usage = db.prepare(`
      SELECT resource_type, SUM(units_consumed) as total_units, SUM(daytona_wholesale_cost) as total_wholesale, SUM(apipoints_retail_charged) as total_retail
      FROM compute_usage_ledger WHERE tenant_id = ? AND timestamp >= date('now', 'start of month')
      GROUP BY resource_type
    `).all(tenantId);

    res.json({
      tenant_id: tenantId,
      tier: wallet?.tier || 'free',
      credit_balance_usd: wallet?.credit_balance_usd || 0,
      monthly_spend_cap_usd: wallet?.monthly_spend_cap_usd || 0,
      monthly_usage_usd: wallet?.monthly_usage_usd || 0,
      active_sandboxes: wallet?.active_sandboxes || 0,
      usage_by_resource: usage,
    });
  });

  return router;
}

async function writeAuditEntry(db: Database.Database, tenantId: string, action: string, resourceId: string, input: any, output: any) {
  const crypto = require('crypto');
  const inputHash = crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const outputHash = crypto.createHash('sha256').update(JSON.stringify(output)).digest('hex');

  db.prepare(`
    INSERT INTO compute_audit_log (tenant_id, action, resource_id, input_hash, output_hash)
    VALUES (?, ?, ?, ?, ?)
  `).run(tenantId, action, resourceId, inputHash, outputHash);
}
