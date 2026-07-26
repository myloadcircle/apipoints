export function mentionAddedTemplate(data: { actorName: string; requestId: string; requestUrl: string }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You Were Mentioned</h2>
      <p><strong>${data.actorName}</strong> mentioned you in Request #${data.requestId}</p>
      <a href="${data.requestUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Request
      </a>
    </div>
  `
}
