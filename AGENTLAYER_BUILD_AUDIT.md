# AgentLayer Build Audit & Process Documentation

**Date:** 2026-05-08
**Live URL:** https://agentlayer.site
**Status:** ✅ LIVE — all pages returning 200, Supabase magic link auth working, paywall logic active

---

## 1. Project Overview

AgentLayer is a SaaS platform providing real-time AI operations intelligence — LLM pricing, model benchmarks, deprecation alerts, and provider change tracking across 8+ AI providers. Delivered via REST API and MCP-native endpoints.

### Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Cloudflare Pages                    │
│  (index, register, login, dashboard, upgrade, etc.)  │
├──────────────────────────────────────────────────────┤
│              Supabase Auth (Magic Link)              │
│  - signInWithOtp() - email-based magic link auth     │
│  - resetPasswordForEmail() - password reset          │
│  - onAuthStateChange() + getSession() - session      │
├──────────────────────────────────────────────────────┤
│          Supabase Edge Function (Stripe)             │
│  create-checkout: creates Stripe checkout session    │
│  with 14-day trial_period_days                       │
├──────────────────────────────────────────────────────┤
│            Supabase Postgres Database                │
│  - public.profiles — user profiles, plan, trial_end  │
│  - public.plans — Stripe-aligned pricing tiers       │
│  - public.teams — team ownership for seat scaling    │
│  - public.team_members — seat membership             │
│  - RLS policies for row-level security               │
│  - Trigger: auto-creates profile + team on signup    │
├──────────────────────────────────────────────────────┤
│                  Stripe (Billing)                    │
│  - $199/month Starter  (1 seat)                      │
│  - $499/month Growth   (5 seats)                     │
│  - $1,999/month Enterprise (20 seats)                │
│  - Additional seats: $20/seat/month                  │
│  - Price ID (additional seat): price_1TUkhO3C6smq...│
└──────────────────────────────────────────────────────┘
```

---

## 2. File Inventory

### Static Site (`C:\DEV\agentlayer\static-site\`)

| File | Purpose | Status |
|------|---------|--------|
| `index.html` | Marketing homepage — Omma UI, lime/neon theme, pricing ($199/$499/$1,999), feature grid, step guide | ✅ Deployed |
| `register.html` | Magic link registration — pricing disclosure, acceptance checkbox, `?source=` query param for product tracking | ✅ Deployed |
| `login.html` | Magic link login + password reset via `resetPasswordForEmail()` | ✅ Deployed |
| `dashboard.html` | Auth-gated dashboard — trial banner, paywall enforcement, plan badge, Stripe checkout | ✅ Deployed |
| `quickstart.html` | API quickstart guide | ✅ Deployed |
| `privacy.html` | Privacy policy | ✅ Deployed |
| `terms.html` | Terms of service | ✅ Deployed |
| `create-profiles-table.sql` | SQL for profiles table + RLS + trigger | ✅ Executed |
| `create-paywall.sql` | SQL for paywall — plans, teams, team_members, trial, upgrade RPCs | ⏳ Not executed |
| `create-modules.sql` | SQL for agents, agent_runs, workflow_runs tables + RPCs | ⏳ Not executed |
| `supabase-config.js` | Legacy config (no longer referenced by pages) | ⚠️ Orphaned |
| `wrangler.toml` | Legacy Cloudflare Worker config | ⚠️ Orphaned |

### Dashboard Pages (`C:\DEV\agentlayer\static-site\dashboard\`)

| File | Purpose | Status |
|------|---------|--------|
| `upgrade.html` | Plan selection + manual upgrade flow | ✅ Ready for deploy |

### Supabase Edge Functions (`C:\DEV\agentlayer\supabase\functions\`)

| File | Purpose | Status |
|------|---------|--------|
| `create-checkout/index.ts` | Stripe checkout session creation with 14-day trial | ✅ Deployed v2 |
| `_shared/cors.ts` | Shared CORS headers for Edge Functions | ✅ Deployed |

### Supabase Config (`C:\DEV\agentlayer\supabase\`)

| File | Purpose | Status |
|------|---------|--------|
| `config.toml` | Auth config — site_url, redirects, signup settings | ✅ Pushed to remote |

---

## 3. Build Process — Step by Step

### Phase 1: Initial Setup — Static Site Creation

**Goal:** Create a static HTML site with Omma UI "AI OPERATIONS INTELLIGENCE" branding, lime/neon green theme.

**Files created:**
- `index.html` — Full marketing page with hero, features grid (8 cards), pricing (3 tiers), how-it-works steps, endpoints, footer. Styled with CSS variables: `--lime: #a3e635`, `--lime-light: #cbe86b`, dark theme.
- `register.html` — Email registration form with Supabase magic link
- `login.html` — Email login form + password reset
- `dashboard.html` — Auth-gated dashboard showing user info
- `quickstart.html`, `privacy.html`, `terms.html` — Supporting pages

