import { getEarnings } from '@/lib/actions/earnings'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getAPIs() {
  const { data } = await supabase.from('apis').select('id, name')
  return data || []
}

export default async function EarningsPage() {
  const earnings = await getEarnings()
  const apis = await getAPIs()

  const apiMap: any = {}
  apis.forEach((a: any) => (apiMap[a.id] = a.name))

  const total = earnings.reduce((sum: number, e: any) => sum + Number(e.amount), 0)

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Creator Earnings</h1>

      <div className="p-4 bg-black text-white rounded">
        <p className="text-lg">Total Earnings</p>
        <p className="text-3xl font-bold">£{total.toFixed(2)}</p>
      </div>

      <div className="space-y-4">
        {earnings.length === 0 && (
          <p className="text-gray-600">No earnings yet.</p>
        )}
        {earnings.map((e: any) => (
          <div key={e.id} className="border p-4 rounded bg-gray-50">
            <p className="text-xs text-gray-500">{e.created_at}</p>
            <p className="font-bold">{apiMap[e.api_id] || 'Unknown API'}</p>
            <p className="text-green-700 font-semibold">+£{Number(e.amount).toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
