import { listConnectors } from '@/lib/actions/connectors'

export const dynamic = 'force-dynamic'

export default async function ConnectorsPage({
  searchParams
}: {
  searchParams: { type?: string }
}) {
  const type = searchParams.type
  const connectors = await listConnectors(type)

  const types = [
    { value: '', label: 'All' },
    { value: 'vehicle', label: 'Vehicle Data' },
    { value: 'business', label: 'Business Data' },
    { value: 'property', label: 'Property Data' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'email', label: 'Email' },
    { value: 'social', label: 'Social' }
  ]

  return (
    <div className='p-8 space-y-10'>
      <h1 className='text-2xl font-bold'>Data Connectors</h1>

      <div className='flex gap-2 flex-wrap'>
        {types.map(t => (
          <a
            key={t.value}
            href={`/connectors?type=${t.value}`}
            className={`px-3 py-1 rounded text-sm ${
              type === t.value || (!type && !t.value)
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      <div className='space-y-4'>
        {connectors.length > 0 ? (
          connectors.map((c: any) => (
            <div key={c.id} className='border p-4 rounded bg-gray-50'>
              <div className='flex items-start justify-between'>
                <div>
                  <h2 className='font-bold'>{c.name}</h2>
                  <p className='text-sm text-gray-600 mt-1'>{c.description}</p>
                  <div className='flex gap-2 mt-2'>
                    <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs'>
                      {c.connector_type}
                    </span>
                    <span className='px-2 py-1 bg-green-100 text-green-800 rounded text-xs'>
                      v{c.version}
                    </span>
                  </div>
                </div>
                <a
                  href={`/connectors/${c.id}`}
                  className='px-3 py-1 bg-black text-white rounded text-sm'
                >
                  View
                </a>
              </div>
            </div>
          ))
        ) : (
          <p className='text-gray-500'>No connectors found.</p>
        )}
      </div>
    </div>
  )
}
