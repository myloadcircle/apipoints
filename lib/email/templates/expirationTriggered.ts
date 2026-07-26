export function expirationTriggeredTemplate(data: { requestId: string; requestUrl: string }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Request #${data.requestId} Expired</h2>
      <p>This request has expired.</p>
      <a href="${data.requestUrl}" style="display: inline-block; background: #dc2626; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Request
      </a>
    </div>
  `
}
