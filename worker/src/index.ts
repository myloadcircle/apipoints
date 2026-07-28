import { PROVIDERS, PRICING, BENCHMARKS, DEPRECATIONS, CHANGES, COST_RECOMMENDATIONS, RATE_LIMITS, DATA_VERSION, LAST_UPDATED, type ModelPricing, type Deprecation } from './intelligence';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, sendBillingConfirmation, type EmailEnv } from './email';
import { sendThresholdNotification, type ThresholdPayload } from './notify';

interface Env extends EmailEnv {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_STARTER?: string;
  STRIPE_PRICE_GROWTH?: string;
  STRIPE_PRICE_ENTERPRISE?: string;
  API_POINTS_URL?: string;
  JWT_SECRET?: string;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-api-key',
    },
  });
}

function cors() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-api-key',
    },
  });
}

// Simple in-memory rate limiter for public/auth endpoints (per-isolate)
const publicRateLimit = new Map<string, { count: number; resetAt: number }>();
const authRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkPublicRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = publicRateLimit.get(key);
  if (!entry || now > entry.resetAt) {
    publicRateLimit.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function checkAuthRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = authRateLimit.get(key);
  if (!entry || now > entry.resetAt) {
    authRateLimit.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// Periodic cleanup for rate limit maps (every 5 minutes)
let lastCleanup = Date.now();
function cleanupRateLimits() {
  const now = Date.now();
  if (now - lastCleanup < 300000) return;
  lastCleanup = now;
  for (const [k, v] of publicRateLimit) { if (now > v.resetAt) publicRateLimit.delete(k); }
  for (const [k, v] of authRateLimit) { if (now > v.resetAt) authRateLimit.delete(k); }
}

function generateId() {
  return crypto.randomUUID();
}

function generateVerificationToken(): string {
  return [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join('');
}

function getBaseUrl(env: Env): string {
  return env.API_POINTS_URL || 'https://apipoints.pages.dev';
}

function generateApiKey() {
  const raw = 'apk_live_' + [...crypto.getRandomValues(new Uint8Array(24))].map(b => b.toString(36).padStart(2, '0')).join('');
  return raw;
}

function generateSalt(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
}

function base64urlEncode(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return base64urlEncode(new Uint8Array(signature));
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBytes = base64urlDecode(signature);
    return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data));
  } catch {
    return false;
  }
}

async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  let hashHex = '';
  for (let i = 0; i < hashArray.length; i++) {
    const hex = hashArray[i].toString(16);
    hashHex += hex.length === 1 ? '0' + hex : hex;
  }
  return hashHex;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(derivedBits);
  let hashHex = '';
  for (let i = 0; i < hashArray.length; i++) {
    const hex = hashArray[i].toString(16);
    hashHex += hex.length === 1 ? '0' + hex : hex;
  }
  return hashHex;
}

async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const h = await hashPassword(password, salt);
  return h === hash;
}

async function generateToken(userId: string, secret: string): Promise<string> {
  const header = base64urlEncode(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = base64urlEncode(new TextEncoder().encode(JSON.stringify({
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 30,
  })));
  const data = `${header}.${payload}`;
  const signature = await hmacSign(data, secret);
  return `${data}.${signature}`;
}

async function verifyToken(token: string, secret: string): Promise<string | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[1])));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    const data = `${parts[0]}.${parts[1]}`;
    const valid = await hmacVerify(data, parts[2], secret);
    if (!valid) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

async function getUserFromToken(request: Request, db: D1Database, jwtSecret: string) {
  const token = getBearerToken(request);
  if (!token) return null;
  const userId = await verifyToken(token, jwtSecret);
  if (!userId) return null;
  return await db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').bind(userId).first();
}

async function getUserFromApiKey(request: Request, db: D1Database): Promise<{ user_id: string; key_id: string } | null> {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) return null;
  const keyHash = await sha256Hex(apiKey);
  const keyRecord = await db.prepare('SELECT id, user_id FROM api_keys WHERE key_hash = ? AND active = 1').bind(keyHash).first() as any;
  if (!keyRecord) return null;
  await db.prepare('UPDATE api_keys SET last_used_at = datetime(\'now\') WHERE id = ?').bind(keyRecord.id).run();
  return { user_id: keyRecord.user_id, key_id: keyRecord.id };
}

async function getUserPlan(db: D1Database, userId: string): Promise<string> {
  const sub = await db.prepare('SELECT plan FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').bind(userId).first() as any;
  return sub?.plan || 'free';
}