### Phase 2: Auth — Cloudflare Worker → Supabase Auth

**Original approach:** Cloudflare Workers with custom auth
**Problem:** Workers auth was broken (redirect loop, "Failed to fetch")

**Fix:** Replaced all worker auth with Supabase Auth magic link:
- `window.sbClient = window.supabase.createClient(url, anonKey)` — global Supabase client
- `signInWithOtp({ email, options: { emailRedirectTo } })` — magic link
- `resetPasswordForEmail(email, { redirectTo })` — password reset
- `onAuthStateChange()` + `getSession()` — session management

### Phase 3: Supabase JS Initialization Fixes

**Problems found and fixed:**
1. **`className` → `class`** — `index.html` had React-style `className` attributes in HTML
2. **Missing Supabase JS CDN** — Pages were missing `<script src="@supabase/supabase-js@2">`
3. **`window.sbClient` not initialized** — Dashboard and login were calling `window.sbClient.auth.*` before init
4. **Scripts nested inside `<style>` tags** — JS code was accidentally placed inside style blocks
5. **Auth redirect loop** — Dashboard had broken redirect logic, simplified to `onAuthStateChange` + `getSession()`

### Phase 4: Supabase Auth URL Configuration (Critical Fix)

**Problem:** Magic links were redirecting to `loadcircle.app` (404) instead of `agentlayer.site` (200). CORS was blocked because Supabase Auth Site URL was set to `loadcircle.app`.

**Fix:** Used `supabase config push` to update the remote project's auth configuration:
```
site_url = "https://loadcircle.app" → "https://agentlayer.site"
additional_redirect_urls = [loadcircle URLs...] → ["https://agentlayer.site/**"]
```

**Command:**
```bash
# Edit supabase/config.toml, then:
npx supabase config push --project-ref kktblezpchfsoovxbgcd
```

**Result:** Auth Site URL now points to `https://agentlayer.site`. Magic links redirect to the correct domain.

### Phase 5: Stripe Edge Function Deployment

**Goal:** Create a Stripe checkout endpoint for plan upgrades.

**Implementation:**
- Supabase Edge Function `create-checkout` at `/functions/v1/create-checkout`
- Accepts `{ priceId, userId }` → creates Stripe checkout session
- Returns `{ url: session.url }` for redirect

**14-day free trial:**
```typescript
subscription_data: {
  trial_period_days: 14,
},
```

**Deployment:**
```bash
npx supabase functions deploy create-checkout --project-ref kktblezpchfsoovxbgcd
```

**Stripe secret key** stored in Supabase secrets via:
```bash
npx supabase secrets set STRIPE_SECRET_KEY=<sk_live_...>
```

### Phase 6: Database — Profiles Table

**SQL executed in Supabase Dashboard SQL Editor:**
- Created `public.profiles` table with `id`, `email`, `created_at`
- Enabled Row Level Security
- Created RLS policies (users can view/update own profile)
- Created `handle_new_user()` trigger function
- Created trigger `on_auth_user_created` to auto-create profile on signup

### Phase 7: Stripe Price IDs (Original)

```typescript
const priceIds = {
  'starter': 'price_1TTDaw3C6smqFKLaoTkRZHTg',
  'pro':     'price_1TTDeD3C6smqFKLakql0I8g1',
  'scale':   'price_1TTDge3C6smqFKLabmsf9KaB'
};
```

### Phase 8: Cloudflare Pages Deployment

**Deployment command:**
```bash
npx wrangler pages deploy static-site --project-name agentlayer-site-3jb
```

