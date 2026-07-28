# APIPoints — Build Audit

**Date:** 2026-07-28
**Data version:** 2026.07.24
**Status:** Pre-launch (Product Hunt Tuesday Jul 29)

---

## 1. What APIPoints Is

An API intelligence platform for AI/ML teams. Provides real-time LLM pricing, benchmarks, deprecation tracking, cost optimization recommendations, and compute sandbox infrastructure (Daytona-powered). Users subscribe via Stripe, get an API key, and consume intelligence endpoints or spin up compute sandboxes.

---

## 2. Architecture

| Layer | Tech | Platform |
|-------|------|----------|
| **Frontend** | Static HTML + vanilla JS | Cloudflare Pages |
| **API Backend** | Cloudflare Worker (TypeScript) | Cloudflare Workers |
| **Database** | D1 (SQLite) | Cloudflare D1 |
| **Email** | Resend API | Cloudflare Worker |
| **Compute Gateway** | Express.js (Daytona proxy) | Not deployed |
| **MCP Server** | stdio transport (npm) | Not published |
| **Payments** | Stripe Checkout + Webhooks | Stripe |

---

## 3. Deployed Services

| Service | URL | Status |
|---------|-----|--------|
| Static site | `https://apipoints.dev` | Live |
| Worker API | `https://apipoints-worker.francis-e3b.workers.dev` | Live |
| D1 Database | `APIPoints-db` | Live |
| MCP manifest | `https://apipoints.dev/.well-known/mcp.json` | Live |
| OpenAPI spec | `https://apipoints.dev/openapi.yaml` | Live |
| GitHub repo | `https://github.com/myloadcircle/apipoints` | Public |

---

## 4. API Endpoints — 29 Total

### Public (no auth)
| Method | Path | Rate Limit |
|--------|------|------------|
| * | `/api/health` | None |
| GET | `/api/public/llm-costs` | 30/min/IP |

### Auth (brute-force protected)
| Method | Path | Rate Limit |
|--------|------|------------|
| POST | `/api/auth/signup` | 5/min/IP |
| POST | `/api/auth/login` | 10/min/IP |
| POST | `/api/auth/verify-email` | None |
| POST | `/api/auth/resend-verification` | 3/min/IP |
| POST | `/api/auth/forgot-password` | 5/min/IP |
| POST | `/api/auth/reset-password` | None |

### Intelligence (Bearer OR x-api-key, 1 credit each)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/llm-costs` | LLM pricing (38 models) |
| GET | `/v1/model-benchmarks` | Benchmark scores (25 models) |
| GET | `/v1/deprecations` | Deprecation notices (10) |
| GET | `/v1/providers` | LLM providers (8) |
| GET | `/v1/changes` | Pricing/release changelog (16) |
| GET | `/v1/recommend` | Cost optimization recommendations (8) |
| GET | `/v1/calculate` | Token cost calculator |

### User/Account (Bearer only)
| Method | Path |
|--------|------|
| GET | `/api/auth/me` |
| GET | `/api/credits` |
| GET | `/api/credits/ledger` |

### Agents (Bearer only)
| Method | Path |
|--------|------|
| GET | `/api/agents/list` |
| POST | `/api/agents/create` |
| DELETE | `/api/agents/:id` |

### Thresholds (Bearer only)
| Method | Path |
|--------|------|
| POST | `/api/thresholds` |
| GET | `/api/thresholds?model_id=xxx` |
| DELETE | `/api/thresholds/:id` |

### API Keys (Bearer only)
| Method | Path |
|--------|------|
| POST | `/api/api-keys/create` |
| GET | `/api/api-keys/list` |
| POST | `/api/api-keys/revoke` |

