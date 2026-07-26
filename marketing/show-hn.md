# Show HN: APIPoints – Real-time LLM pricing API with MCP server for autonomous cost optimization

I built an API that tracks real-time pricing, benchmarks, and deprecation notices for 38 LLMs across 8 providers — and an MCP server so AI agents can use it autonomously.

**The problem:** Teams spending thousands/mo on LLM APIs have no visibility into cost optimization. Models change pricing constantly, benchmarks are scattered across papers, and deprecation notices get missed until things break.

**What APIPoints does:**
- REST API with 7 endpoints: live pricing, model benchmarks, deprecations, provider info, changelog, cost recommendations, and a cost calculator
- MCP server (`npx @apipoints/mcp-server`) so Claude/Cursor/Windsurf agents can query costs and benchmarks directly
- Tracks 38 models across OpenAI, Anthropic, Google, Mistral, DeepSeek, Meta, Groq, Cohere
- Cost optimization recommendations by use case (code gen, customer support, RAG, etc.)
- ROI calculator showing potential 40-90% savings

**Tech stack:** Cloudflare Workers + D1, TypeScript, HMAC-SHA256 auth, PBKDF2 password hashing

**Pricing:** Free tier (5K credits), Starter $49/mo, Growth $149/mo, Enterprise $499/mo

**Launch:** Product Hunt next Tuesday — would love feedback before then.

Live at https://apipoints.dev — API docs at https://apipoints.dev/quickstart

Happy to answer questions about the architecture, the data collection approach, or MCP integration.