async function checkRateLimit(db: D1Database, userId: string, plan: string): Promise<{ allowed: boolean; remaining: number; limit: number; reset: number }> {
  const limit = RATE_LIMITS[plan] || RATE_LIMITS.free;
  const windowStart = Math.floor(Date.now() / 60000) * 60;
  const reset = windowStart + 60;
  // Insert a placeholder usage row first, then count. If over limit, delete it.
  const tempId = generateId();
  await db.prepare('INSERT INTO api_usage (id, user_id, endpoint, credits_used) VALUES (?, ?, \'_ratelimit_check\', 0)').bind(tempId, userId).run();
  const result = await db.prepare('SELECT COUNT(*) as cnt FROM api_usage WHERE user_id = ? AND created_at >= datetime(?, \'unixepoch\')').bind(userId, windowStart).first() as any;
  const count = result?.cnt || 0;
  if (count > limit) {
    await db.prepare('DELETE FROM api_usage WHERE id = ?').bind(tempId).run();
    return { allowed: false, remaining: 0, limit, reset };
  }
  return { allowed: true, remaining: Math.max(0, limit - count - 1), limit, reset };
}

async function deductCredits(db: D1Database, userId: string, amount: number): Promise<boolean> {
  const result = await db.prepare('UPDATE credits SET balance = balance - ?, updated_at = datetime(\'now\') WHERE user_id = ? AND balance >= ?').bind(amount, userId, amount).run();
  if (result.meta.changes === 0) return false;
  await db.prepare('INSERT INTO credit_ledger (user_id, amount, type, description) VALUES (?, ?, ?, ?)').bind(userId, -amount, 'api_call', 'Intelligence API call').run();
  return true;
}

async function logApiUsage(db: D1Database, userId: string, endpoint: string) {
  await db.prepare('INSERT INTO api_usage (user_id, endpoint, credits_used) VALUES (?, ?, 1)').bind(userId, endpoint).run();
}

function filterPricing(params: URLSearchParams): ModelPricing[] {
  let results = [...PRICING];
  const provider = params.get('provider');
  const model = params.get('model');
  const maxInput = params.get('max_input_cost');
  const maxOutput = params.get('max_output_cost');
  if (provider) results = results.filter(p => p.provider.toLowerCase() === provider.toLowerCase());
  if (model) results = results.filter(p => p.model.toLowerCase().includes(model.toLowerCase()));
  if (maxInput) results = results.filter(p => p.input_cost_per_1m <= parseFloat(maxInput));
  if (maxOutput) results = results.filter(p => p.output_cost_per_1m <= parseFloat(maxOutput));
  return results;
}

function filterBenchmarks(params: URLSearchParams) {
  let results = [...BENCHMARKS];
  const provider = params.get('provider');
  const model = params.get('model');
  const minMmlu = params.get('min_mmlu');
  const minHumanEval = params.get('min_human_eval');
  if (provider) results = results.filter(b => b.provider.toLowerCase() === provider.toLowerCase());
  if (model) results = results.filter(b => b.model.toLowerCase().includes(model.toLowerCase()));
  if (minMmlu) results = results.filter(b => (b.scores.mmlu || 0) >= parseFloat(minMmlu));
  if (minHumanEval) results = results.filter(b => (b.scores.human_eval || 0) >= parseFloat(minHumanEval));
  return results;
}

function filterDeprecations(params: URLSearchParams): Deprecation[] {
  let results = [...DEPRECATIONS];
  const provider = params.get('provider');
  const status = params.get('status');
  if (provider) results = results.filter(d => d.provider.toLowerCase() === provider.toLowerCase());
  if (status) results = results.filter(d => d.status === status);
  return results;
}

