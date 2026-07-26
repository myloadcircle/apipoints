import { publishAPI } from '@/lib/actions/publish'
import { redirect } from 'next/navigation'

export default function PublishPage() {
  async function action(formData: FormData) {
    'use server'
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      endpoint: formData.get('endpoint'),
      price_per_request: Number(formData.get('price_per_request'))
    }
    await publishAPI(formData)
    redirect('/apis')
  }

  return (
    <form action={action} className="p-8 space-y-4">
      <input name="name" placeholder="API Name" className="border p-2 w-full" />
      <textarea name="description" placeholder="Description" className="border p-2 w-full" />
      <input name="endpoint" placeholder="Endpoint URL" className="border p-2 w-full" />
      <input name="price_per_request" placeholder="Price per request" className="border p-2 w-full" />
      <button className="px-4 py-2 bg-black text-white rounded">Publish</button>
    </form>
  )
}
