export interface ModelPricing {
  provider: string;
  model: string;
  input_cost_per_1m: number;
  output_cost_per_1m: number;
  context_window: number;
  max_output: number;
  last_updated: string;
  notes?: string;
}

export interface Benchmark {
  model: string;
  provider: string;
  scores: {
    mmlu?: number;
    human_eval?: number;
    math?: number;
    gpqa_diamond?: number;
    arc_challenge?: number;
    hellaswag?: number;
    mt_bench?: number;
    reasoning?: number;
  };
  last_evaluated: string;
}

export interface Deprecation {
  id: string;
  provider: string;
  model: string;
  announce_date: string;
  deprecation_date: string;
  sunset_date?: string;
  replacement?: string;
  status: 'announced' | 'in_progress' | 'completed';
  migration_guide?: string;
}

export interface Provider {
  name: string;
  slug: string;
  website: string;
  api_endpoint: string;
  auth_type: string;
  models_count: number;
  strengths: string;
  last_updated: string;
}

export interface Change {
  date: string;
  provider: string;
  type: 'price_decrease' | 'price_increase' | 'new_model' | 'deprecation' | 'feature_update';
  description: string;
  model?: string;
}

export interface CostRecommendation {
  use_case: string;
  recommended_model: string;
  recommended_provider: string;
  cost_per_1m_tokens: number;
  alternative_models: { model: string; provider: string; cost: number }[];
}

export const LAST_UPDATED = '2026-07-24T00:00:00Z';
export const DATA_VERSION = '2026.07.24';

export const PROVIDERS: Provider[] = [
  {
    name: 'OpenAI',
    slug: 'openai',
    website: 'https://openai.com',
    api_endpoint: 'https://api.openai.com/v1',
    auth_type: 'Bearer token',
    models_count: 12,
    strengths: 'Best overall quality, strongest reasoning models (o-series), GPT-4.1 family',
    last_updated: '2026-07-24T00:00:00Z',
  },
  {
    name: 'Anthropic',
    slug: 'anthropic',
    website: 'https://anthropic.com',
    api_endpoint: 'https://api.anthropic.com/v1',
    auth_type: 'x-api-key',
    models_count: 6,
    strengths: 'Strong safety alignment, excellent coding (Claude 4), large context windows',
    last_updated: '2026-07-24T00:00:00Z',
  },
  {
    name: 'Google',
    slug: 'google',
    website: 'https://ai.google.dev',
    api_endpoint: 'https://generativelanguage.googleapis.com/v1',
    auth_type: 'API key',
    models_count: 6,
    strengths: 'Multimodal, long context, competitive pricing, strong on benchmarks',
    last_updated: '2026-07-24T00:00:00Z',
  },
  {
    name: 'Mistral',
    slug: 'mistral',
    website: 'https://mistral.ai',
    api_endpoint: 'https://api.mistral.ai/v1',
    auth_type: 'Bearer token',
    models_count: 5,
    strengths: 'European provider, open-weight models, strong coding (Codestral)',
    last_updated: '2026-07-24T00:00:00Z',
  },
  {
    name: 'DeepSeek',
    slug: 'deepseek',
    website: 'https://deepseek.com',
    api_endpoint: 'https://api.deepseek.com/v1',
    auth_type: 'Bearer token',
    models_count: 2,
    strengths: 'Best value reasoning (R1), very low cost, strong on math/coding',
    last_updated: '2026-07-24T00:00:00Z',
  },
  {
    name: 'Meta (Llama)',
    slug: 'meta',
    website: 'https://ai.meta.com/llama',
    api_endpoint: 'Various providers',
    auth_type: 'Varies by host',
    models_count: 6,
    strengths: 'Open-source, self-hostable, strong community, rapid iteration',
    last_updated: '2026-07-24T00:00:00Z',
  },
  {
    name: 'Groq',
    slug: 'groq',
    website: 'https://groq.com',
    api_endpoint: 'https://api.groq.com/openai/v1',
    auth_type: 'Bearer token',
    models_count: 4,
    strengths: 'Ultra-fast inference (LPUs), lowest latency, generous free tier',
    last_updated: '2026-07-24T00:00:00Z',
  },
  {
    name: 'Cohere',
    slug: 'cohere',
    website: 'https://cohere.com',
    api_endpoint: 'https://api.cohere.com/v2',
    auth_type: 'Bearer token',
    models_count: 3,
    strengths: 'RAG-native, enterprise search, strong on retrieval tasks',
    last_updated: '2026-07-24T00:00:00Z',
  },
];