function filterChanges(params: URLSearchParams) {
  let results = [...CHANGES];
  const provider = params.get('provider');
  const type = params.get('type');
  const since = params.get('since');
  if (provider) results = results.filter(c => c.provider.toLowerCase() === provider.toLowerCase());
  if (type) results = results.filter(c => c.type === type);
  if (since) results = results.filter(c => c.date >= since);
  return results;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      if (method === 'OPTIONS') return cors();

      cleanupRateLimits();

      if (!env.JWT_SECRET) {
        return json({ error: 'Server configuration error' }, 500);
      }
      const jwtSecret = env.JWT_SECRET;

      // Health
      if (path === '/api/health') {
        return json({ status: 'ok', version: DATA_VERSION, timestamp: new Date().toISOString() });
      }

      // Public LLM costs (no auth required, rate-limited, for landing page widget)
      if (path === '/api/public/llm-costs') {
        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (!checkPublicRateLimit(`pub:${clientIp}`, 30, 60000)) {
          return json({ error: 'Rate limit exceeded. Try again shortly.' }, 429);
        }
        // Return key top models for the landing page widget
        const topModels = [
          'gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'claude-opus-4', 'claude-sonnet-4',
          'claude-3-5-haiku', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash',
          'deepseek-chat', 'deepseek-reasoner', 'llama-4-maverick', 'llama-3.1-70b',
          'command-r-plus'
        ];
        const publicPricing = PRICING.filter(p => topModels.includes(p.model));
        return json({
          data: publicPricing,
          meta: { count: publicPricing.length, version: DATA_VERSION, last_updated: LAST_UPDATED }
        });
      }

      // Auth routes
      if (path === '/api/auth/signup' && method === 'POST') {
        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (!checkAuthRateLimit(`auth:${clientIp}`, 5, 300000)) {
          return json({ error: 'Too many attempts. Please try again later.' }, 429);
        }
        const body = await request.json() as any;
        const { email, password, name } = body;
        if (!email || !password) return json({ error: 'Email and password required' }, 400);
        if (password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400);

        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase().trim()).first();
        if (existing) return json({ error: 'Email already registered' }, 409);

        const id = generateId();
        const salt = generateSalt();
        const hash = await hashPassword(password, salt);
        const cleanEmail = email.toLowerCase().trim();
        const vToken = generateVerificationToken();
        const vExpires = new Date(Date.now() + 86400000).toISOString(); // 24h

        const subId = generateId();
        await env.DB.batch([
          env.DB.prepare('INSERT INTO users (id, email, password_hash, password_salt, name, verification_token, verification_expires) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, cleanEmail, hash, salt, name || '', vToken, vExpires),
          env.DB.prepare('INSERT INTO credits (user_id, balance) VALUES (?, 5000)').bind(id),
          env.DB.prepare('INSERT INTO subscriptions (id, user_id, plan, status) VALUES (?, ?, ?, ?)').bind(subId, id, 'free', 'active'),
          env.DB.prepare('INSERT INTO credit_ledger (user_id, amount, type, description) VALUES (?, 5000, ?, ?)').bind(id, 'signup_bonus', '5,000 free credits on signup'),
        ]);

        // Send verification email (non-blocking — don't fail signup if email fails)
        sendVerificationEmail(env, cleanEmail, vToken, getBaseUrl(env)).catch(err => {
          console.error('Failed to send verification email:', err);
        });

        // Don't issue JWT until email is verified
        return json({ message: 'Account created. Check your email to verify.', email: cleanEmail });
      }

      if (path === '/api/auth/login' && method === 'POST') {
        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (!checkAuthRateLimit(`auth:${clientIp}`, 10, 300000)) {
          return json({ error: 'Too many login attempts. Please try again later.' }, 429);
        }
        const body = await request.json() as any;
        const { email, password } = body;
        if (!email || !password) return json({ error: 'Email and password required' }, 400);

        const user = await env.DB.prepare('SELECT id, email, name, password_hash, password_salt, email_verified FROM users WHERE email = ?').bind(email.toLowerCase().trim()).first() as any;
        if (!user) return json({ error: 'Invalid credentials' }, 401);

        let valid = false;
        if (user.password_salt) {
          valid = await verifyPassword(password, user.password_hash, user.password_salt);
        } else {
          const legacyHash = await sha256Hex(password + 'apipoints_salt_v1');
          valid = legacyHash === user.password_hash;
          if (valid) {
            const newSalt = generateSalt();
            const newHash = await hashPassword(password, newSalt);
            await env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?').bind(newHash, newSalt, user.id).run();
          }
        }
        if (!valid) return json({ error: 'Invalid credentials' }, 401);

        if (!user.email_verified) {
          return json({ error: 'Email not verified. Check your inbox or resend the verification email.', unverified: true }, 403);
        }

        const token = await generateToken(user.id, jwtSecret);
        return json({ token, user: { id: user.id, email: user.email, name: user.name } });
      }

      // --- Email verification ---
      if (path === '/api/auth/verify-email' && method === 'POST') {
        const body = await request.json() as any;
        const { token } = body;
        if (!token) return json({ error: 'Token required' }, 400);

        const user = await env.DB.prepare('SELECT id, email, name, verification_expires FROM users WHERE verification_token = ?').bind(token).first() as any;
        if (!user) return json({ error: 'Invalid verification link' }, 400);
        if (user.verification_expires && new Date(user.verification_expires) < new Date()) {
          return json({ error: 'Verification link expired. Please request a new one.' }, 400);
        }

        await env.DB.prepare('UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires = NULL, updated_at = datetime(\'now\') WHERE id = ?').bind(user.id).run();

        sendWelcomeEmail(env, user.email, user.name).catch(err => {
          console.error('Failed to send welcome email:', err);
        });

        const jwtToken = await generateToken(user.id, jwtSecret);
        return json({ message: 'Email verified', token: jwtToken, user: { id: user.id, email: user.email, name: user.name } });
      }

      if (path === '/api/auth/resend-verification' && method === 'POST') {
        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (!checkAuthRateLimit(`auth:${clientIp}`, 3, 300000)) {
          return json({ error: 'Too many attempts. Try again later.' }, 429);
        }
        const body = await request.json() as any;
        const { email } = body;
        if (!email) return json({ error: 'Email required' }, 400);

        const cleanEmail = email.toLowerCase().trim();
        const user = await env.DB.prepare('SELECT id, email_verified FROM users WHERE email = ?').bind(cleanEmail).first() as any;
        if (!user) return json({ message: 'If an account exists with that email, a verification link has been sent.' });
        if (user.email_verified) return json({ message: 'Email already verified. You can log in.' });

        const vToken = generateVerificationToken();
        const vExpires = new Date(Date.now() + 86400000).toISOString();
        await env.DB.prepare('UPDATE users SET verification_token = ?, verification_expires = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(vToken, vExpires, user.id).run();

        sendVerificationEmail(env, cleanEmail, vToken, getBaseUrl(env)).catch(err => {
          console.error('Failed to resend verification email:', err);
        });

        return json({ message: 'If an account exists with that email, a verification link has been sent.' });
      }

      // --- Password reset ---
      if (path === '/api/auth/forgot-password' && method === 'POST') {
        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (!checkAuthRateLimit(`auth:${clientIp}`, 5, 300000)) {
          return json({ error: 'Too many attempts. Try again later.' }, 429);
        }
        const body = await request.json() as any;
        const { email } = body;
        if (!email) return json({ error: 'Email required' }, 400);

        const cleanEmail = email.toLowerCase().trim();
        const user = await env.DB.prepare('SELECT id, email FROM users WHERE email = ?').bind(cleanEmail).first() as any;
        if (!user) return json({ message: 'If an account exists with that email, a reset link has been sent.' });

        const resetToken = generateVerificationToken();
        const resetExpires = new Date(Date.now() + 3600000).toISOString();
        await env.DB.prepare('UPDATE users SET password_reset_token = ?, password_reset_expires = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(resetToken, resetExpires, user.id).run();

        sendPasswordResetEmail(env, cleanEmail, resetToken, getBaseUrl(env)).catch(err => {
          console.error('Failed to send password reset email:', err);
        });

        return json({ message: 'If an account exists with that email, a reset link has been sent.' });
      }

      if (path === '/api/auth/reset-password' && method === 'POST') {
        const body = await request.json() as any;
        const { token, password } = body;
        if (!token || !password) return json({ error: 'Token and password required' }, 400);
        if (password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400);

        const user = await env.DB.prepare('SELECT id, email, name, password_reset_expires FROM users WHERE password_reset_token = ?').bind(token).first() as any;
        if (!user) return json({ error: 'Invalid reset link' }, 400);
        if (user.password_reset_expires && new Date(user.password_reset_expires) < new Date()) {
          return json({ error: 'Reset link expired. Please request a new one.' }, 400);
        }

        const newSalt = generateSalt();
        const newHash = await hashPassword(password, newSalt);
        await env.DB.prepare('UPDATE users SET password_hash = ?, password_salt = ?, password_reset_token = NULL, password_reset_expires = NULL, updated_at = datetime(\'now\') WHERE id = ?').bind(newHash, newSalt, user.id).run();

        const jwtToken = await generateToken(user.id, jwtSecret);
        return json({ message: 'Password reset successfully', token: jwtToken, user: { id: user.id, email: user.email, name: user.name } });
      }

      // Authenticated routes (Bearer token)
      const bearerUser = await getUserFromToken(request, env.DB, jwtSecret);

      // If Bearer auth fails, try API key auth for intelligence endpoints
      let apiKeyUser: { user_id: string; key_id: string } | null = null;
      if (!bearerUser) {
        apiKeyUser = await getUserFromApiKey(request, env.DB);
      }

      const userId = bearerUser?.id || apiKeyUser?.user_id;
      const isApiKeyAuth = !bearerUser && !!apiKeyUser;

      // Intelligence endpoints (accessible via Bearer or x-api-key)
      if (path === '/v1/llm-costs') {
        if (!userId) return json({ error: 'Authentication required. Provide Bearer token or x-api-key header.' }, 401);
        const plan = await getUserPlan(env.DB, userId);
        const rateLimit = await checkRateLimit(env.DB, userId, plan);
        if (!rateLimit.allowed) return json({ error: 'Rate limit exceeded', limit: rateLimit.limit, reset: rateLimit.reset }, 429);
        const deduct = await deductCredits(env.DB, userId, 1);
        if (!deduct) return json({ error: 'Insufficient credits' }, 402);
        await logApiUsage(env.DB, userId, '/v1/llm-costs');
        const pricing = filterPricing(url.searchParams);
        return json({
          data: pricing,
          meta: { count: pricing.length, version: DATA_VERSION, last_updated: LAST_UPDATED },
          rate_limit: { remaining: rateLimit.remaining, limit: rateLimit.limit },
        });
      }

      if (path === '/v1/model-benchmarks') {
        if (!userId) return json({ error: 'Authentication required.' }, 401);
        const plan = await getUserPlan(env.DB, userId);
        const rateLimit = await checkRateLimit(env.DB, userId, plan);
        if (!rateLimit.allowed) return json({ error: 'Rate limit exceeded', limit: rateLimit.limit, reset: rateLimit.reset }, 429);
        const deduct = await deductCredits(env.DB, userId, 1);
        if (!deduct) return json({ error: 'Insufficient credits' }, 402);
        await logApiUsage(env.DB, userId, '/v1/model-benchmarks');
        const benchmarks = filterBenchmarks(url.searchParams);
        return json({
          data: benchmarks,
          meta: { count: benchmarks.length, version: DATA_VERSION, last_updated: LAST_UPDATED },
          rate_limit: { remaining: rateLimit.remaining, limit: rateLimit.limit },
        });
      }

      if (path === '/v1/deprecations') {
        if (!userId) return json({ error: 'Authentication required.' }, 401);
        const plan = await getUserPlan(env.DB, userId);
        const rateLimit = await checkRateLimit(env.DB, userId, plan);
        if (!rateLimit.allowed) return json({ error: 'Rate limit exceeded', limit: rateLimit.limit, reset: rateLimit.reset }, 429);
        const deduct = await deductCredits(env.DB, userId, 1);
        if (!deduct) return json({ error: 'Insufficient credits' }, 402);
        await logApiUsage(env.DB, userId, '/v1/deprecations');
        const deprecations = filterDeprecations(url.searchParams);
        return json({
          data: deprecations,
          meta: { count: deprecations.length, version: DATA_VERSION, last_updated: LAST_UPDATED },
          rate_limit: { remaining: rateLimit.remaining, limit: rateLimit.limit },
        });
      }

      if (path === '/v1/providers') {
        if (!userId) return json({ error: 'Authentication required.' }, 401);
        const plan = await getUserPlan(env.DB, userId);
        const rateLimit = await checkRateLimit(env.DB, userId, plan);
        if (!rateLimit.allowed) return json({ error: 'Rate limit exceeded', limit: rateLimit.limit, reset: rateLimit.reset }, 429);
        const deduct = await deductCredits(env.DB, userId, 1);
        if (!deduct) return json({ error: 'Insufficient credits' }, 402);
        await logApiUsage(env.DB, userId, '/v1/providers');
        const provider = url.searchParams.get('provider');
        let providers = [...PROVIDERS];
        if (provider) providers = providers.filter(p => p.slug.toLowerCase() === provider.toLowerCase());
        return json({
          data: providers,
          meta: { count: providers.length, version: DATA_VERSION, last_updated: LAST_UPDATED },
          rate_limit: { remaining: rateLimit.remaining, limit: rateLimit.limit },
        });
      }

      if (path === '/v1/changes') {
        if (!userId) return json({ error: 'Authentication required.' }, 401);
        const plan = await getUserPlan(env.DB, userId);
        const rateLimit = await checkRateLimit(env.DB, userId, plan);
        if (!rateLimit.allowed) return json({ error: 'Rate limit exceeded', limit: rateLimit.limit, reset: rateLimit.reset }, 429);
        const deduct = await deductCredits(env.DB, userId, 1);
        if (!deduct) return json({ error: 'Insufficient credits' }, 402);
        await logApiUsage(env.DB, userId, '/v1/changes');
        const changes = filterChanges(url.searchParams);
        return json({
          data: changes,
          meta: { count: changes.length, version: DATA_VERSION, last_updated: LAST_UPDATED },
          rate_limit: { remaining: rateLimit.remaining, limit: rateLimit.limit },
        });
      }

      // Cost optimization recommendations
      if (path === '/v1/recommend') {
        if (!userId) return json({ error: 'Authentication required.' }, 401);
        const plan = await getUserPlan(env.DB, userId);
        const rateLimit = await checkRateLimit(env.DB, userId, plan);
        if (!rateLimit.allowed) return json({ error: 'Rate limit exceeded', limit: rateLimit.limit, reset: rateLimit.reset }, 429);
        const deduct = await deductCredits(env.DB, userId, 1);
        if (!deduct) return json({ error: 'Insufficient credits' }, 402);
        await logApiUsage(env.DB, userId, '/v1/recommend');
        const useCase = url.searchParams.get('use_case');
        let recommendations = [...COST_RECOMMENDATIONS];
        if (useCase) recommendations = recommendations.filter(r => r.use_case.toLowerCase().includes(useCase.toLowerCase()));
        return json({
          data: recommendations,
          meta: { count: recommendations.length, version: DATA_VERSION, last_updated: LAST_UPDATED },
          rate_limit: { remaining: rateLimit.remaining, limit: rateLimit.limit },
        });
      }

      // Cost calculator endpoint
      if (path === '/v1/calculate') {
        if (!userId) return json({ error: 'Authentication required.' }, 401);
        const plan = await getUserPlan(env.DB, userId);
        const rateLimit = await checkRateLimit(env.DB, userId, plan);
        if (!rateLimit.allowed) return json({ error: 'Rate limit exceeded', limit: rateLimit.limit, reset: rateLimit.reset }, 429);
        const deduct = await deductCredits(env.DB, userId, 1);
        if (!deduct) return json({ error: 'Insufficient credits' }, 402);
        await logApiUsage(env.DB, userId, '/v1/calculate');
        const model = url.searchParams.get('model');
        const inputTokens = parseInt(url.searchParams.get('input_tokens') || '1000000');
        const outputTokens = parseInt(url.searchParams.get('output_tokens') || '100000');
        const target = PRICING.find(p => p.model === model);
        if (!target) return json({ error: 'Model not found', available_models: PRICING.map(p => p.model) }, 404);
        const inputCost = (inputTokens / 1_000_000) * target.input_cost_per_1m;
        const outputCost = (outputTokens / 1_000_000) * target.output_cost_per_1m;
        const totalCost = inputCost + outputCost;
        return json({
          model: target.model,
          provider: target.provider,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          input_cost: Math.round(inputCost * 10000) / 10000,
          output_cost: Math.round(outputCost * 10000) / 10000,
          total_cost: Math.round(totalCost * 10000) / 10000,
          pricing: { input_per_1m: target.input_cost_per_1m, output_per_1m: target.output_cost_per_1m },
        });
      }

      // Auth-required routes below (Bearer token only)
      if (!bearerUser) {
        if (isApiKeyAuth) return json({ error: 'This endpoint requires Bearer token authentication.' }, 401);
        return json({ error: 'Unauthorized' }, 401);
      }

      // Profile
      if (path === '/api/auth/me' && method === 'GET') {
        const credits = await env.DB.prepare('SELECT balance FROM credits WHERE user_id = ?').bind(bearerUser.id).first();
        const sub = await env.DB.prepare('SELECT plan, status FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').bind(bearerUser.id).first();
        return json({ user: bearerUser, credits: credits?.balance || 0, subscription: sub || { plan: 'free', status: 'active' } });
      }

      // Credits
      if (path === '/api/credits' && method === 'GET') {
        const credits = await env.DB.prepare('SELECT balance FROM credits WHERE user_id = ?').bind(bearerUser.id).first();
        return json({ balance: credits?.balance || 0 });
      }

      if (path === '/api/credits/ledger' && method === 'GET') {
        const ledger = await env.DB.prepare('SELECT * FROM credit_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').bind(bearerUser.id).all();
        return json({ ledger: ledger.results });
      }

      // Agents
      if (path === '/api/agents/list' && method === 'GET') {
        const agents = await env.DB.prepare('SELECT * FROM agents WHERE user_id = ? ORDER BY created_at DESC').bind(bearerUser.id).all();
        return json({ agents: agents.results });
      }

      if (path === '/api/agents/create' && method === 'POST') {
        const body = await request.json() as any;
        const { name, system_prompt, model } = body;
        if (!name) return json({ error: 'Agent name required' }, 400);
        const id = generateId();
        await env.DB.prepare('INSERT INTO agents (id, user_id, name, system_prompt, model) VALUES (?, ?, ?, ?, ?)').bind(id, bearerUser.id, name, system_prompt || '', model || 'gpt-4o-mini').run();
        return json({ id, name });
      }

      if (path.startsWith('/api/agents/') && method === 'DELETE') {
        const agentId = path.split('/').pop();
        const agent = await env.DB.prepare('SELECT id FROM agents WHERE id = ? AND user_id = ?').bind(agentId, bearerUser.id).first();
        if (!agent) return json({ error: 'Agent not found' }, 404);
        await env.DB.prepare('DELETE FROM agents WHERE id = ?').bind(agentId).run();
        return json({ deleted: true });
      }

      // Threshold Alerts
      if (path === '/api/thresholds' && method === 'POST') {
        const body = await request.json() as any;
        const { model_id, cost_threshold, latency_threshold, notification_channel, webhook_url, slack_webhook_url } = body;
        if (!model_id) return json({ error: 'model_id required' }, 400);
        if (cost_threshold == null && latency_threshold == null) return json({ error: 'At least one threshold (cost or latency) required' }, 400);
        if (cost_threshold != null && (typeof cost_threshold !== 'number' || cost_threshold < 0)) return json({ error: 'cost_threshold must be a non-negative number' }, 400);
        if (latency_threshold != null && (typeof latency_threshold !== 'number' || latency_threshold < 0)) return json({ error: 'latency_threshold must be a non-negative number' }, 400);
        const channel = notification_channel || 'email';
        if (!['email', 'webhook', 'slack'].includes(channel)) return json({ error: 'notification_channel must be email, webhook, or slack' }, 400);
        if (channel === 'webhook' && !webhook_url) return json({ error: 'webhook_url required for webhook channel' }, 400);
        if (channel === 'slack' && !slack_webhook_url) return json({ error: 'slack_webhook_url required for slack channel' }, 400);

        const id = generateId();
        await env.DB.prepare('INSERT INTO thresholds (id, user_id, model_id, cost_threshold, latency_threshold, notification_channel, webhook_url, slack_webhook_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, bearerUser.id, model_id, cost_threshold ?? null, latency_threshold ?? null, channel, webhook_url ?? null, slack_webhook_url ?? null).run();
        return json({ id, model_id, cost_threshold: cost_threshold ?? null, latency_threshold: latency_threshold ?? null, notification_channel: channel });
      }

      if (path === '/api/thresholds' && method === 'GET') {
        const modelId = url.searchParams.get('model_id');
        let query = 'SELECT * FROM thresholds WHERE user_id = ?';
        const bindings: any[] = [bearerUser.id];
        if (modelId) { query += ' AND model_id = ?'; bindings.push(modelId); }
        query += ' ORDER BY created_at DESC';
        const result = await env.DB.prepare(query).bind(...bindings).all();
        return json({ thresholds: result.results });
      }

      if (path.startsWith('/api/thresholds/') && method === 'DELETE') {
        const thresholdId = path.split('/').pop();
        const threshold = await env.DB.prepare('SELECT id FROM thresholds WHERE id = ? AND user_id = ?').bind(thresholdId, bearerUser.id).first();
        if (!threshold) return json({ error: 'Threshold not found' }, 404);
        await env.DB.prepare('DELETE FROM threshold_notifications WHERE threshold_id = ?').bind(thresholdId).run();
        await env.DB.prepare('DELETE FROM thresholds WHERE id = ?').bind(thresholdId).run();
        return json({ deleted: true });
      }

      // API Key management
      if (path === '/api/api-keys/create' && method === 'POST') {
        const body = await request.json() as any;
        const { name } = body;
        const rawKey = generateApiKey();
        const keyHash = await sha256Hex(rawKey);
        const id = generateId();
        const prefix = rawKey.slice(0, 12);
        await env.DB.prepare('INSERT INTO api_keys (id, user_id, key_hash, key_prefix, name) VALUES (?, ?, ?, ?, ?)').bind(id, bearerUser.id, keyHash, prefix, name || 'API Key').run();
        return json({ key: rawKey, id, prefix });
      }

      if (path === '/api/api-keys/list' && method === 'GET') {
        const keys = await env.DB.prepare('SELECT id, key_prefix, name, active, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC').bind(bearerUser.id).all();
        return json({ keys: keys.results });
      }

      if (path === '/api/api-keys/revoke' && method === 'POST') {
        const body = await request.json() as any;
        const { key_id } = body;
        if (!key_id) return json({ error: 'key_id required' }, 400);
        const key = await env.DB.prepare('SELECT id FROM api_keys WHERE id = ? AND user_id = ?').bind(key_id, bearerUser.id).first();
        if (!key) return json({ error: 'Key not found' }, 404);
        await env.DB.prepare('UPDATE api_keys SET active = 0 WHERE id = ?').bind(key_id).run();
        return json({ revoked: true });
      }

      // Stripe Checkout
      if (path === '/api/billing/checkout' && method === 'POST') {
        if (!env.STRIPE_SECRET_KEY) return json({ error: 'Stripe not configured' }, 503);
        const body = await request.json() as any;
        const { plan } = body;
        const priceMap: Record<string, string> = {
          starter: env.STRIPE_PRICE_STARTER || '',
          growth: env.STRIPE_PRICE_GROWTH || '',
          enterprise: env.STRIPE_PRICE_ENTERPRISE || '',
        };
        const priceId = priceMap[plan];
        if (!priceId) return json({ error: 'Invalid plan' }, 400);
        const sub = await env.DB.prepare('SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? AND stripe_customer_id IS NOT NULL LIMIT 1').bind(bearerUser.id).first() as any;
        const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            'payment_method_types[]': 'card',
            mode: 'subscription',
            'line_items[0][price]': priceId,
            'line_items[0][quantity]': '1',
            success_url: `${env.API_POINTS_URL || 'https://apipoints.pages.dev'}/dashboard/upgrade.html?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${env.API_POINTS_URL || 'https://apipoints.pages.dev'}/dashboard/upgrade.html?checkout=canceled`,
            'metadata[user_id]': bearerUser.id,
            'metadata[plan]': plan,
            'subscription_data[metadata][user_id]': bearerUser.id,
            'subscription_data[metadata][plan]': plan,
            ...(sub?.stripe_customer_id ? { customer: sub.stripe_customer_id } : { customer_email: bearerUser.email }),
          } as any),
        });
        const session = await res.json() as any;
        if (session.error) return json({ error: session.error.message }, 400);
        return json({ url: session.url, session_id: session.id });
      }

      // Stripe Webhook (no user auth — verified via HMAC)
      if (path === '/api/billing/webhook' && method === 'POST') {
        const sig = request.headers.get('stripe-signature');
        if (!sig || !env.STRIPE_WEBHOOK_SECRET) return json({ error: 'Missing signature or webhook secret' }, 400);

        const rawBody = await request.text();
        let event: any;
        try {
          const elements = sig.split(',').reduce((acc: any, part) => {
            const [key, val] = part.split('=');
            acc[key] = val;
            return acc;
          }, {});
          const t = elements.t;
          const v1 = elements.v1;
          // Reject events older than 5 minutes (replay protection)
          const timestamp = parseInt(t, 10);
          if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > 300) {
            return json({ error: 'Webhook timestamp too old' }, 400);
          }
          const signedPayload = `${t}.${rawBody}`;
          const valid = await hmacVerify(signedPayload, v1, env.STRIPE_WEBHOOK_SECRET);
          if (!valid) throw new Error('Signature mismatch');
          event = JSON.parse(rawBody);
        } catch {
          return json({ error: 'Webhook verification failed' }, 400);
        }

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          const userId = session.metadata?.user_id;
          const plan = session.metadata?.plan;
          if (userId && plan) {
            const creditsAmount = plan === 'starter' ? 5000000 : plan === 'growth' ? 20000000 : 50000000;
            await env.DB.prepare('UPDATE credits SET balance = balance + ?, updated_at = datetime(\'now\') WHERE user_id = ?').bind(creditsAmount, userId).run();
            await env.DB.prepare('UPDATE subscriptions SET plan = ?, status = \'active\', stripe_subscription_id = ?, stripe_customer_id = ?, updated_at = datetime(\'now\') WHERE user_id = ?').bind(plan, session.subscription || '', session.customer || '', userId).run();
            await env.DB.prepare('INSERT INTO credit_ledger (user_id, amount, type, description) VALUES (?, ?, ?, ?)').bind(userId, creditsAmount, 'subscription_activated', `${plan} plan activated`).run();

            // Send billing confirmation email (non-blocking)
            const user = await env.DB.prepare('SELECT email, name FROM users WHERE id = ?').bind(userId).first() as any;
            if (user) {
              sendBillingConfirmation(env, user.email, user.name, plan, getBaseUrl(env)).catch(err => {
                console.error('Failed to send billing confirmation:', err);
              });
            }
          }
        }

        if (event.type === 'customer.subscription.deleted') {
          const subscription = event.data.object;
          await env.DB.prepare('UPDATE subscriptions SET plan = \'free\', status = \'canceled\', updated_at = datetime(\'now\') WHERE stripe_subscription_id = ?').bind(subscription.id).run();
        }

        if (event.type === 'customer.subscription.updated') {
          const subscription = event.data.object;
          const metadata = subscription.metadata || {};
          const userId = metadata.user_id;
          const plan = metadata.plan;
          if (userId && plan) {
            await env.DB.prepare('UPDATE subscriptions SET plan = ?, status = ?, updated_at = datetime(\'now\') WHERE stripe_subscription_id = ?').bind(plan, subscription.status, subscription.id).run();
          }
        }

        return json({ received: true });
      }

      return json({ error: 'Not found' }, 404);
    } catch (err: any) {
      console.error('Worker error:', err?.message || err);
      return json({ error: 'Internal server error' }, 500);
    }
  },

  // Cron handler: runs every 5 minutes via wrangler.toml [[triggers]]
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    try {
      // Fetch all thresholds
      const { results: thresholds } = await env.DB.prepare('SELECT t.*, u.email FROM thresholds t JOIN users u ON t.user_id = u.id').all() as any;
      if (!thresholds || thresholds.length === 0) return;

      // Build a lookup of current model pricing from intelligence data
      const pricingMap = new Map<string, ModelPricing>();
      for (const p of PRICING) pricingMap.set(p.model, p);

      // Benchmark lookup for latency (mt_bench as proxy)
      const benchmarkMap = new Map<string, number>();
      for (const b of BENCHMARKS) { if (b.scores.mt_bench) benchmarkMap.set(b.model, b.scores.mt_bench); }

      for (const t of thresholds) {
        const model = pricingMap.get(t.model_id);
        const benchmark = benchmarkMap.get(t.model_id);

        let crossed = false;
        let event = '' as ThresholdPayload['event'];
        let currentValue = 0;
        let thresholdVal = 0;

        // Check cost threshold
        if (t.cost_threshold != null && model) {
          const avgCost = (model.input_cost_per_1m + model.output_cost_per_1m) / 2;
          if (avgCost >= t.cost_threshold) {
            crossed = true;
            event = 'cost_threshold_crossed';
            currentValue = avgCost;
            thresholdVal = t.cost_threshold;
          }
        }

        // Check latency threshold
        if (!crossed && t.latency_threshold != null && benchmark != null) {
          // mt_bench is on a 1-10 scale; convert to approximate ms (lower is better)
          // We treat mt_bench score * 100 as a latency proxy: higher score = lower effective latency
          // For threshold check: if benchmark score * 100 >= threshold, it means latency is acceptable
          // We invert: if (10 - benchmark) * 100 >= threshold, latency is crossed
          const latencyProxy = (10 - benchmark) * 100;
          if (latencyProxy >= t.latency_threshold) {
            crossed = true;
            event = 'latency_threshold_crossed';
            currentValue = latencyProxy;
            thresholdVal = t.latency_threshold;
          }
        }

        if (!crossed) continue;

        // Rate limit: max 1 notification per threshold per 10 minutes
        const tenMinAgo = new Date(Date.now() - 600000).toISOString();
        const recent = await env.DB.prepare('SELECT id FROM threshold_notifications WHERE threshold_id = ? AND notified_at > ? LIMIT 1').bind(t.id, tenMinAgo).first();
        if (recent) continue;

        // Send notification
        const payload: ThresholdPayload = {
          model: t.model_id,
          event,
          current_value: currentValue,
          threshold: thresholdVal,
          timestamp: new Date().toISOString(),
        };

        const sent = await sendThresholdNotification(env, t.notification_channel, payload, t.email, t.webhook_url, t.slack_webhook_url);

        // Log notification attempt
        if (sent) {
          await env.DB.prepare('INSERT INTO threshold_notifications (threshold_id, event_type) VALUES (?, ?)').bind(t.id, event).run();
        }
      }
    } catch (err: any) {
      console.error('Cron threshold check error:', err?.message || err);
    }
  },
};