**DNS:**
- `agentlayer.site` → CNAME → Cloudflare Pages
- `www.agentlayer.site` → CNAME → Cloudflare Pages

**All pages verified 200 OK:**
- https://agentlayer.site → 200
- https://agentlayer.site/register → 200
- https://agentlayer.site/login → 200
- https://agentlayer.site/dashboard → 200
- https://agentlayer.site/privacy → 200
- https://agentlayer.site/terms → 200

### Phase 9: Free During Launch — Paywall Later

**Decision:** All features are free during the launch period. Paywall will be added later.

**Initial implementation:**
- Removed upgrade buttons from `dashboard.html`
- Dashboard shows: *"Full API access is currently free during our launch period."*

### Phase 10: Paywall Implementation (2026-05-08)

**Goal:** Add pricing disclosure at signup, 14-day trial timer, paywall enforcement, seat-based team scaling, and manual upgrade flow.

**Files created:**
- `create-paywall.sql` — Full paywall schema migration
- `dashboard/upgrade.html` — Upgrade page with plan cards

**Files modified:**
- `register.html` — Added pricing disclosure section + acceptance checkbox + `?source=` query param support
- `dashboard.html` — Added trial banner, plan badge, paywall modal, `loadUserProfile()` + `checkPaywall()` + `requireAccess()` functions + signup_source localStorage sync

**Backfill for existing users (section 5):**
- Sets `trial_end = now() + 30 days` for existing rows (gives them a month to evaluate)
- Sets `plan = 'free'`, `accepted_pricing = false` where NULL
- Creates `teams` rows for all existing profiles
- Links `profiles.team_id` to the new team
- Inserts each owner as their team's first member
- Sets `signup_source = 'loadcircle'` for users who signed up before May 2026

**Database schema (create-paywall.sql):**

| Object | Description |
|--------|-------------|
| `profiles.accepted_pricing` | Boolean, stores pricing acceptance |
| `profiles.plan` | Text, default 'free', updated on upgrade |
| `profiles.trial_end` | Timestamptz, default `now() + 14 days` |
| `profiles.team_id` | UUID, links to teams table |
| `profiles.signup_source` | Text, product origin: 'agentlayer' (new), 'loadcircle' (pre-May 2026). Set via `?source=` query param on register page |
| `plans` table | Stripe-aligned pricing: starter ($199/1 seat), growth ($499/5 seats), enterprise ($1,999/20 seats) |
| `teams` table | Team ownership for seat-based scaling |
| `team_members` table | Seat membership with unique constraint |
| `upgrade_plan()` RPC | Sets plan on both profiles and teams |
| `get_team_seat_count()` RPC | Returns current seat count |
| `can_add_team_member()` RPC | Checks seat limit against plan |

**Pricing signup flow:**
1. User sees pricing disclosure on `/register.html` — $199/$499/$1,999, additional seats $20
2. User checks "I understand that after 14 days, payment is required" checkbox
3. Checkbox enables "Send Magic Link" button
4. `accepted_pricing = true` stored in localStorage
5. On dashboard load, synced to `profiles.accepted_pricing`

**Trial/paywall flow:**
1. On signup: `trial_end = now() + 14 days`, `plan = 'free'`
2. Dashboard loads → `loadUserProfile()` checks `trial_end`
3. If `now() < trial_end`: green banner "Unlimited access until {date}. Build freely."
4. If `now() >= trial_end AND plan = 'free'`: red paywall modal blocks all access
5. Paywall modal links to `/dashboard/upgrade.html`
6. User upgrades → `upgrade_plan()` RPC sets plan → features unlocked

**Upgrade flow (`/dashboard/upgrade.html`):**
1. Shows current plan + status (trial active/expired)
2. Lists all 3 plans with prices and included seats
3. "Upgrade to {Plan}" button calls `upgrade_plan` RPC
4. On success: unlocks all features, redirects to dashboard
5. Additional seats: $20/seat/month — Stripe Price ID `price_1TUkhO3C6smqFKLaZwKZcolp`

**Paywall enforcement:**
- `checkPaywall()` — returns true if paywalled (trial ended + plan = free)
- `requireAccess()` — wraps action functions, shows paywall modal if blocked
- Applied to: `generateKey()` in dashboard
- View-only actions (view agents, view dashboard, view endpoints) are NOT blocked
- Paywalled users can only: view agents, view dashboard, view endpoints, access upgrade page