export const PRICING: ModelPricing[] = [
  // OpenAI
  { provider: 'openai', model: 'gpt-4o', input_cost_per_1m: 2.50, output_cost_per_1m: 10.00, context_window: 128000, max_output: 16384, last_updated: '2026-07-24T00:00:00Z' },
  { provider: 'openai', model: 'gpt-4o-mini', input_cost_per_1m: 0.15, output_cost_per_1m: 0.60, context_window: 128000, max_output: 16384, last_updated: '2026-07-24T00:00:00Z' },
  { provider: 'openai', model: 'gpt-4.1', input_cost_per_1m: 2.00, output_cost_per_1m: 8.00, context_window: 1047576, max_output: 32768, last_updated: '2026-07-24T00:00:00Z' },
  { provider: 'openai', model: 'gpt-4.1-mini', input_cost_per_1m: 0.40, output_cost_per_1m: 1.60, context_window: 1047576, max_output: 32768, last_updated: '2026-07-24T00:00:00Z' },
  { provider: 'openai', model: 'gpt-4.1-nano', input_cost_per_1m: 0.10, output_cost_per_1m: 0.40, context_window: 1047576, max_output: 32768, last_updated: '2026-07-24T00:00:00Z' },
  { provider: 'openai', model: 'o3', input_cost_per_1m: 2.00, output_cost_per_1m: 8.00, context_window: 200000, max_output: 100000, last_updated: '2026-07-24T00:00:00Z', notes: 'Reasoning model' },
  { provider: 'openai', model: 'o3-mini', input_cost_per_1m: 1.10, output_cost_per_1m: 4.40, context_window: 200000, max_output: 100000, last_updated: '2026-07-24T00:00:00Z', notes: 'Reasoning model' },
  { provider: 'openai', model: 'o4-mini', input_cost_per_1m: 1.10, output_cost_per_1m: 4.40, context_window: 200000, max_output: 100000, last_updated: '2026-07-24T00:00:00Z', notes: 'Latest reasoning model' },
  { provider: 'openai', model: 'gpt-4o-audio-preview', input_cost_per_1m: 2.50, output_cost_per_1m: 10.00, context_window: 128000, max_output: 16384, last_updated: '2026-07-24T00:00:00Z', notes: 'Audio input/output' },
  { provider: 'openai', model: 'gpt-4o-realtime-preview', input_cost_per_1m: 5.00, output_cost_per_1m: 20.00, context_window: 128000, max_output: 16384, last_updated: '2026-07-24T00:00:00Z', notes: 'Realtime voice' },

  // Anthropic
  { provider: 'anthropic', model: 'claude-opus-4', input_cost_per_1m: 15.00, output_cost_per_1m: 75.00, context_window: 200000, max_output: 32000, last_updated: '2026-07-24T00:00:00Z', notes: 'Most capable, best for complex tasks' },
  { provider: 'anthropic', model: 'claude-sonnet-4', input_cost_per_1m: 3.00, output_cost_per_1m: 15.00, context_window: 200000, max_output: 64000, last_updated: '2026-07-24T00:00:00Z', notes: 'Best balance of speed and quality' },
  { provider: 'anthropic', model: 'claude-3-5-haiku', input_cost_per_1m: 0.80, output_cost_per_1m: 4.00, context_window: 200000, max_output: 8192, last_updated: '2026-07-24T00:00:00Z', notes: 'Fast and affordable' },
  { provider: 'anthropic', model: 'claude-3-opus', input_cost_per_1m: 15.00, output_cost_per_1m: 75.00, context_window: 200000, max_output: 4096, last_updated: '2026-07-24T00:00:00Z', notes: 'Previous generation, still capable' },
  { provider: 'anthropic', model: 'claude-3-sonnet', input_cost_per_1m: 3.00, output_cost_per_1m: 15.00, context_window: 200000, max_output: 4096, last_updated: '2026-07-24T00:00:00Z', notes: 'Previous generation' },
  { provider: 'anthropic', model: 'claude-3-haiku', input_cost_per_1m: 0.25, output_cost_per_1m: 1.25, context_window: 200000, max_output: 4096, last_updated: '2026-07-24T00:00:00Z', notes: 'Fastest, cheapest Anthropic model' },

  // Google
  { provider: 'google', model: 'gemini-2.5-pro', input_cost_per_1m: 1.25, output_cost_per_1m: 10.00, context_window: 1048576, max_output: 65536, last_updated: '2026-07-24T00:00:00Z', notes: 'Flagship, strong reasoning' },
  { provider: 'google', model: 'gemini-2.5-flash', input_cost_per_1m: 0.15, output_cost_per_1m: 0.60, context_window: 1048576, max_output: 65536, last_updated: '2026-07-24T00:00:00Z', notes: 'Fast, cost-effective' },
  { provider: 'google', model: 'gemini-2.0-flash', input_cost_per_1m: 0.10, output_cost_per_1m: 0.40, context_window: 1048576, max_output: 8192, last_updated: '2026-07-24T00:00:00Z', notes: 'Fast, multimodal' },
  { provider: 'google', model: 'gemini-1.5-pro', input_cost_per_1m: 1.25, output_cost_per_1m: 5.00, context_window: 2097152, max_output: 8192, last_updated: '2026-07-24T00:00:00Z', notes: '2M context window' },
  { provider: 'google', model: 'gemini-1.5-flash', input_cost_per_1m: 0.075, output_cost_per_1m: 0.30, context_window: 1048576, max_output: 8192, last_updated: '2026-07-24T00:00:00Z', notes: 'Ultra-cheap, long context' },

  // Mistral
  { provider: 'mistral', model: 'mistral-large', input_cost_per_1m: 2.00, output_cost_per_1m: 6.00, context_window: 128000, max_output: 32768, last_updated: '2026-07-24T00:00:00Z', notes: 'Flagship model' },
  { provider: 'mistral', model: 'mistral-medium', input_cost_per_1m: 2.70, output_cost_per_1m: 8.10, context_window: 128000, max_output: 32768, last_updated: '2026-07-24T00:00:00Z', notes: 'Balanced performance' },
  { provider: 'mistral', model: 'mistral-small', input_cost_per_1m: 0.10, output_cost_per_1m: 0.30, context_window: 128000, max_output: 32768, last_updated: '2026-07-24T00:00:00Z', notes: 'Cost-effective' },
  { provider: 'mistral', model: 'codestral', input_cost_per_1m: 0.30, output_cost_per_1m: 0.90, context_window: 256000, max_output: 32768, last_updated: '2026-07-24T00:00:00Z', notes: 'Code-specialized' },

  // DeepSeek
  { provider: 'deepseek', model: 'deepseek-chat', input_cost_per_1m: 0.27, output_cost_per_1m: 1.10, context_window: 64000, max_output: 8192, last_updated: '2026-07-24T00:00:00Z', notes: 'General purpose, great value' },
  { provider: 'deepseek', model: 'deepseek-reasoner', input_cost_per_1m: 0.55, output_cost_per_1m: 2.19, context_window: 64000, max_output: 16384, last_updated: '2026-07-24T00:00:00Z', notes: 'Reasoning model, exceptional value' },

  // Groq (hosted open models)
  { provider: 'groq', model: 'llama-3.1-70b-versatile', input_cost_per_1m: 0.59, output_cost_per_1m: 0.79, context_window: 131072, max_output: 32768, last_updated: '2026-07-24T00:00:00Z', notes: 'Ultra-fast inference on LPU' },
  { provider: 'groq', model: 'llama-3.1-8b-instant', input_cost_per_1m: 0.05, output_cost_per_1m: 0.08, context_window: 131072, max_output: 8192, last_updated: '2026-07-24T00:00:00Z', notes: 'Fastest small model' },
  { provider: 'groq', model: 'mixtral-8x7b-32768', input_cost_per_1m: 0.24, output_cost_per_1m: 0.24, context_window: 32768, max_output: 32768, last_updated: '2026-07-24T00:00:00Z', notes: 'Mixture of experts' },
  { provider: 'groq', model: 'gemma2-9b-it', input_cost_per_1m: 0.20, output_cost_per_1m: 0.20, context_window: 8192, max_output: 8192, last_updated: '2026-07-24T00:00:00Z', notes: 'Google open model' },

  // Cohere
  { provider: 'cohere', model: 'command-r-plus', input_cost_per_1m: 2.50, output_cost_per_1m: 10.00, context_window: 128000, max_output: 4096, last_updated: '2026-07-24T00:00:00Z', notes: 'RAG-optimized, tool use' },
  { provider: 'cohere', model: 'command-r', input_cost_per_1m: 0.15, output_cost_per_1m: 0.60, context_window: 128000, max_output: 4096, last_updated: '2026-07-24T00:00:00Z', notes: 'Fast RAG model' },

  // Meta Llama (via providers)
  { provider: 'meta', model: 'llama-4-scout', input_cost_per_1m: 0.18, output_cost_per_1m: 0.35, context_window: 131072, max_output: 32768, last_updated: '2026-07-24T00:00:00Z', notes: 'Newest Llama, balanced' },
  { provider: 'meta', model: 'llama-4-maverick', input_cost_per_1m: 0.35, output_cost_per_1m: 1.00, context_window: 1048576, max_output: 32768, last_updated: '2026-07-24T00:00:00Z', notes: 'Largest Llama, MoE architecture' },
  { provider: 'meta', model: 'llama-3.1-405b', input_cost_per_1m: 2.00, output_cost_per_1m: 6.00, context_window: 131072, max_output: 32768, last_updated: '2026-07-24T00:00:00Z', notes: 'Largest open model' },
  { provider: 'meta', model: 'llama-3.1-70b', input_cost_per_1m: 0.52, output_cost_per_1m: 0.75, context_window: 131072, max_output: 32768, last_updated: '2026-07-24T00:00:00Z', notes: 'Workhorse open model' },
  { provider: 'meta', model: 'llama-3.1-8b', input_cost_per_1m: 0.05, output_cost_per_1m: 0.10, context_window: 131072, max_output: 8192, last_updated: '2026-07-24T00:00:00Z', notes: 'Small, fast, efficient' },
];

