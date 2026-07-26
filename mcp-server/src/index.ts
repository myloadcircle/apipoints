#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_BASE = 'https://apipoints-worker.francis-e3b.workers.dev';
const API_KEY = process.env.APIPOINTS_API_KEY || process.env.API_KEY || '';

if (!API_KEY) {
  console.error('Error: APIPOINTS_API_KEY environment variable is required');
  process.exit(1);
}

async function apiFetch(endpoint: string, params: Record<string, any> = {}) {
  const url = new URL(endpoint, API_BASE);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: { 'x-api-key': API_KEY },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

const server = new McpServer({
  name: 'apipoints',
  version: '1.0.0',
});

server.tool(
  'get_llm_costs',
  'Get real-time LLM pricing across all providers. Filter by provider, model, or cost limits.',
  {
    provider: z.string().optional().describe('Filter by provider slug (e.g. openai, anthropic, google)'),
    model: z.string().optional().describe('Filter by model name (partial match)'),
    max_input_cost: z.number().optional().describe('Max input cost per 1M tokens'),
    max_output_cost: z.number().optional().describe('Max output cost per 1M tokens'),
  },
  async (args) => {
    const data = await apiFetch('/v1/llm-costs', args as Record<string, any>);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      }],
    };
  }
);

server.tool(
  'get_model_benchmarks',
  'Get model benchmark scores (MMLU, HumanEval, MATH, GPQA, etc.). Filter by provider, model, or minimum scores.',
  {
    provider: z.string().optional().describe('Filter by provider'),
    model: z.string().optional().describe('Filter by model name'),
    min_mmlu: z.number().optional().describe('Minimum MMLU score'),
    min_human_eval: z.number().optional().describe('Minimum HumanEval score'),
  },
  async (args) => {
    const data = await apiFetch('/v1/model-benchmarks', args as Record<string, any>);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      }],
    };
  }
);

server.tool(
  'get_deprecations',
  'Get active and upcoming model deprecations. Filter by provider or status.',
  {
    provider: z.string().optional().describe('Filter by provider'),
    status: z.enum(['announced', 'in_progress', 'completed']).optional().describe('Filter by status'),
  },
  async (args) => {
    const data = await apiFetch('/v1/deprecations', args as Record<string, any>);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      }],
    };
  }
);

server.tool(
  'get_providers',
  'Get all tracked LLM providers with their capabilities and endpoints.',
  {
    provider: z.string().optional().describe('Filter by provider slug'),
  },
  async (args) => {
    const data = await apiFetch('/v1/providers', args as Record<string, any>);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      }],
    };
  }
);

server.tool(
  'get_changes',
  'Get recent pricing changes, new model releases, and deprecation announcements.',
  {
    provider: z.string().optional().describe('Filter by provider'),
    type: z.enum(['price_decrease', 'price_increase', 'new_model', 'deprecation', 'feature_update']).optional().describe('Filter by change type'),
    since: z.string().optional().describe('Only changes after this date (YYYY-MM-DD)'),
  },
  async (args) => {
    const data = await apiFetch('/v1/changes', args as Record<string, any>);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      }],
    };
  }
);

server.tool(
  'get_recommendations',
  'Get cost optimization recommendations for specific use cases (e.g. code generation, customer support, data analysis).',
  {
    use_case: z.string().optional().describe('Use case (e.g. "code generation", "customer support", "RAG")'),
  },
  async (args) => {
    const data = await apiFetch('/v1/recommend', args as Record<string, any>);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      }],
    };
  }
);

server.tool(
  'calculate_cost',
  'Calculate the estimated cost for a specific model and token count.',
  {
    model: z.string().describe('Model name (e.g. gpt-4o, claude-sonnet-4)'),
    input_tokens: z.number().default(1000000).describe('Number of input tokens (default: 1M)'),
    output_tokens: z.number().default(100000).describe('Number of output tokens (default: 100K)'),
  },
  async (args) => {
    const data = await apiFetch('/v1/calculate', args as Record<string, any>);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('APIPoints MCP server running');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