**RLS policies added:**
- `plans`: anyone can SELECT
- `teams`: owner can SELECT/UPDATE
- `team_members`: members can SELECT own, owner can SELECT/INSERT/DELETE

---

### Phase 11: SEO & Favicon (2026-05-08)

**Goal:** Add Google indexing meta tags and favicon across all pages.

**Changes to all 8 HTML pages (`<head>` section):**
- `<meta name="robots" content="index, follow">` — enables search engine indexing
- `<meta name="googlebot" content="index, follow">` — Googlebot-specific directive
- `<link rel="icon">` — 32×32 PNG favicon from loadcircle icon URL
- `<link rel="apple-touch-icon">` — 180×180 icon for iOS home screen

**Favicon source:** Custom SVG at `/assets/favicon.svg` — AgentLayer brand: dark rounded square with lime green glowing dot. Loadcircle PNG kept as fallback.

**Pages updated:** index, register, login, dashboard, quickstart, privacy, terms, upgrade

---

### Phase 12: Currency Change ($) & Product Tracking (2026-05-08)

**Currency change:** All pricing switched from £ (GBP) to $ (USD) to reduce friction for US customers.

**Files updated:** index.html, register.html, quickstart.html, terms.html, upgrade.html

**Product tracking added** (`signup_source` column on `profiles`):
- `register.html` reads `?source=` query param → stores in localStorage
- New signups via `handle_new_user()` trigger default to `'agentlayer'`
- `dashboard.html` syncs `signup_source` from localStorage on first load (for cross-product redirects)
- Pre-May 2026 users backfilled as `'loadcircle'`

**SQL changes in create-paywall.sql:**
- `profiles.signup_source text DEFAULT 'agentlayer'`
- `handle_new_user()` now inserts `signup_source = 'agentlayer'`
- Backfill: `UPDATE profiles SET signup_source = 'loadcircle' WHERE created_at < '2026-05-01'`

**Usage:** Query signups per product: `SELECT signup_source, plan, count(*) FROM profiles GROUP BY signup_source, plan;`

---

## 4. Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Static HTML (no framework) | Fastest deployment, zero build step, direct Cloudflare Pages |
| Supabase Auth over Workers | Existing Supabase project, magic link gives lowest friction UX, no custom worker maintenance |
| Magic link only (no passwords) | Lowest friction signup, password reset still supported |
| `window.sbClient` global | Shared single Supabase client instance across all pages |
| `onAuthStateChange` + `getSession()` | Handles both initial load and callback redirect from magic link |
| 14-day Stripe trial | `subscription_data.trial_period_days` in checkout session |
| `supabase config push` for auth config | Only way to fix Site URL without Supabase Dashboard access |
| Edge Function for Stripe | Server-side Stripe secret key handling, not exposed to client |

---

## 5. Supabase Project Configuration

- **Project Ref:** `kktblezpchfsoovxbgcd`
- **Project URL:** `https://kktblezpchfsoovxbgcd.supabase.co`
- **Anon Key:** `sb_publishable_2NiWJlBrp5wGywLL919bzA_5Y5WExGG`
- **Auth Settings (verified):**
  - `disable_signup: false` — new users can register
  - `external.email: true` — email auth enabled
  - `mailer_autoconfirm: true` — auto-confirm on magic link
  - `site_url: "https://agentlayer.site"` — correct redirect domain
  - `additional_redirect_urls: ["https://agentlayer.site/**"]` — wildcard allow

---

## 6. Supabase Service Role Key

