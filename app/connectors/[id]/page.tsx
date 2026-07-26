import { getConnector, queryNormalizedData } from '@/lib/actions/connectors'

export const dynamic = 'force-dynamic'

export default async function ConnectorPage({ params }: any) {
  const connectorId = params.id
  const connector = await getConnector(connectorId)
  const normalizedData = await queryNormalizedData(connector.connector_type)

  return (
    <div className='p-8 space-y-10 max-w-6xl'>
      <div className='flex items-start justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>{connector.name}</h1>
          <p className='text-gray-600 mt-2'>{connector.description}</p>
          <div className='flex gap-2 mt-3'>
            <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs'>
              {connector.connector_type}
            </span>
            <span className='px-2 py-1 bg-green-100 text-green-800 rounded text-xs'>
              v{connector.version}
            </span>
            <span className='px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs'>
              {connector.upstream_provider}
            </span>
          </div>
        </div>
        <a
          href={`/connectors/${connectorId}/run`}
          className='px-4 py-2 bg-black text-white rounded text-sm'
        >
          Run Connector
        </a>
      </div>

      <div className='grid grid-cols-2 gap-6'>
        <div className='border p-4 rounded bg-gray-50'>
          <h2 className='font-bold mb-3'>Input Schema</h2>
          <pre className='text-xs bg-white p-3 rounded overflow-auto'>
            {JSON.stringify(connector.input_schema, null, 2)}
          </pre>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <h2 className='font-bold mb-3'>Output Schema</h2>
          <pre className='text-xs bg-white p-3 rounded overflow-auto'>
            {JSON.stringify(connector.output_schema, null, 2)}
          </pre>
        </div>
      </div>

      <div className='border p-4 rounded bg-gray-50'>
        <h2 className='font-bold mb-3'>Pricing</h2>
        <pre className='text-xs bg-white p-3 rounded'>
          {JSON.stringify(connector.pricing, null, 2)}
        </pre>
      </div>

      <div className='space-y-4'>
        <h2 className='text-xl font-bold'>Normalized Data ({normalizedData.length})</h2>
        {normalizedData.length > 0 ? (
          normalizedData.slice(0, 10).map((d: any) => (
            <div key={d.id} className='border p-4 rounded bg-gray-50'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-bold'>{d.entity_id}</p>
                  <p className='text-sm text-gray-600'>
                    Confidence: {(d.confidence_score * 100).toFixed(0)}%
                  </p>
                </div>
                <span className='text-xs text-gray-500'>
                  {new Date(d.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className='text-gray-500'>No normalized data yet.</p>
        )}
      </div>
    </div>
  )
}