### Billing (Stripe)
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/billing/checkout` | Bearer |
| POST | `/api/billing/webhook` | HMAC signature |

### Cron
| Schedule | Description |
|----------|-------------|
| `*/5 * * * *` | Check user thresholds against pricing/benchmarks, send notifications |

---

## 5. Database — 11 Tables

### D1 (Worker)
| Table | Purpose |
|-------|---------|
| `users` | Email, password (PBKDF2), email_verified, verification/reset tokens |
| `credits` | Balance per user (default 5,000) |
| `credit_ledger` | Transaction history |
| `subscriptions` | Stripe subscription + plan |
| `api_keys` | Hashed API keys with prefix |
| `agents` | User-created agents |
| `agent_logs` | Agent execution history |
| `webhooks` | User webhook configs |
| `api_usage` | Per-endpoint usage tracking + rate limiting |
| `thresholds` | Cost/latency alert configs |
| `threshold_notifications` | Rate-limit tracking (1 per 10min) |

### Compute Gateway (SQLite)
| Table | Purpose |
|-------|---------|
| `tenant_wallets` | Credit balance + spend caps |
| `compute_usage_ledger` | Per-resource metering |
| `compute_sandboxes` | Active sandbox tracking |
| `compute_audit_log` | SHA-256 input/output hashes |

---

## 6. Intelligence Data

| Dataset | Count |
|---------|-------|
| Providers tracked | 8 (OpenAI, Anthropic, Google, Mistral, DeepSeek, Meta, Groq, Cohere) |
| Models with pricing | 38 |
| Models with benchmarks | 25 |
| Deprecation notices | 10 |
| Pricing/release changes | 16 |
| Cost recommendations | 8 use cases |

---

## 7. Email System

### Provider: Resend (verified domain: `apipoints.dev`)

| Template | Trigger |
|----------|---------|
| Verification email | On signup |
| Password reset | On forgot-password request |
| Welcome email | On email verification |
| Billing confirmation | On Stripe checkout |
| Deprecation alert | Batch alerts to users |

### Threshold alert notifications (notify.ts)
| Channel | Implementation |
|---------|---------------|
| Email | Resend API (styled HTML) |
| Slack | Webhook URL (Block Kit JSON) |
| Webhook | POST JSON to user's URL |

---

## 8. Static Site — 15 Pages

| Page | Purpose |
|------|---------|
| `index.html` | Landing page (962 lines) |
| `login.html` | Login with forgot-password link |
| `register.html` | Signup (→ check-email page) |
| `dashboard.html` | Main dashboard (API keys, credits, agents, thresholds, playground) |
| `dashboard/upgrade.html` | Stripe checkout / plan management |
| `verify-email.html` | Email verification callback |
| `check-email.html` | "Check your inbox" holding page |
| `forgot-password.html` | Password reset request |
| `reset-password.html` | New password form |
| `compare.html` | LLM model comparison |
| `status.html` | System status |
| `quickstart.html` | API quickstart docs |
| `privacy.html` | Privacy policy |
| `terms.html` | Terms of service |
| `guides/autonomous-model-routing.html` | Routing guide |

### i18n: 8 languages
English, Chinese, Spanish, Arabic (RTL), Japanese, German, French, Portuguese (Brazilian)

---

## 9. Compute Gateway

| Component | Status |
|-----------|--------|
| Express server | Built, not deployed |
| Daytona proxy | Sandboxes, snapshots, desktops, GPU |
| Auth middleware | API key via DB lookup |
| Rate limiting | Per-tenant per-minute |
| Governance | Credit check, concurrent limits, 95% spend cap |
| Audit logging | SHA-256 input/output hashes |
| Metering | 6 resource types (vCPU, Memory, GPU, Storage, etc.) |
| Python SDK | Built (`apipoints-compute`) |
| TypeScript SDK | Built (`@apipoints/compute`) |

---

## 10. MCP Server

| Component | Status |
|-----------|--------|
| Package | `@apipoints/mcp-server` v1.0.0 |
| Transport | stdio |
| Tools | 7 (costs, benchmarks, deprecations, providers, changes, recommend, calculate) |
| npm publish | **Not published** (account issue) |
| Well-known manifest | Deployed at `/.well-known/mcp.json` |

---

## 11. Pricing

| Tier | Monthly | API Credits | Compute Credits | Sandboxes | Rate Limit |
|------|---------|-------------|-----------------|-----------|------------|
| Free | £0 | 5,000 | None | None | 10 req/min |
| Starter | £49 | 5M | £49 | 3 | 60 req/min |
| Growth | £149 | 20M | £149 | 15 + GPU | 300 req/min |
| Enterprise | £499 | 50M | £499 | 50 + H100 | 1,000 req/min |

### Stripe Products
| Plan | Product ID | Price ID |
|------|-----------|----------|
| Starter | `prod_UwvovE0uWkexVd` | `price_1Tx1wh3C6smqFKLawGRLjLBP` |
| Growth | `prod_Uwvog8qQGVVRzI` | `price_1Tx1x03C6smqFKLayKowvU4G` |
| Enterprise | `prod_UwvokQjAUz12QH` | `price_1Tx1x13C6smqFKLaO5Wlr04A` |

---

## 12. Security

| Measure | Implementation |
|---------|---------------|
| Password hashing | PBKDF2 (100K iterations, SHA-256) + random salt |
| JWT | HMAC-SHA256, 30-day expiry |
| JWT fallback | Fails closed if `JWT_SECRET` unset |
| API key hashing | SHA-256, prefix stored for display |
| Rate limiting | Per-IP auth limits, per-user API limits |
| Brute-force protection | Auth rate limits per IP |
| Stripe webhook | Constant-time HMAC verify + 5min replay protection |
| Credit deduction | Atomic `UPDATE WHERE balance >= ?` |
| Public endpoint | IP-based rate limit 30/min |
| Error messages | Generic to client, details logged server-side |
| Email enumeration | Forgot-password returns same message regardless |
| CORS | `*` (public API) |

---

## 13. Git History

```
3714d09 feat: threshold alerts - DB, API, cron, notification engine, frontend
1179fb3 fix: replace strikethrough with clear text on Free tier pricing
cc39b62 feat: full email system - verification, password reset, transactional emails
d8a1979 fix: align pricing across all systems (landing page, locales, upgrade, BUILD-INFO)
2fc5810 security: fix 7 critical + 10 high-severity issues from full audit
910fe5c fix: align PRICING_TIERS with landing page and METERING_RATES
0db3571 feat: compute gateway, SDKs, trust badges, architecture diagram, cost calculator
2d77fe5 Conversion optimization: live API demo, simplified signup, social proof, sticky CTA
0a5866b Initial: APIPoints API + MCP server + static site + marketing
```

---

## 14. Environment / Secrets

### Worker (Cloudflare)
| Secret | Status |
|--------|--------|
| `JWT_SECRET` | Set |
| `STRIPE_SECRET_KEY` | Set |
| `STRIPE_WEBHOOK_SECRET` | Set |
| `RESEND_API_KEY` | Set |

### Worker (vars)
| Variable | Value |
|----------|-------|
| `STRIPE_PRICE_STARTER` | `price_1Tx1wh3C6smqFKLawGRLjLBP` |
| `STRIPE_PRICE_GROWTH` | `price_1Tx1x03C6smqFKLayKowvU4G` |
| `STRIPE_PRICE_ENTERPRISE` | `price_1Tx1x13C6smqFKLaO5Wlr04A` |
| `API_POINTS_URL` | `https://apipoints.pages.dev` |

