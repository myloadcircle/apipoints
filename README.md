# APIPoints

Real-time LLM pricing, benchmarks, deprecation alerts & cost optimization API with MCP server.

**[apipoints.dev](https://apipoints.dev)**

## What is APIPoints?

APIPoints tracks 38 LLMs across 8 providers (OpenAI, Anthropic, Google, Mistral, DeepSeek, Meta, Groq, Cohere) and provides:

- **Live pricing** per 1M tokens (input + output)
- **Model benchmarks** (MMLU, HumanEval, MATH, GPQA, MT-Bench)
- **Deprecation alerts** with migration paths
- **Cost recommendations** by use case
- **Token cost calculator**
- **MCP server** for AI agent integration

## Quick Start

```bash
# Get your API key at https://apipoints.dev
curl -H "x-api-key: YOUR_KEY" \
  "https://apipoints-worker.francis-e3b.workers.dev/v1/llm-costs"
```

## MCP Server

Add to your Claude Desktop / Cursor / Windsurf config:

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

## Architecture

- **Worker:** Cloudflare Workers + D1
- **Auth:** HMAC-SHA256 JWT, x-api-key
- **Payments:** Stripe
- **i18n:** 8 languages (EN, ZH, ES, AR, JA, DE, FR, PT)

## Pricing

| Plan | Price | Credits/mo |
|------|-------|------------|
| Free | $0 | 5,000 |
| Starter | $49 | 50,000 |
| Growth | $149 | 250,000 |
| Enterprise | $499 | 1,000,000 |

## License

MIT
