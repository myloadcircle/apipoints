# @apipoints/mcp-server

Official Model Context Protocol (MCP) server for **APIPoints** — Real-time AI Operations Intelligence.

Gives your AI agents (Claude, Cursor, Windsurf) native access to:
- Live LLM pricing per 1M tokens across 8+ providers (`get_llm_costs`)
- Model performance benchmarks (`get_model_benchmarks`)
- Active & upcoming model deprecations (`get_deprecations`)
- Tracked provider capabilities (`get_providers`)
- Pricing & release changelog (`get_changes`)
- Cost optimization recommendations by use case (`get_recommendations`)
- Token cost calculations (`calculate_cost`)

---

## Quickstart

### Claude Desktop / Cursor / Windsurf Configuration

Add to your `mcpServers` configuration:

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

> **Note:** Get your API key at [apipoints.dev](https://apipoints.dev).

---

## License

MIT © 2026 APIPoints