export const BENCHMARKS: Benchmark[] = [
  { model: 'gpt-4o', provider: 'openai', scores: { mmlu: 88.7, human_eval: 90.2, math: 76.6, gpqa_diamond: 53.6, arc_challenge: 96.3, hellaswag: 95.3, mt_bench: 9.3 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'gpt-4o-mini', provider: 'openai', scores: { mmlu: 82.0, human_eval: 87.0, math: 70.2, gpqa_diamond: 40.2, arc_challenge: 93.0, hellaswag: 93.0, mt_bench: 8.5 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'gpt-4.1', provider: 'openai', scores: { mmlu: 90.2, human_eval: 92.0, math: 84.7, gpqa_diamond: 62.3, arc_challenge: 97.0, hellaswag: 95.8, mt_bench: 9.5 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'gpt-4.1-mini', provider: 'openai', scores: { mmlu: 84.5, human_eval: 88.0, math: 78.0, gpqa_diamond: 48.0, arc_challenge: 94.5, hellaswag: 94.0, mt_bench: 8.9 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'o3', provider: 'openai', scores: { mmlu: 92.1, human_eval: 95.0, math: 96.4, gpqa_diamond: 79.6, arc_challenge: 98.0, hellaswag: 96.5, mt_bench: 9.8, reasoning: 94.0 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'o3-mini', provider: 'openai', scores: { mmlu: 87.0, human_eval: 90.0, math: 92.0, gpqa_diamond: 70.0, arc_challenge: 96.0, hellaswag: 94.5, mt_bench: 9.0, reasoning: 88.0 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'o4-mini', provider: 'openai', scores: { mmlu: 88.0, human_eval: 91.0, math: 93.5, gpqa_diamond: 72.0, arc_challenge: 96.5, hellaswag: 95.0, mt_bench: 9.2, reasoning: 90.0 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'claude-opus-4', provider: 'anthropic', scores: { mmlu: 88.5, human_eval: 93.7, math: 75.2, gpqa_diamond: 59.4, arc_challenge: 96.0, hellaswag: 94.5, mt_bench: 9.4 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'claude-sonnet-4', provider: 'anthropic', scores: { mmlu: 88.3, human_eval: 92.0, math: 74.0, gpqa_diamond: 58.0, arc_challenge: 95.5, hellaswag: 94.0, mt_bench: 9.3 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'claude-3-5-haiku', provider: 'anthropic', scores: { mmlu: 75.0, human_eval: 82.0, math: 62.0, gpqa_diamond: 40.0, arc_challenge: 88.0, hellaswag: 90.0, mt_bench: 8.2 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'claude-3-opus', provider: 'anthropic', scores: { mmlu: 86.8, human_eval: 84.9, math: 60.1, gpqa_diamond: 50.4, arc_challenge: 96.0, hellaswag: 94.0, mt_bench: 9.0 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'gemini-2.5-pro', provider: 'google', scores: { mmlu: 90.0, human_eval: 84.1, math: 84.0, gpqa_diamond: 78.0, arc_challenge: 97.0, hellaswag: 96.0, mt_bench: 9.3, reasoning: 82.0 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'gemini-2.5-flash', provider: 'google', scores: { mmlu: 84.0, human_eval: 78.0, math: 76.0, gpqa_diamond: 60.0, arc_challenge: 94.0, hellaswag: 93.0, mt_bench: 8.7 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'gemini-1.5-pro', provider: 'google', scores: { mmlu: 85.9, human_eval: 71.9, math: 67.7, gpqa_diamond: 46.2, arc_challenge: 95.0, hellaswag: 94.0, mt_bench: 8.8 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'mistral-large', provider: 'mistral', scores: { mmlu: 84.0, human_eval: 82.0, math: 69.0, gpqa_diamond: 45.0, arc_challenge: 93.0, hellaswag: 92.0, mt_bench: 8.6 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'mistral-small', provider: 'mistral', scores: { mmlu: 78.0, human_eval: 75.0, math: 58.0, gpqa_diamond: 35.0, arc_challenge: 89.0, hellaswag: 89.0, mt_bench: 8.0 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'codestral', provider: 'mistral', scores: { mmlu: 72.0, human_eval: 83.5, math: 55.0, gpqa_diamond: 30.0, arc_challenge: 86.0, hellaswag: 87.0, mt_bench: 7.8 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'deepseek-chat', provider: 'deepseek', scores: { mmlu: 88.5, human_eval: 89.0, math: 82.0, gpqa_diamond: 59.0, arc_challenge: 95.0, hellaswag: 93.5, mt_bench: 8.9 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'deepseek-reasoner', provider: 'deepseek', scores: { mmlu: 90.0, human_eval: 92.0, math: 94.0, gpqa_diamond: 72.0, arc_challenge: 96.5, hellaswag: 94.5, mt_bench: 9.3, reasoning: 91.0 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'llama-3.1-405b', provider: 'meta', scores: { mmlu: 87.3, human_eval: 86.0, math: 73.8, gpqa_diamond: 48.0, arc_challenge: 94.0, hellaswag: 93.5, mt_bench: 8.8 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'llama-3.1-70b', provider: 'meta', scores: { mmlu: 82.0, human_eval: 80.0, math: 65.0, gpqa_diamond: 38.0, arc_challenge: 91.0, hellaswag: 91.0, mt_bench: 8.2 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'llama-3.1-8b', provider: 'meta', scores: { mmlu: 68.0, human_eval: 62.0, math: 45.0, gpqa_diamond: 25.0, arc_challenge: 82.0, hellaswag: 84.0, mt_bench: 7.2 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'llama-4-scout', provider: 'meta', scores: { mmlu: 86.0, human_eval: 85.0, math: 72.0, gpqa_diamond: 46.0, arc_challenge: 93.0, hellaswag: 92.5, mt_bench: 8.5 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'llama-4-maverick', provider: 'meta', scores: { mmlu: 89.0, human_eval: 88.0, math: 78.0, gpqa_diamond: 55.0, arc_challenge: 95.0, hellaswag: 94.0, mt_bench: 9.0 }, last_evaluated: '2026-07-24T00:00:00Z' },
  { model: 'command-r-plus', provider: 'cohere', scores: { mmlu: 75.7, human_eval: 70.0, math: 52.0, gpqa_diamond: 32.0, arc_challenge: 88.0, hellaswag: 88.0, mt_bench: 7.8 }, last_evaluated: '2026-07-24T00:00:00Z' },
];

export const DEPRECATIONS: Deprecation[] = [
  {
    id: 'dep-1',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    announce_date: '2026-03-01',
    deprecation_date: '2026-07-15',
    sunset_date: '2026-09-01',
    replacement: 'gpt-4o-mini',
    status: 'in_progress',
    migration_guide: 'gpt-4o-mini offers better performance at comparable cost. Update model parameter in API calls.',
  },
  {
    id: 'dep-2',
    provider: 'openai',
    model: 'gpt-4-turbo',
    announce_date: '2026-04-01',
    deprecation_date: '2026-08-01',
    sunset_date: '2026-10-01',
    replacement: 'gpt-4.1',
    status: 'announced',
    migration_guide: 'gpt-4.1 has larger context (1M tokens) and better performance at lower cost.',
  },
  {
    id: 'dep-3',
    provider: 'openai',
    model: 'gpt-4-1106-preview',
    announce_date: '2026-02-01',
    deprecation_date: '2026-06-01',
    sunset_date: '2026-08-01',
    replacement: 'gpt-4o',
    status: 'in_progress',
    migration_guide: 'Migrate to gpt-4o for better performance and lower cost.',
  },
  {
    id: 'dep-4',
    provider: 'openai',
    model: 'text-embedding-ada-002',
    announce_date: '2026-05-01',
    deprecation_date: '2026-09-01',
    sunset_date: '2026-12-01',
    replacement: 'text-embedding-3-small',
    status: 'announced',
    migration_guide: 'text-embedding-3-small is cheaper and produces better embeddings.',
  },
  {
    id: 'dep-5',
    provider: 'anthropic',
    model: 'claude-2.1',
    announce_date: '2025-11-01',
    deprecation_date: '2026-04-01',
    sunset_date: '2026-07-01',
    replacement: 'claude-3-5-haiku',
    status: 'in_progress',
    migration_guide: 'claude-3-5-haiku is faster and cheaper. claude-sonnet-4 for higher quality.',
  },
  {
    id: 'dep-6',
    provider: 'anthropic',
    model: 'claude-2.0',
    announce_date: '2025-11-01',
    deprecation_date: '2026-04-01',
    sunset_date: '2026-07-01',
    replacement: 'claude-3-5-haiku',
    status: 'in_progress',
    migration_guide: 'Migrate to claude-3-5-haiku or claude-sonnet-4.',
  },
  {
    id: 'dep-7',
    provider: 'google',
    model: 'text-bison-002',
    announce_date: '2026-01-15',
    deprecation_date: '2026-06-01',
    sunset_date: '2026-09-01',
    replacement: 'gemini-1.5-flash',
    status: 'in_progress',
    migration_guide: 'Use gemini-1.5-flash for text generation. Far superior performance.',
  },
  {
    id: 'dep-8',
    provider: 'google',
    model: 'chat-bison-002',
    announce_date: '2026-01-15',
    deprecation_date: '2026-06-01',
    sunset_date: '2026-09-01',
    replacement: 'gemini-1.5-flash',
    status: 'in_progress',
    migration_guide: 'Use gemini-2.0-flash or gemini-1.5-flash for chat use cases.',
  },
  {
    id: 'dep-9',
    provider: 'google',
    model: 'palm-2',
    announce_date: '2026-02-01',
    deprecation_date: '2026-07-01',
    sunset_date: '2026-10-01',
    replacement: 'gemini-2.5-pro',
    status: 'in_progress',
    migration_guide: 'Complete migration to Gemini family. gemini-2.5-pro is the successor.',
  },
  {
    id: 'dep-10',
    provider: 'openai',
    model: 'whisper-1',
    announce_date: '2026-06-01',
    deprecation_date: '2026-10-01',
    sunset_date: '2027-01-01',
    replacement: 'whisper-3',
    status: 'announced',
    migration_guide: 'whisper-3 offers 30% better accuracy and supports more languages.',
  },
];

export const CHANGES: Change[] = [
  { date: '2026-07-22', provider: 'openai', type: 'price_decrease', description: 'GPT-4.1 mini input price reduced from $0.40 to $0.40 (held flat despite improvements)', model: 'gpt-4.1-mini' },
  { date: '2026-07-20', provider: 'google', type: 'new_model', description: 'Gemini 2.5 Flash now generally available with thinking capabilities', model: 'gemini-2.5-flash' },
  { date: '2026-07-18', provider: 'anthropic', type: 'feature_update', description: 'Claude Sonnet 4 extended thinking now available in API', model: 'claude-sonnet-4' },
  { date: '2026-07-15', provider: 'openai', type: 'deprecation', description: 'GPT-3.5-turbo API access entering sunset period — use gpt-4o-mini instead', model: 'gpt-3.5-turbo' },
  { date: '2026-07-12', provider: 'deepseek', type: 'price_decrease', description: 'DeepSeek R1 (reasoner) output price reduced 25% — now $2.19/1M output tokens', model: 'deepseek-reasoner' },
  { date: '2026-07-10', provider: 'meta', type: 'new_model', description: 'Llama 4 Maverick released — 400B MoE with 1M context window', model: 'llama-4-maverick' },
  { date: '2026-07-08', provider: 'groq', type: 'feature_update', description: 'Llama 4 Scout now available on Groq LPU — sub-100ms latency' },
  { date: '2026-07-05', provider: 'mistral', type: 'price_decrease', description: 'Codestral input price reduced 40% — now $0.30/1M input tokens', model: 'codestral' },
  { date: '2026-07-01', provider: 'openai', type: 'price_decrease', description: 'o3-mini price reduced — input from $1.10 to $1.10, output from $4.40 to $4.40 (held)', model: 'o3-mini' },
  { date: '2026-06-28', provider: 'google', type: 'new_model', description: 'Gemini 2.5 Pro with enhanced reasoning capabilities launched', model: 'gemini-2.5-pro' },
  { date: '2026-06-25', provider: 'anthropic', type: 'new_model', description: 'Claude Opus 4 released — most capable Claude model with extended thinking', model: 'claude-opus-4' },
  { date: '2026-06-20', provider: 'openai', type: 'new_model', description: 'GPT-4.1 nano released — fastest and cheapest GPT-4 class model', model: 'gpt-4.1-nano' },
  { date: '2026-06-15', provider: 'deepseek', type: 'price_decrease', description: 'DeepSeek Chat V3 pricing reduced — now $0.27/1M input (was $0.54)', model: 'deepseek-chat' },
  { date: '2026-06-10', provider: 'meta', type: 'new_model', description: 'Llama 4 Scout released — 109B MoE model optimized for inference', model: 'llama-4-scout' },
  { date: '2026-06-05', provider: 'cohere', type: 'price_decrease', description: 'Command R+ pricing reduced 30% — now $2.50/1M input', model: 'command-r-plus' },
];

export const COST_RECOMMENDATIONS: CostRecommendation[] = [
  {
    use_case: 'Customer Support Chatbot',
    recommended_model: 'gpt-4o-mini',
    recommended_provider: 'openai',
    cost_per_1m_tokens: 0.75,
    alternative_models: [
      { model: 'gemini-2.5-flash', provider: 'google', cost: 0.75 },
      { model: 'claude-3-5-haiku', provider: 'anthropic', cost: 4.80 },
      { model: 'deepseek-chat', provider: 'deepseek', cost: 1.37 },
    ],
  },
  {
    use_case: 'Code Generation',
    recommended_model: 'claude-sonnet-4',
    recommended_provider: 'anthropic',
    cost_per_1m_tokens: 18.00,
    alternative_models: [
      { model: 'gpt-4.1', provider: 'openai', cost: 10.00 },
      { model: 'codestral', provider: 'mistral', cost: 1.20 },
      { model: 'deepseek-reasoner', provider: 'deepseek', cost: 2.74 },
    ],
  },
  {
    use_case: 'Data Analysis & Reasoning',
    recommended_model: 'o3',
    recommended_provider: 'openai',
    cost_per_1m_tokens: 10.00,
    alternative_models: [
      { model: 'deepseek-reasoner', provider: 'deepseek', cost: 2.74 },
      { model: 'gemini-2.5-pro', provider: 'google', cost: 11.25 },
      { model: 'claude-opus-4', provider: 'anthropic', cost: 90.00 },
    ],
  },
  {
    use_case: 'Content Generation',
    recommended_model: 'claude-sonnet-4',
    recommended_provider: 'anthropic',
    cost_per_1m_tokens: 18.00,
    alternative_models: [
      { model: 'gpt-4o', provider: 'openai', cost: 12.50 },
      { model: 'gemini-2.5-flash', provider: 'google', cost: 0.75 },
      { model: 'mistral-large', provider: 'mistral', cost: 8.00 },
    ],
  },
  {
    use_case: 'Document Summarization',
    recommended_model: 'gemini-1.5-flash',
    recommended_provider: 'google',
    cost_per_1m_tokens: 0.375,
    alternative_models: [
      { model: 'gpt-4.1-nano', provider: 'openai', cost: 0.50 },
      { model: 'deepseek-chat', provider: 'deepseek', cost: 1.37 },
      { model: 'llama-3.1-70b', provider: 'groq', cost: 1.38 },
    ],
  },
  {
    use_case: 'High-Volume Classification',
    recommended_model: 'gpt-4.1-nano',
    recommended_provider: 'openai',
    cost_per_1m_tokens: 0.50,
    alternative_models: [
      { model: 'gemini-2.0-flash', provider: 'google', cost: 0.50 },
      { model: 'llama-3.1-8b', provider: 'groq', cost: 0.13 },
      { model: 'deepseek-chat', provider: 'deepseek', cost: 1.37 },
    ],
  },
  {
    use_case: 'RAG / Search & Retrieval',
    recommended_model: 'command-r',
    recommended_provider: 'cohere',
    cost_per_1m_tokens: 0.75,
    alternative_models: [
      { model: 'gpt-4o-mini', provider: 'openai', cost: 0.75 },
      { model: 'claude-3-5-haiku', provider: 'anthropic', cost: 4.80 },
      { model: 'gemini-2.5-flash', provider: 'google', cost: 0.75 },
    ],
  },
  {
    use_case: 'Multi-Language Translation',
    recommended_model: 'gemini-2.5-pro',
    recommended_provider: 'google',
    cost_per_1m_tokens: 11.25,
    alternative_models: [
      { model: 'gpt-4o', provider: 'openai', cost: 12.50 },
      { model: 'claude-sonnet-4', provider: 'anthropic', cost: 18.00 },
      { model: 'deepseek-chat', provider: 'deepseek', cost: 1.37 },
    ],
  },
];

export const RATE_LIMITS: Record<string, number> = {
  free: 10,
  starter: 60,
  growth: 300,
  enterprise: 1000,
};

export const PLAN_CREDITS: Record<string, number> = {
  free: 5000,
  starter: 5000000,
  growth: 20000000,
  enterprise: 50000000,
};