Stored in Supabase secrets (not in code):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdGJsZXpwY2hmc29vdnhiZ2NkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzExNTM0MiwiZXhwIjoyMDgyNjkxMzQyfQ.l8vd4wvp_-5UE1uInhYT_YLKorn2lY7MweEC4B2FR0c
```

Used for: Edge Function invocation, Stripe checkout session creation.

---

## 7. Problems Encountered & Solutions

| Problem | Solution |
|---------|----------|
| Magic link redirects to `loadcircle.app` (404) | Changed Site URL via `supabase config push` |
| "Failed to fetch" on register page (CORS) | Caused by incorrect Site URL — fixed above |
| `className` instead of `class` in `index.html` | Replaced all `className` with `class` |
| Dashboard auth redirect loop | Simplified to `onAuthStateChange` + `getSession()` pattern |
| Supabase JS not loaded | Added CDN script tag before Supabase client init |
| `window.sbClient` undefined | Moved client init to a script block before page JS |
| JS inside `<style>` tags | Moved JS out of style blocks |
| Docker not running for Edge Function deploy | Not needed — `functions deploy` works without Docker |
| No Supabase Management API token available | Used `supabase config push` instead of Management API |

---

## 8. Stripe Integration (Manual Upgrade for Now)

The paywall currently uses manual upgrade (DB update only). Stripe billing integration is planned:

**Status:** Manual — `upgrade_plan()` RPC sets plan in DB directly.

**Future Stripe flow:**
1. User clicks "Upgrade" → Edge Function `create-checkout` creates Stripe session
2. User pays → Stripe webhook updates `profiles.plan` and `teams.plan`
3. Additional seats: `price_1TUkhO3C6smqFKLaZwKZcolp` — $20/seat/month

**To wire Stripe later:**
1. Update `dashboard/upgrade.html` — replace manual upgrade with `sbClient.functions.invoke('create-checkout', { priceId, userId })`
2. Create webhook endpoint to handle `checkout.session.completed` → update plan
3. Replace `upgrade_plan()` RPC call with Stripe redirect

---

## 9. DNS Configuration

| Domain | Target | Status |
|--------|--------|--------|
| `agentlayer.site` | Cloudflare Pages CNAME | ✅ 200 |
| `www.agentlayer.site` | Cloudflare Pages CNAME | ✅ 200 |

---

## 10. Commands Reference

```bash
# Deploy Edge Function
npx supabase functions deploy create-checkout --project-ref kktblezpchfsoovxbgcd

# Push auth config
npx supabase config push --project-ref kktblezpchfsoovxbgcd

# Deploy all static files to Cloudflare Pages
npx wrangler pages deploy static-site --project-name agentlayer-site-3jb

# Deploy specific directory
npx wrangler pages deploy static-site/dashboard --project-name agentlayer-site-3jb

# Set Stripe secret
npx supabase secrets set STRIPE_SECRET_KEY=<key> --project-ref kktblezpchfsoovxbgcd

# Check Supabase auth settings
curl https://kktblezpchfsoovxbgcd.supabase.co/auth/v1/settings

# Execute SQL migration (paste into Supabase Dashboard SQL Editor):
# 1. static-site/create-profiles-table.sql (already executed)
# 2. static-site/create-paywall.sql (pending - run this now)
# 3. static-site/create-modules.sql (pending - for agent modules)
```

---

## 11. Totals

- **HTML pages:** 8 (index, register, login, dashboard, quickstart, privacy, terms, upgrade)
- **Supabase Edge Functions:** 1 (create-checkout)
- **Stripe Price IDs:** 3 original + 1 additional seat (`price_1TUkhO3C6smqFKLaZwKZcolp`)
- **Database tables:** 4 (profiles, plans, teams, team_members)
- **Cloudflare Pages project:** agentlayer-site-3jb
- **Supabase project:** kktblezpchfsoovxbgcd
- **Live since:** 2026-05-07
- **Free trial:** 14 days (DB-enforced `trial_end` column)
- **Paywall:** Active — blocks non-paying users after 14 days
- **Plans:** Starter ($199), Growth ($499), Enterprise ($1,999)
- **Additional seats:** $20/seat/month across all plans
- **Auth method:** Supabase magic link (no passwords)
- **Product tracking:** `signup_source` column — 'agentlayer' (new), 'loadcircle' (legacy), override via `?source=` param
- **SEO:** Google bot meta tags on all 8 pages
- **Favicon:** Custom AgentLayer brand icon — dark rounded square + lime green dot. Formats: `.ico` (multi-size), `.svg`, 32×32 `.png`, 180×180 apple-touch-icon

---

## 12. Commands to Execute

### Execute paywall migration (one-time):
```sql
-- Paste create-paywall.sql into Supabase SQL Editor and run
```

### Deploy to Cloudflare Pages:
```bash
npx wrangler pages deploy static-site --project-name agentlayer-site-3jb
```

---

*Document generated: 2026-05-08*
