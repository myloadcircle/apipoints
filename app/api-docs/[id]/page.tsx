import { getAPI } from '@/lib/actions/get'

export const dynamic = 'force-dynamic'

export default async function APIDocs({ params }: { params: { id: string } }) {
  const api = await getAPI(params.id)

  if (!api) {
    return <div className="p-8">API not found.</div>
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">{api.name}</h1>
      <p className="text-gray-600">{api.description}</p>

      <div className="p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Endpoint</h2>
        <pre className="text-sm">{api.endpoint}</pre>
      </div>

      <div className="p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Price Per Request</h2>
        <p>${api.price_per_request}</p>
      </div>

      <div className="p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Example Request</h2>
        <pre className="text-sm">
POST /api/run
Headers:
  x-api-key: YOUR_KEY

Body:
{`{
  "api_id": "${api.id}",
  "input": { "example": "value" }
}`}
        </pre>
      </div>

      <div className="p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Example Response</h2>
        <pre className="text-sm">
{`{
  "output": { "result": "..." }
}`}
        </pre>
      </div>
    </div>
  )
}
