import { listReportTemplates, getUserReports, generateReport, renderReportHtml } from '@/lib/actions/reports'

export const dynamic = 'force-dynamic'

export default async function ReportsPage({
  searchParams
}: {
  searchParams: { type?: string; status?: string }
}) {
  const entityType = searchParams.type || ''
  const status = searchParams.status || ''
  const templates = await listReportTemplates(entityType || undefined)
  const reports = await getUserReports('REPLACE_WITH_AUTH_USER_ID', status || undefined)

  const types = [
    { value: '', label: 'All' },
    { value: 'vehicle', label: 'Vehicles' },
    { value: 'business', label: 'Businesses' },
    { value: 'property', label: 'Properties' }
  ]

  return (
    <div className='p-8 space-y-10'>
      <div>
        <h1 className='text-2xl font-bold'>Report Generator</h1>
        <p className='text-gray-600 mt-2'>Generate PDFs, HTML, or JSON reports from templates</p>
      </div>

      <div className='flex gap-2 flex-wrap'>
        {types.map(t => (
          <a
            key={t.value}
            href={`/reports?type=${t.value}`}
            className={`px-3 py-1 rounded text-sm ${
              entityType === t.value || (!entityType && !t.value)
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
          <h2 className='text-xl font-bold'>Templates ({templates.length})</h2>
          {templates.length > 0 ? (
            templates.map((t: any) => (
              <div key={t.id} className='border p-4 rounded bg-gray-50'>
                <h3 className='font-bold'>{t.name}</h3>
                <p className='text-sm text-gray-600 mt-1'>{t.description}</p>
                <div className='flex gap-2 mt-3'>
                  <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs'>
                    {t.entity_type}
                  </span>
                  <span className='px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs'>
                    v{t.version}
                  </span>
                </div>
                <form action={`/api/reports/generate`} method='POST' className='mt-3'>
                  <input type='hidden' name='template_id' value={t.id} />
                  <input type='hidden' name='entity_type' value={t.entity_type} />
                  <input type='hidden' name='entity_id' value={`example_${Date.now()}`} />
                  <input type='hidden' name='format' value='json' />
                  <button className='px-3 py-1 bg-black text-white rounded text-sm'>
                    Generate Report
                  </button>
                </form>
              </div>
            ))
          ) : (
            <p className='text-gray-500'>No templates available.</p>
          )}
        </div>

        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Your Reports ({reports.length})</h2>
          {reports.length > 0 ? (
            reports.map((r: any) => (
              <div key={r.id} className='border p-4 rounded bg-gray-50'>
                <div className='flex items-start justify-between'>
                  <div>
                    <h3 className='font-bold'>{r.template?.name || 'Unknown Template'}</h3>
                    <p className='text-sm text-gray-600'>{r.entity_type}: {r.entity_id}</p>
                    <span className={`px-2 py-1 rounded text-xs mt-2 inline-block ${
                      r.status === 'completed' ? 'bg-green-100 text-green-800' :
                      r.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {r.status?.toUpperCase()}
                    </span>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs text-gray-500'>
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                    {r.status === 'completed' && (
                      <a
                        href={`/reports/${r.id}`}
                        className='px-2 py-1 bg-black text-white rounded text-xs mt-2 inline-block'
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className='text-gray-500'>No reports generated yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
