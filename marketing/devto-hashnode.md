---
title: "How I Built an API That Saves Teams 40-90% on LLM Costs"
published: false
description: "Real-time pricing, benchmarks, and deprecation alerts for 38 LLMs across 8 providers — with an MCP server for autonomous AI agents."
tags: llm, ai, api, typescript
canonical_url: https://apipoints.dev/blog/saving-llm-costs
cover_image: https://apipoints.dev/assets/og-image.png
---

# How I Built an API That Saves Teams 40-90% on LLM Costs

If your team is spending hundreds or thousands of dollars per month on LLM APIs, there's a good chance you're overpaying. Not because the providers are ripping you off — but because the optimal model for your use case is often not the one you're defaulting to.

I built [APIPoints](https://apipoints.dev) to solve this problem. It's a real-time intelligence API that tracks pricing, benchmarks, and deprecation notices for 38 LLMs across 8 providers — and includes an MCP server so AI agents can make cost-optimal decisions autonomously.

Here's how it works and why it matters.

## The Cost Visibility Problem

Most teams using LLMs face the same issues:

1. **Pricing changes constantly.** OpenAI, Anthropic, and Google update pricing multiple times per year. By the time you notice, you've been overpaying for weeks.

2. **Benchmarks are scattered.** MMLU, HumanEval, MATH, GPQA — each provider publishes results differently. Comparing GPT-4o to Claude Sonnet to Gemini requires cross-referencing five different sources.

3. **Deprecation notices get missed.** When a model you depend on gets deprecated, you find out when your pipeline breaks — not when the announcement goes out.

4. **No cost optimization signal.** You know you're spending $X/month, but you don't know that a cheaper model could handle 60% of your requests at 90% quality.

## What APIPoints Provides

APIPoints is a REST API with 7 endpoints:

### 1. Live LLM Pricing (`/v1/llm-costs`)

Real-time input/output costs per 1M tokens for 38 models. Filter by provider, model name, or cost limits.

```bash
curl -H "x-api-key: YOUR_KEY" \
  "https://apipoints-worker.francis-e3b.workers.dev/v1/llm-costs?provider=openai"
```

### 2. Model Benchmarks (`/v1/model-benchmarks`)

MMLU, HumanEval, MATH, GPQA, and MT-Bench scores normalized to 0-100. Filter by minimum scores to find models that meet your quality bar.

### 3. Deprecation Alerts (`/v1/deprecations`)

Active and upcoming model deprecations with migration paths. Never get caught off guard again.

### 4. Cost Recommendations (`/v1/recommend`)

Tell it your use case (code generation, customer support, RAG, etc.) and get ranked alternatives with cost savings projections.

### 5. Token Cost Calculator (`/v1/calculate`)

Calculate exact costs for your token volume across any model.

### 6. Provider Directory (`/v1/providers`)

Capabilities, endpoints, and metadata for all 8 tracked providers.

### 7. Change Changelog (`/v1/changes`)

Pricing decreases, new model releases, deprecation announcements — all in one stream.

## The MCP Server: Agents That Optimize Costs Autonomously

The real differentiator is the MCP (Model Context Protocol) server. If you're using Claude Desktop, Cursor, or Windsurf, you can add APIPoints as a tool:

```json
{
  "mcpServers": {
    "apipoints": {
      "command": "npx",
      "args": ["-y", "@apipoints/mcp-server"],
      "env": {
        "APIPOINTS_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

Your AI agent can now:
- Query current pricing before choosing a model
- Find the cheapest model that meets quality thresholds
- Check if a model is about to be deprecated
- Calculate costs before committing to a workload

This is the difference between an agent that blindly uses GPT-4o for everything and one that routes 60% of requests to GPT-4o-mini, 30% to Claude Haiku, and reserves GPT-4o for complex reasoning — at 40-90% lower cost.

## The Real-World Savings

Here's what the numbers look like for a typical SaaS app processing 1M requests/month:

| Model | Cost/1M tokens (in) | Cost/1M tokens (out) | Monthly cost (1M req × 500 in × 200 out) |
|-------|--------------------|--------------------|------------------------------------------|
| GPT-4o | $2.50 | $10.00 | $3,250 |
| GPT-4o-mini | $0.15 | $0.60 | $195 |
| Claude Haiku | $0.25 | $1.25 | $375 |
| DeepSeek V3 | $0.27 | $1.10 | $351 |

**Switching from GPT-4o to GPT-4o-mini for non-complex tasks saves $3,055/month — a 94% reduction.**

The key is knowing *which* requests can be safely routed to cheaper models. That's what the benchmarks and recommendations endpoints are for.

## Tech Stack

- **Runtime:** Cloudflare Workers (edge, low latency globally)
- **Database:** Cloudflare D1 (SQLite at the edge)
- **Auth:** HMAC-SHA256 JWT signing via Web Crypto API
- **Passwords:** PBKDF2 with 100K iterations, per-user salt
- **Payments:** Stripe Checkout with webhook verification
- **i18n:** 8 languages (EN, ZH, ES, AR, JA, DE, FR, PT) with RTL support

## What's Next

- Price alert webhooks (get notified when a model drops in price)
- Team/org management for multi-seat plans
- Historical pricing charts
- More benchmark sources (LMSYS Chatbot Arena, etc.)

## Try It

**Free tier:** 5,000 credits/month — enough to evaluate the full API.

→ **https://apipoints.dev** — Sign up, get an API key, start saving.

---

*APIPoints is launching on Product Hunt next week. If this sounds useful, I'd appreciate an upvote on launch day.*
