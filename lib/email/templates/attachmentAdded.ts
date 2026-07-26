export function attachmentAddedTemplate(data: { requestId: string; filename: string; requestUrl: string }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Attachment Added to Request #${data.requestId}</h2>
      <p>File: <strong>${data.filename}</strong></p>
      <a href="${data.requestUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Request
      </a>
    </div>
  `
}
