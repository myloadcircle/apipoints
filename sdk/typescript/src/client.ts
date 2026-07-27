import { Sandbox } from './sandbox';
import type { CreateSandboxOptions, SandboxData, UsageSummary } from './types';

export class APIPointsCompute {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://apipoints-worker.francis-e3b.workers.dev') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'X-APIPOINTS-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error.error || `API error: ${res.status}`);
    }

    return res.json() as Promise<T>;
  }

  async createSandbox(options: CreateSandboxOptions = {}): Promise<Sandbox> {
    const data = await this.request<SandboxData>('POST', '/v1/compute/sandboxes', options);
    return new Sandbox(this, data);
  }

  async listSandboxes(): Promise<SandboxData[]> {
    const data = await this.request<{ data: SandboxData[] }>('GET', '/v1/compute/sandboxes');
    return data.data;
  }

  async getSandbox(sandboxId: string): Promise<Sandbox> {
    const sandboxes = await this.listSandboxes();
    const found = sandboxes.find(s => s.sandbox_id === sandboxId);
    if (!found) throw new Error(`Sandbox ${sandboxId} not found`);
    return new Sandbox(this, found);
  }

  async getUsage(): Promise<UsageSummary> {
    return this.request<UsageSummary>('GET', '/v1/compute/usage');
  }

  async createDesktop(options: { name?: string; image?: string; gpu_type?: string; resolution?: string } = {}): Promise<any> {
    return this.request<any>('POST', '/v1/compute/desktops', options);
  }

  stream(path: string): ReadableStream<string> {
    const controller = new AbortController();
    const baseUrl = this.baseUrl;
    const apiKey = this.apiKey;

    return new ReadableStream({
      async start(controller) {
        try {
          const res = await fetch(`${baseUrl}${path}`, {
            headers: { 'X-APIPOINTS-Key': apiKey },
            signal: controller.signal,
          });

          if (!res.ok || !res.body) {
            controller.error(new Error(`Stream error: ${res.status}`));
            return;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            for (const line of text.split('\n')) {
              if (line.startsWith('data: ')) {
                controller.enqueue(line.slice(6));
              }
            }
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') controller.error(err);
        } finally {
          controller.close();
        }
      },
      cancel() {
        controller.abort();
      },
    });
  }
}
