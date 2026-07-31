# APIPoints Dashboard Refactor & Daytona Compute Integration Report

**Date:** July 31, 2026  
**Commit:** `05b5a6b`  
**Status:** Live & Verified  

---

## Executive Summary
Refactored the APIPoints dashboard to replace placeholders with real usage telemetry and integrated Daytona-backed compute sandboxes directly into the Cloudflare Worker API layer and static dashboard UI.

---

## Key Changes

### 1. Database Schema Extensions
- Added migration `worker/migrations/0004_compute.sql` and updated `worker/src/schema.sql`:
  - `tenant_wallets`: Tracks credit balances ($49 Starter, $149 Growth, $499 Enterprise), active sandbox concurrency, and spend caps.
  - `compute_usage_ledger`: Detailed metering per sandbox resource (vCPU, Memory, GPU).
  - `compute_sandboxes`: Live sandbox records linked to Daytona sandbox IDs and lifecycle statuses (`provisioning`, `running`, `destroyed`).
- Applied migration to remote Cloudflare D1 database (`APIPoints-db`).

### 2. Cloudflare Worker API (`worker/src/index.ts`)
- **Real Usage Analytics:**
  - `GET /api/usage` — Returns usage summary, daily request trends (for chart rendering), endpoint breakdowns, and recent request logs (50 items).
- **Compute Sandboxes & Wallets:**
  - `GET /api/compute` — Auto-provisions tenant wallet based on plan tier ($49 default for Starter), lists sandboxes, and monthly usage ledger.
  - `POST /api/compute/sandboxes` — Provisions sandboxes on Daytona via `POST https://app.daytona.io/api/sandbox`:
    - Enforces plan gates (Free tier 402, Wallet balance 402, Max concurrency 429).
    - Maps vCPU/Memory requirements to Daytona pre-built snapshots (`daytona-small`, `daytona-medium`, `daytona-large`).
    - Increments active sandbox counter on wallet.
  - `DELETE /api/compute/sandboxes/:id` — Sends termination request to Daytona API and marks sandbox status as `destroyed` in D1.

### 3. Dashboard UI (`static-site/dashboard.html`)
- **Usage Metrics Section:** Real analytics cards (Total Requests, Total Credits Used), Canvas bar chart showing daily activity, and endpoint distribution table.
- **Recent Requests Section:** Live request log table showing latest 50 API calls with credit consumption and timestamps.
- **Compute Sandboxes Section:**
  - Real-time wallet balance, active sandboxes / concurrency limit, and monthly spend cards.
  - Interactive sandbox creation form with snapshot size selector (`Small · 1 vCPU / 1GB`, `Medium · 2 vCPU / 4GB`, `Large · 4 vCPU / 8GB`).
  - Active sandboxes table with status badges and instant `Destroy` action.
- Fixed `loadProfile` data structure bug (`data.subscription?.plan` / `data.user?.email`).

---

## Deployments & Verification

| Target | Deployment Status | Details |
| :--- | :--- | :--- |
| **Cloudflare Worker** | Deployed | Version `3ea1e5f0-b131-491a-95bb-cdb62651437d` |
| **Cloudflare Pages** | Deployed | Live at `https://b194d6ba.apipoints.pages.dev` / `apipoints.dev/dashboard` |
| **Cloudflare D1** | Migrated | 14 tables verified active |
| **Daytona Secret** | Bound | `DAYTONA_API_KEY` set in Wrangler secret store |

### End-to-End Smoke Test Summary
1. Created test account `sb-test@apipoints.dev` with Starter plan ($49 wallet auto-provisioned).
2. Verified `GET /api/compute` returning 200 OK with active wallet.
3. Created sandbox via `POST /api/compute/sandboxes` — Daytona provisioned sandbox (`status: "running"`).
4. Verified sandbox reflected in `GET /api/compute` list and wallet active count updated.
5. Destroyed sandbox via `DELETE /api/compute/sandboxes/:id` — Daytona terminated sandbox (`status: "destroyed"`).
6. Removed all test records and user from D1 database.

---

## Next Recommendations
1. Add SSE log streaming support (`/api/compute/sandboxes/:id/logs/stream`) for live terminal streaming in dashboard.
2. Setup cron trigger worker task to process hourly compute ledger metering against tenant wallet balances.
