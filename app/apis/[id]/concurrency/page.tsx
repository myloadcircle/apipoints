import { getConcurrencyLimit } from '@/lib/actions/concurrency'
import { getActiveRequestCount } from '@/lib/actions/concurrency'

export const dynamic = 'force-dynamic'

export default async function ConcurrencyPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const limit = await getConcurrencyLimit(userId, apiId)
  const active = await getActiveRequestCount(userId, apiId)

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Concurrency Limits</h1>

      <div className="border p-4 rounded bg-gray-50 space-y-2">
        <p className="text-lg font-semibold">Current Limit: {limit}</p>
        <p className="text-gray-700">Active Requests: {active}</p>
      </div>

      <p className="text-sm text-gray-600">
        Concurrency limits prevent overload by restricting how many requests you can run at the same time.
      </p>
    </div>
  )
}
