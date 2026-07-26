import { normalizeVehicleData, normalizeBusinessData, storeNormalized, queryNormalized } from '@/lib/actions/normalize'

export const dynamic = 'force-dynamic'

export default async function NormalizedPage({
  searchParams
}: {
  searchParams: { type?: string; id?: string }
}) {
  const entityType = searchParams.type || 'vehicle'
  const entityId = searchParams.id
  
  const data = await queryNormalized(entityType, entityId)

  const types = [
    { value: 'vehicle', label: 'Vehicles' },
    { value: 'business', label: 'Businesses' },
    { value: 'property', label: 'Properties' },
    { value: 'person', label: 'People' }
  ]

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Normalized Data</h1>
      <p className='text-gray-600'>Unified schemas across all providers</p>

      <div className='flex gap-2 flex-wrap'>
        {types.map(t => (
          <a
            key={t.value}
            href={`/normalized?type=${t.value}`}
            className={`px-3 py-1 rounded text-sm ${
              entityType === t.value
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      <div className='space-y-4'>
        {data.length > 0 ? (
          data.map((d: any) => {
            const schema = d.normalized_schema
            return (
              <div key={d.id} className='border p-4 rounded bg-gray-50'>
                <div className='flex items-start justify-between'>
                  <div>
                    <h2 className='font-bold'>{schema.entity_id}</h2>
                    <p className='text-sm text-gray-600'>{d.source_connector_id}</p>
                    <div className='flex gap-2 mt-2'>
                      <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs'>
                        {schema.entity_type}
                      </span>
                      <span className='px-2 py-1 bg-green-100 text-green-800 rounded text-xs'>
                        {(schema.confidence_score * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                  </div>
                  <a
                    href={`/normalized?type=${schema.entity_type}&id=${schema.entity_id}`}
                    className='px-3 py-1 bg-black text-white rounded text-sm'
                  >
                    View
                  </a>
                </div>

                <div className='mt-4 grid grid-cols-2 gap-4 text-sm'>
                  {schema.registration && (
                    <div><span className='font-bold'>Registration:</span> {schema.registration}</div>
                  )}
                  {schema.make && (
                    <div><span className='font-bold'>Make:</span> {schema.make}</div>
                  )}
                  {schema.model && (
                    <div><span className='font-bold'>Model:</span> {schema.model}</div>
                  )}
                  {schema.company_name && (
                    <div><span className='font-bold'>Company:</span> {schema.company_name}</div>
                  )}
                  {schema.status && (
                    <div><span className='font-bold'>Status:</span> {schema.status}</div>
                  )}
                  {schema.score !== undefined && (
                    <div><span className='font-bold'>Score:</span> {schema.score}</div>
                  )}
                  {schema.risk_level && (
                    <div><span className='font-bold'>Risk:</span> {schema.risk_level}</div>
                  )}
                </div>

                <p className='text-xs text-gray-500 mt-3'>
                  Last updated: {new Date(d.updated_at).toLocaleString()}
                </p>
              </div>
            )
          })
        ) : (
          <p className='text-gray-500'>No normalized data yet. Run connectors to populate.</p>
        )}
      </div>
    </div>
  )
}
