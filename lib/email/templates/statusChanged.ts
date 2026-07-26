export function statusChangedTemplate(data: { requestId: string; oldStatus: string; newStatus: string; requestUrl: string }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Request #${data.requestId} Status Changed</h2>
      <p>Status changed from <strong>${data.oldStatus}</strong> to <strong>${data.newStatus}</strong></p>
      <a href="${data.requestUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Request
      </a>
    </div>
  `
}
