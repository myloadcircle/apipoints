import { listTags } from '@/lib/actions/tags'
import { addTag } from '@/lib/actions/tags'

export const dynamic = 'force-dynamic'

export default async function TagsPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const tags = await listTags(apiId)

  async function action(formData: FormData) {
    'use server'
    const tag = String(formData.get('tag'))
    await addTag(apiId, tag)
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Tags</h1>

      <form action={action} className="space-y-4">
        <input
          name="tag"
          placeholder="Add a tag (e.g. ai, finance, tools)"
          className="border p-2 rounded w-full"
        />
        <button className="px-4 py-2 bg-black text-white rounded">
          Add Tag
        </button>
      </form>

      <div className="flex gap-2 flex-wrap">
        {tags.length === 0 && (
          <p className="text-gray-600">No tags yet.</p>
        )}
        {tags.map((tag: string) => (
          <span
            key={tag}
            className="px-3 py-1 bg-gray-200 rounded-full text-sm"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
