import { getDashboardMetrics } from '@/lib/actions/dashboard'
import ApiKeys from '@/components/dashboard/ApiKeys'
import UsageMetrics from '@/components/dashboard/UsageMetrics'
import Logs from '@/components/dashboard/Logs'
import WorkflowRuns from '@/components/dashboard/WorkflowRuns'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const userId = 'REPLACE_WITH_AUTH_USER_ID'
  const metrics = await getDashboardMetrics(userId)

  return (
    <div className='p-8 space-y-6 max-w-7xl'>
      <div>
        <h1 className='text-2xl font-bold'>Dashboard</h1>
        <p className='text-gray-600 mt-2'>Overview of your APIs, revenue, and activity</p>
      </div>

      <div className='grid grid-cols-4 gap-4'>
        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Total APIs</p>
          <p className='text-3xl font-bold mt-1'>{metrics.total_apis}</p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Total Requests</p>
          <p className='text-3xl font-bold mt-1'>{metrics.total_requests}</p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Revenue</p>
          <p className='text-3xl font-bold mt-1'>£{metrics.total_revenue.toFixed(2)}</p>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Active Tenants</p>
          <p className='text-3xl font-bold mt-1'>{metrics.active_tenants}</p>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-6'>
        <div className='border p-4 rounded bg-gray-50'>
          <h2 className='font-bold mb-4'>Recent Requests</h2>
          <div className='space-y-2'>
            {metrics.recent_requests.length > 0 ? (
              metrics.recent_requests.map((r: any) => (
                <div key={r.id} className='flex items-center justify-between text-sm p-2 bg-white rounded'>
                  <div>
                    <span className='font-bold'>{r.api_id}</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      r.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <span className='text-xs text-gray-500'>
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className='text-gray-500 text-sm'>No requests yet.</p>
            )}
          </div>
        </div>

        <div className='border p-4 rounded bg-gray-50'>
          <h2 className='font-bold mb-4'>Revenue (Last 7 Days)</h2>
          <div className='space-y-2'>
            {metrics.revenue_by_day.length > 0 ? (
              metrics.revenue_by_day.map((d: any) => (
                <div key={d.date} className='flex items-center justify-between text-sm p-2 bg-white rounded'>
                  <span className='text-gray-600'>{d.date}</span>
                  <span className='font-bold'>£{d.revenue.toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className='text-gray-500 text-sm'>No revenue data yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className='grid grid-cols-3 gap-4'>
        <a href='/connectors' className='border p-4 rounded bg-gray-50 hover:bg-gray-100'>
          <h3 className='font-bold'>Connectors</h3>
          <p className='text-2xl font-bold mt-1'>{metrics.total_connectors}</p>
          <p className='text-sm text-gray-600 mt-1'>Active connectors</p>
        </a>

        <a href='/insights' className='border p-4 rounded bg-gray-50 hover:bg-gray-100'>
          <h3 className='font-bold'>Insights</h3>
          <p className='text-2xl font-bold mt-1'>{metrics.total_insights}</p>
          <p className='text-sm text-gray-600 mt-1'>Generated insights</p>
        </a>

        <a href='/exchange' className='border p-4 rounded bg-gray-50 hover:bg-gray-100'>
          <h3 className='font-bold'>Exchange</h3>
          <p className='text-sm text-gray-600 mt-2'>Universal API endpoint</p>
        </a>
      </div>

      <ApiKeys userId={userId} />
      <UsageMetrics userId={userId} />
      <Logs userId={userId} />
      <WorkflowRuns userId={userId} />
    </div>
  )
}
