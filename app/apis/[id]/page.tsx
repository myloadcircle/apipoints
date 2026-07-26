import { getAPI } from '@/lib/actions/get'
import TestConsole from '@/components/TestConsole'

export const dynamic = 'force-dynamic'

export default async function APIPage({ params }: { params: { id: string } }) {
  const api = await getAPI(params.id)

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">{api.name}</h1>
      <p className="text-gray-600">{api.description}</p>
      <TestConsole api={api} />
    </div>
  )
}
