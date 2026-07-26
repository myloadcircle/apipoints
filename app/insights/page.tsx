import { getInsights, getInsightBundles } from '@/lib/actions/insights'

export const dynamic = 'force-dynamic'

export default async function InsightsPage({
  searchParams
}: {
  searchParams: { type?: string; id?: string }
}) {
  const entityType = searchParams.type || 'vehicle'
  const entityId = searchParams.id
  
  const insights = await getInsights(entityType, entityId)
  const bundles = await getInsightBundles(entityType)

  const types = [
    { value: 'vehicle', label: 'Vehicles' },
    { value: 'business', label: 'Businesses' },
    { value: 'property', label: 'Properties' },
    { value: 'person', label: 'People' }
  ]

  const getRiskColor = (level?: string) => {
    if (level === 'high') return 'bg-red-100 text-red-800'
    if (level === 'medium') return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  return (
    <div className='p-8 space-y-10'>
      <div>
        <h1 className='text-2xl font-bold'>Insights Engine</h1>
        <p className='text-gray-600 mt-2'>Signals, scores, and risk analysis</p>
      </div>

      <div className='flex gap-2 flex-wrap'>
        {types.map(t => (
          <a
            key={t.value}
            href={`/insights?type=${t.value}`}
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

      <div className='grid grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Insights ({insights.length})</h2>
          
          {insights.length > 0 ? (
            insights.map((insight: any) => (
              <div key={insight.id} className='border p-4 rounded bg-gray-50'>
                <div className='flex items-start justify-between'>
                  <div>
                    <h3 className='font-bold'>{insight.entity_id}</h3>
                    <p className='text-sm text-gray-600'>{insight.insight_type}</p>
                  </div>
                  <div className='text-right'>
                    <div className='text-2xl font-bold'>{insight.score?.toFixed(0)}</div>
                    <span className={`px-2 py-1 rounded text-xs ${getRiskColor(insight.risk_level)}`}>
                      {insight.risk_level?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {insight.signals && insight.signals.length > 0 && (
                  <div className='mt-4 space-y-2'>
                    <p className='text-sm font-bold'>Signals:</p>
                    {insight.signals.map((s: any, idx: number) => (
                      <div key={idx} className={`p-2 rounded text-sm ${
                        s.severity === 'critical' ? 'bg-red-50 text-red-700' :
                        s.severity === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        <span className='font-bold'>{s.type}:</span> {s.message}
                      </div>
                    ))}
                  </div>
                )}

                <p className='text-xs text-gray-500 mt-3'>
                  Confidence: {(insight.confidence * 100).toFixed(0)}% | 
                  Updated: {new Date(insight.updated_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className='text-gray-500'>No insights yet. Generate insights from normalized data.</p>
          )}
        </div>

        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Insight Bundles</h2>
          
          {bundles.length > 0 ? (
            bundles.map((bundle: any) => (
              <div key={bundle.id} className='border p-4 rounded bg-gray-50'>
                <h3 className='font-bold'>{bundle.name}</h3>
                <p className='text-sm text-gray-600 mt-1'>{bundle.description}</p>
                <div className='flex items-center gap-2 mt-3'>
                  <span className='px-2 py-1 bg-green-100 text-green-800 rounded text-xs'>
                    £{bundle.price?.toFixed(2)}
                  </span>
                  <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs'>
                    {bundle.entity_type}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className='text-gray-500'>No bundles available.</p>
          )}
        </div>
      </div>
    </div>
  )
}
