// Notification engine for Threshold Alerts
// Supports: email (Resend), Slack (webhook), generic webhook

interface ThresholdNotificationEnv {
  RESEND_API_KEY?: string;
}

export interface ThresholdPayload {
  model: string;
  event: 'cost_threshold_crossed' | 'latency_threshold_crossed';
  current_value: number;
  threshold: number;
  timestamp: string;
}

// --- Email notification ---
async function sendThresholdEmail(
  env: ThresholdNotificationEnv,
  to: string,
  payload: ThresholdPayload
): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false;
  const isCost = payload.event === 'cost_threshold_crossed';
  const metric = isCost ? 'Cost' : 'Latency';
  const current = isCost ? `$${payload.current_value.toFixed(4)}/1M tokens` : `${payload.current_value}ms`;
  const limit = isCost ? `$${payload.threshold.toFixed(4)}/1M tokens` : `${payload.threshold}ms`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#111;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
<tr><td style="padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
<div style="font-size:24px;font-weight:700;color:#fff;font-family:Georgia,serif;">API<span style="color:#a3e635;">Points</span></div>
</td></tr>
<tr><td style="padding:40px;">
<h1 style="margin:0 0 16px;font-size:20px;color:#ef4444;font-family:Georgia,serif;">⚠️ ${metric} Threshold Alert</h1>
<p style="margin:0 0 20px;font-size:14px;color:#888;line-height:1.6;">
The <strong style="color:#fff;">${metric.toLowerCase()}</strong> for <strong style="color:var(--lime);">${payload.model}</strong> has crossed your threshold.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="padding:16px;background:rgba(239,68,68,0.08);border-radius:8px;border:1px solid rgba(239,68,68,0.15);">
<span style="color:#ef4444;font-weight:700;font-size:13px;">CURRENT: ${current}</span>
<br><span style="color:#888;font-size:12px;">Your threshold: ${limit}</span>
</td></tr>
</table>
<p style="margin:0;font-size:12px;color:#555;">${payload.timestamp}</p>
</td></tr>
<tr><td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
<p style="margin:0;font-size:11px;color:#444;">© 2026 APIPoints — apipoints.dev</p>
</td></tr>
</table></td></tr></table>
</body></html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'APIPoints <noreply@apipoints.dev>', to: [to], subject: `⚠️ ${metric} alert: ${payload.model}`, html }),
    });
    return res.ok;
  } catch { return false; }
}

// --- Slack notification ---
async function sendSlackNotification(webhookUrl: string, payload: ThresholdPayload): Promise<boolean> {
  const isCost = payload.event === 'cost_threshold_crossed';
  const emoji = isCost ? '💰' : '⏱️';
  const metric = isCost ? 'Cost' : 'Latency';
  const current = isCost ? `$${payload.current_value.toFixed(4)}/1M` : `${payload.current_value}ms`;
  const limit = isCost ? `$${payload.threshold.toFixed(4)}/1M` : `${payload.threshold}ms`;

  const slackPayload = {
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: `${emoji} ${metric} Threshold Alert` } },
      { type: 'section', fields: [
        { type: 'mrkdwn', text: `*Model:*\n${payload.model}` },
        { type: 'mrkdwn', text: `*Event:*\n${payload.event}` },
        { type: 'mrkdwn', text: `*Current:*\n${current}` },
        { type: 'mrkdwn', text: `*Threshold:*\n${limit}` },
      ]},
      { type: 'context', elements: [{ type: 'mrkdwn', text: `APIPoints Threshold Alerts • ${payload.timestamp}` }] },
    ],
  };

  try {
    const res = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(slackPayload) });
    return res.ok;
  } catch { return false; }
}

// --- Generic webhook notification ---
async function sendWebhookNotification(webhookUrl: string, payload: ThresholdPayload): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'apipoints_threshold_alerts',
        model: payload.model,
        event: payload.event,
        current_value: payload.current_value,
        threshold: payload.threshold,
        timestamp: payload.timestamp,
      }),
    });
    return res.ok;
  } catch { return false; }
}

// --- Public API ---
export async function sendThresholdNotification(
  env: ThresholdNotificationEnv,
  channel: string,
  payload: ThresholdPayload,
  userEmail: string,
  webhookUrl?: string | null,
  slackWebhookUrl?: string | null,
): Promise<boolean> {
  switch (channel) {
    case 'email':
      return sendThresholdEmail(env, userEmail, payload);
    case 'slack':
      if (!slackWebhookUrl) return false;
      return sendSlackNotification(slackWebhookUrl, payload);
    case 'webhook':
      if (!webhookUrl) return false;
      return sendWebhookNotification(webhookUrl, payload);
    default:
      return false;
  }
}
