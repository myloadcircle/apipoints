import { APIPointsCompute } from './client';
import type { SandboxData, CodeRunResult } from './types';

export class Sandbox {
  private client: APIPointsCompute;
  public sandboxId: string;
  public daytonaId?: string;
  public status: string;
  public vcpuCount: number;
  public memoryMb: number;
  public gpuType?: string;

  constructor(client: APIPointsCompute, data: SandboxData) {
    this.client = client;
    this.sandboxId = data.sandbox_id;
    this.daytonaId = data.daytona_id || data.daytona_sandbox_id;
    this.status = data.status;
    this.vcpuCount = data.vcpu_count;
    this.memoryMb = data.memory_mb;
    this.gpuType = data.gpu_type;
  }

  async runCode(code: string, language: string = 'python', timeout: number = 30): Promise<CodeRunResult> {
    const res = await fetch(
      `${(this.client as any).baseUrl}/v1/compute/sandboxes/${this.sandboxId}/code-run`,
      {
        method: 'POST',
        headers: {
          'X-APIPOINTS-Key': (this.client as any).apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language, timeout }),
      }
    );

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error.error || `Code execution failed: ${res.status}`);
    }

    return res.json() as Promise<CodeRunResult>;
  }

  logs(): ReadableStream<string> {
    return this.client.stream(`/v1/compute/sandboxes/${this.sandboxId}/logs/stream`);
  }

  async snapshot(name?: string): Promise<any> {
    const res = await fetch(
      `${(this.client as any).baseUrl}/v1/compute/snapshots`,
      {
        method: 'POST',
        headers: {
          'X-APIPOINTS-Key': (this.client as any).apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sandbox_id: this.sandboxId, name }),
      }
    );
    return res.json();
  }

  async destroy(): Promise<void> {
    await fetch(
      `${(this.client as any).baseUrl}/v1/compute/sandboxes/${this.sandboxId}`,
      {
        method: 'DELETE',
        headers: { 'X-APIPOINTS-Key': (this.client as any).apiKey },
      }
    );
    this.status = 'destroyed';
  }
}
