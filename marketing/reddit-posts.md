# Reddit Post Drafts

## r/LocalLLaMA

**Title:** I built a free API that tracks LLM pricing across 38 models so you don't have to

**Body:**

Been spending way too much time manually checking pricing pages across OpenAI, Anthropic, Google, DeepSeek, Mistral, etc. Every time I need to pick a model for a new feature, I'm cross-referencing 5 different pricing pages.

So I built APIPoints — a free API that tracks real-time pricing, benchmarks, and deprecation notices for 38 LLMs across 8 providers.

**What it does:**
- `/v1/llm-costs` — live pricing per 1M tokens (input + output)
- `/v1/model-benchmarks` — MMLU, HumanEval, MATH, GPQA scores
- `/v1/recommend` — tell it your use case, get cost-optimized alternatives
- `/v1/calculate` — exact cost calculator for your token volume

**Free tier:** 5,000 credits/month, no credit card required.

Also built an MCP server so your local agents can query pricing directly:
```
npx -y @apipoints/mcp-server
```

https://apipoints.dev

Would love feedback — especially on the benchmark data accuracy. Working on adding LMSYS Arena scores next.

---

## r/MachineLearning

**Title:** APIPoints: Real-time LLM pricing and benchmark comparison API (38 models, 8 providers)

**Body:**

I've been working on a tool for teams building with LLMs who need cost visibility. APIPoints provides:

- Real-time pricing for 38 models across OpenAI, Anthropic, Google, Mistral, DeepSeek, Meta, Groq, Cohere
- Normalized benchmark scores (MMLU, HumanEval, MATH, GPQA, MT-Bench) on a 0-100 scale
- Deprecation alerts with migration paths
- Cost optimization recommendations by use case
- Token cost calculator

The interesting bit: there's an MCP server that lets AI agents query this data autonomously. So instead of hardcoding `gpt-4o` everywhere, your agents can check pricing and benchmarks before choosing a model.

Example: an agent doing code review could check that Claude Sonnet scores 92 on HumanEval at $3/1M tokens, vs GPT-4o at $10/1M tokens — and route accordingly.

Free tier available at https://apipoints.dev

Looking for feedback on the benchmark normalization methodology. Currently using 0-100 scale with source attribution.

---

## r/SaaS

**Title:** Solo dev launch: APIPoints – LLM cost intelligence API. Launching on PH next Tuesday.

**Body:**

Hey r/SaaS — solo dev here. Built APIPoints after burning hours manually comparing LLM pricing for my own projects.

**What it is:** A REST API that tracks real-time pricing, benchmarks, and deprecation notices for 38 LLMs. Think "Stripe for LLM cost visibility."

**The problem it solves:** Teams spending $500-$5000+/month on LLM APIs have zero visibility into whether they're overpaying. The API surface is fragmented across 8+ providers with different pricing models.

**Key features:**
- 7 REST endpoints for pricing, benchmarks, deprecations, recommendations
- MCP server for AI agent integration (Claude, Cursor, Windsurf)
- ROI calculator showing potential savings (typically 40-90%)
- Multilingual (8 languages)

**Pricing:** Free tier → $49 → $149 → $499/mo

**Tech:** Cloudflare Workers + D1, TypeScript, Stripe

**Launch:** Product Hunt next Tuesday. Would love feedback before then.

https://apipoints.dev

Happy to share revenue numbers, growth strategy, or technical architecture details if there's interest.
