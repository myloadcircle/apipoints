export function commentCreatedTemplate(data: { actorName: string; requestId: string; comment: string; requestUrl: string }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Comment on Request #${data.requestId}</h2>
      <p><strong>${data.actorName}</strong> commented:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
        ${data.comment}
      </div>
      <a href="${data.requestUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Request
      </a>
    </div>
  `
}