---

## 15. What's Done

- [x] 29 API endpoints deployed and tested
- [x] 11 D1 tables + 3 migrations
- [x] Email system (Resend, 5 templates, verified domain)
- [x] Email verification + password reset flow
- [x] Stripe billing (Checkout + webhooks)
- [x] Threshold alerts (API + cron + notifications + frontend)
- [x] Landing page with live API demo, pricing, architecture diagram
- [x] Dashboard (API keys, credits, agents, thresholds, playground)
- [x] i18n (8 languages, RTL support)
- [x] Security hardening (17 fixes deployed)
- [x] Marketing content (Show HN, Dev.to, Reddit, calendar)
- [x] Compute gateway built (not deployed)
- [x] Python + TypeScript SDKs built
- [x] MCP server built (not published to npm)
- [x] All pricing aligned across all systems
- [x] Git repo pushed (9 commits)

---

## 16. What's Not Done

| Item | Blocker | Priority |
|------|---------|----------|
| MCP server on npm | npm account login issue | Medium |
| Compute gateway deployed | Not yet deployed to hosting | Low (post-launch) |
| Zoho email hosting | User to set up | Low (post-launch) |
| `STRIPE_WEBHOOK_SECRET` | Already set | Done |
| Product Hunt launch | Tuesday Jul 29 | **Critical** |
| Show HN post | Needs to go live Jul 29 | **Critical** |
| Dev.to blog post | Needs publishing Jul 29 | **Critical** |
| Reddit posts | r/LocalLLaMA, r/MachineLearning, r/SaaS | High |
| Social media | Twitter/X posts | High |
| npm publish (MCP server) | Blocked by account | Medium |

---

## 17. Next Steps — Launch Week

### Tuesday Jul 29 (Launch Day)
1. Submit to Product Hunt
2. Post Show HN
3. Publish Dev.to blog post
4. Post to Reddit (r/LocalLLaMA, r/MachineLearning, r/SaaS)
5. Social media posts

### Post-Launch
1. Fix npm account → publish MCP server
2. Deploy compute gateway
3. Set up Zoho for domain email
4. Monitor metrics and user feedback
