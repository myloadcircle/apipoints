export function ownershipTransferredTemplate(data: { requestId: string; fromUserId: string; toUserId: string; requestUrl: string }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Ownership Transferred for Request #${data.requestId}</h2>
      <p>Request ownership transferred from <strong>${data.fromUserId}</strong> to <strong>${data.toUserId}</strong>.</p>
      <a href="${data.requestUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Request
      </a>
    </div>
  `
}
