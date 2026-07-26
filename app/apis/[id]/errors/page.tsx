import { listAPIErrors } from '@/lib/actions/api-errors-v2'

export const dynamic = 'force-dynamic'

export default async function ErrorsPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const errors = await listAPIErrors(apiId)

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Error Logs</h1>

      {errors.length === 0 && (
        <p className="text-gray-600">No errors recorded.</p>
      )}

      <div className="space-y-4">
        {errors.map((err: any) => (
          <div key={err.id} className="border p-4 rounded bg-red-50">
            <p className="font-bold text-red-700">{err.message}</p>
            <p className="text-sm text-gray-700">
              User: {err.users?.email || 'Unknown'}
            </p>
            <p className="text-sm text-gray-700">
              Request ID: {err.request_id}
            </p>

            {err.stack && (
              <pre className="text-xs bg-white p-3 rounded border mt-2 overflow-auto">
                {err.stack}
              </pre>
            )}

            <p className="text-xs text-gray-500 mt-2">{err.created_at}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
