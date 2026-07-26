import { listAnnouncements } from '@/lib/actions/announcements'
import { createAnnouncement } from '@/lib/actions/announcements'

export const dynamic = 'force-dynamic'

export default async function AnnouncementsPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const announcements = await listAnnouncements(apiId)

  async function action(formData: FormData) {
    'use server'
    const title = String(formData.get('title'))
    const body = String(formData.get('body'))
    await createAnnouncement(apiId, title, body)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Announcements</h1>

      <form action={action} className="space-y-4">
        <input
          name="title"
          placeholder="Announcement title"
          className="border p-2 rounded w-full"
        />
        <textarea
          name="body"
          placeholder="Write your announcement..."
          className="border p-2 rounded w-full h-32"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Publish Announcement
        </button>
      </form>

      <div className="space-y-4">
        {announcements.length === 0 && (
          <p className="text-gray-600">No announcements yet.</p>
        )}
        {announcements.map((a: any) => (
          <div key={a.id} className="border p-4 rounded bg-gray-50">
            <h2 className="font-bold">{a.title}</h2>
            <p className="text-gray-700 whitespace-pre-line">{a.body}</p>
            <p className="text-xs text-gray-500 mt-2">{a.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
