import { exportRequests } from '@/lib/actions/export-requests'

export const dynamic = 'force-dynamic'

export default async function ExportPage({ params }: { params: { id: string } }) {
  const apiId = params.id
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  const rows = await exportRequests(apiId, userId)
  const json = JSON.stringify(rows, null, 2)

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Export Requests</h1>

      <p className="text-gray-700">
        Below is a full JSON export of all your requests for this API.
      </p>

      <pre className="text-sm bg-gray-50 p-4 rounded border whitespace-pre-wrap overflow-auto">
        {json}
      </pre>
    </div>
  )
}
