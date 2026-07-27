// Resend email service for APIPoints
// Docs: https://resend.com/docs/api-reference/emails/send-email

const RESEND_API = 'https://api.resend.com';
const FROM_EMAIL = 'APIPoints <noreply@apipoints.dev>';

interface EmailEnv {
  RESEND_API_KEY?: string;
}

async function sendResend(env: EmailEnv, to: string, subject: string, html: string): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured — email not sent to', to);
    return false;
  }
  try {
    const res = await fetch(`${RESEND_API}/emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Resend API error:', res.status, err);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('Resend fetch error:', err?.message);
    return false;
  }
}

// ---------- Email Templates ----------

function verificationEmailHtml(token: string, baseUrl: string): string {
  const url = `${baseUrl}/verify-email.html?token=${token}`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <tr><td style="padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:24px;font-weight:700;color:#fff;font-family:Georgia,serif;">API<span style="color:#a3e635;">Points</span></div>
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#fff;font-family:Georgia,serif;">Verify your email</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#888;line-height:1.6;">
            You're almost in. Click below to verify your email and activate your APIPoints account.
          </p>
          <a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#a3e635,#cbe86b);color:#111;font-weight:700;font-size:14px;text-decoration:none;border-radius:10px;">
            Verify Email →
          </a>
          <p style="margin:32px 0 0;font-size:12px;color:#555;line-height:1.6;">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </td></tr>
        <tr><td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:11px;color:#444;">© 2026 APIPoints — apipoints.dev</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function passwordResetEmailHtml(token: string, baseUrl: string): string {
  const url = `${baseUrl}/reset-password.html?token=${token}`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <tr><td style="padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:24px;font-weight:700;color:#fff;font-family:Georgia,serif;">API<span style="color:#a3e635;">Points</span></div>
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#fff;font-family:Georgia,serif;">Reset your password</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#888;line-height:1.6;">
            Click below to set a new password for your APIPoints account.
          </p>
          <a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#a3e635,#cbe86b);color:#111;font-weight:700;font-size:14px;text-decoration:none;border-radius:10px;">
            Reset Password →
          </a>
          <p style="margin:32px 0 0;font-size:12px;color:#555;line-height:1.6;">
            This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
          </p>
        </td></tr>
        <tr><td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:11px;color:#444;">© 2026 APIPoints — apipoints.dev</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function welcomeEmailHtml(name: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <tr><td style="padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:24px;font-weight:700;color:#fff;font-family:Georgia,serif;">API<span style="color:#a3e635;">Points</span></div>
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#fff;font-family:Georgia,serif;">Welcome aboard${name ? ', ' + name : ''}! 🎉</h1>
          <p style="margin:0 0 16px;font-size:14px;color:#888;line-height:1.6;">
            Your account is live. Here's what you get right now:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="padding:12px 16px;background:rgba(163,230,53,0.08);border-radius:8px;border:1px solid rgba(163,230,53,0.15);">
              <span style="color:#a3e635;font-weight:700;font-size:14px;">5,000 free API credits</span>
              <br><span style="color:#888;font-size:12px;">Access LLM pricing, benchmarks, deprecations, and cost recommendations</span>
            </td></tr>
          </table>
          <p style="margin:0 0 24px;font-size:14px;color:#888;line-height:1.6;">
            Start by getting your API key from the dashboard:
          </p>
          <a href="https://apipoints.dev/dashboard.html" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#a3e635,#cbe86b);color:#111;font-weight:700;font-size:14px;text-decoration:none;border-radius:10px;">
            Go to Dashboard →
          </a>
          <p style="margin:32px 0 0;font-size:12px;color:#555;line-height:1.6;">
            Questions? Just reply to this email.
          </p>
        </td></tr>
        <tr><td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:11px;color:#444;">© 2026 APIPoints — apipoints.dev</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function billingConfirmationHtml(name: string, plan: string, baseUrl: string): string {
  const amount = plan === 'starter' ? '£49' : plan === 'growth' ? '£149' : '£499';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <tr><td style="padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:24px;font-weight:700;color:#fff;font-family:Georgia,serif;">API<span style="color:#a3e635;">Points</span></div>
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#fff;font-family:Georgia,serif;">Payment confirmed${name ? ', ' + name : ''}</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#888;line-height:1.6;">
            Your <strong style="color:#a3e635;">${plan.charAt(0).toUpperCase() + plan.slice(1)}</strong> plan is now active. You've been charged <strong style="color:#fff;">${amount}/mo</strong>.
          </p>
          <a href="${baseUrl}/dashboard.html" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#a3e635,#cbe86b);color:#111;font-weight:700;font-size:14px;text-decoration:none;border-radius:10px;">
            Go to Dashboard →
          </a>
          <p style="margin:32px 0 0;font-size:12px;color:#555;line-height:1.6;">
            Manage your subscription anytime from your dashboard.
          </p>
        </td></tr>
        <tr><td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:11px;color:#444;">© 2026 APIPoints — apipoints.dev</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function deprecationAlertHtml(model: string, provider: string, date: string, baseUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <tr><td style="padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:24px;font-weight:700;color:#fff;font-family:Georgia,serif;">API<span style="color:#a3e635;">Points</span></div>
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 16px;font-size:22px;color:#fff;font-family:Georgia,serif;">⚠️ Deprecation Alert</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#888;line-height:1.6;">
            <strong style="color:#fff;">${provider}</strong> has announced the deprecation of <strong style="color:#ef4444;">${model}</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="padding:16px;background:rgba(239,68,68,0.08);border-radius:8px;border:1px solid rgba(239,68,68,0.15);">
              <span style="color:#ef4444;font-weight:700;font-size:13px;">SUNSET DATE: ${date}</span>
              <br><span style="color:#888;font-size:12px;">Migrate to an alternative model before this date.</span>
            </td></tr>
          </table>
          <a href="${baseUrl}/v1/deprecations?provider=${encodeURIComponent(provider)}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#a3e635,#cbe86b);color:#111;font-weight:700;font-size:14px;text-decoration:none;border-radius:10px;">
            View Alternatives →
          </a>
        </td></tr>
        <tr><td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:11px;color:#444;">© 2026 APIPoints — apipoints.dev</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ---------- Public API ----------

export async function sendVerificationEmail(env: EmailEnv, email: string, token: string, baseUrl: string): Promise<boolean> {
  return sendResend(env, email, 'Verify your APIPoints email', verificationEmailHtml(token, baseUrl));
}

export async function sendPasswordResetEmail(env: EmailEnv, email: string, token: string, baseUrl: string): Promise<boolean> {
  return sendResend(env, email, 'Reset your APIPoints password', passwordResetEmailHtml(token, baseUrl));
}

export async function sendWelcomeEmail(env: EmailEnv, email: string, name: string): Promise<boolean> {
  return sendResend(env, email, 'Welcome to APIPoints! 🎉', welcomeEmailHtml(name));
}

export async function sendBillingConfirmation(env: EmailEnv, email: string, name: string, plan: string, baseUrl: string): Promise<boolean> {
  return sendResend(env, email, `APIPoints — ${plan} plan activated`, billingConfirmationHtml(name, plan, baseUrl));
}

export async function sendDeprecationAlert(env: EmailEnv, email: string, model: string, provider: string, date: string, baseUrl: string): Promise<boolean> {
  return sendResend(env, email, `⚠️ ${provider} ${model} is being deprecated`, deprecationAlertHtml(model, provider, date, baseUrl));
}

export async function sendBatchDeprecationAlerts(env: EmailEnv, emails: string[], model: string, provider: string, date: string, baseUrl: string): Promise<void> {
  // Resend batch endpoint: up to 100 emails
  if (!env.RESEND_API_KEY || emails.length === 0) return;
  try {
    const batch = emails.map(to => ({
      from: FROM_EMAIL,
      to: [to],
      subject: `⚠️ ${provider} ${model} is being deprecated`,
      html: deprecationAlertHtml(model, provider, date, baseUrl),
    }));
    const res = await fetch(`${RESEND_API}/emails/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Resend batch error:', res.status, err);
    }
  } catch (err: any) {
    console.error('Resend batch fetch error:', err?.message);
  }
}
