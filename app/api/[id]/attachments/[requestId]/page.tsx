import { listAttachments } from '@/server/list-attachments'
import { deleteAttachment } from '@/server/delete-attachment'

export const dynamic = 'force-dynamic'

export default async function AttachmentsPage({ params }: any) {
  const apiId = params.id
  const requestId = params.requestId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const attachments = await listAttachments(requestId, userId)

  async function upload(formData: FormData) {
    'use server'
    const res = await fetch(`/api/requests/${requestId}/attachments/upload`, {
      method: 'POST',
      body: formData
    })
    if (!res.ok) throw new Error('Upload failed')
  }

  async function remove(formData: FormData) {
    'use server'
    const attachmentId = String(formData.get('attachmentId'))
    const res = await fetch(`/api/requests/${requestId}/attachments/${attachmentId}/delete`, {
      method: 'DELETE'
    })
    if (!res.ok) throw new Error('Delete failed')
  }

  async function getDownloadUrl(attachmentId: string) {
    const res = await fetch(`/api/requests/${requestId}/attachments/${attachmentId}/download`)
    if (!res.ok) return null
    const data = await res.json()
    return data.url
  }

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Attachments</h1>

      <form action={upload} className='space-y-4' encType='multipart/form-data'>
        <input
          type='file'
          name='file'
          className='border p-2 rounded w-full'
        />
        <button className='px-4 py-2 bg-black text-white rounded'>
          Upload Attachment
        </button>
      </form>

      <div className='space-y-6'>
        <h2 className='text-xl font-semibold'>Files</h2>

        {attachments.map(async (a: any) => {
          const url = await getDownloadUrl(a.id)
          return (
            <div key={a.id} className='border p-4 rounded bg-gray-50 space-y-2'>
              <p className='font-bold'>{a.filename}</p>
              <p className='text-sm text-gray-700'>Size: {a.size} bytes</p>
              <p className='text-sm text-gray-700'>Type: {a.type}</p>

              {url && (
                <a
                  href={url}
                  target='_blank'
                  className='text-blue-600 underline text-sm'
                >
                  Download
                </a>
              )}

              <form action={remove}>
                <input type='hidden' name='attachmentId' value={a.id} />
                <button className='px-3 py-1 bg-red-600 text-white rounded text-sm'>
                  Delete
                </button>
              </form>

              <p className='text-xs text-gray-500'>{a.created_at}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
