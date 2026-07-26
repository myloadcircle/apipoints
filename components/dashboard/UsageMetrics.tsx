'use client'

import { useState, useEffect } from 'react'
import { getUsageMetrics } from '@/lib/actions/dashboard'

interface UsageData {
  total_requests: number
  total_tokens_in: number
  total_tokens_out: number
  total_tokens: number
  total_cost: number
  recent_usage: Array<{
    id: string
    endpoint: string
    tokens: number
    status: string
    created_at: string
  }>
}

export default function UsageMetrics({ userId }: { userId: string }) {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await getUsageMetrics(userId)
        setData(result)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  const formatNumber = (n: number) => n.toLocaleString()

  return (
    <div className="border rounded bg-gray-50">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <h2 className="font-bold text-lg">Usage Metrics</h2>
        <span className="text-gray-500">{collapsed ? '▶' : '▼'}</span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-4">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading usage metrics...</p>
          ) : error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : data ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-500">Total Requests</p>
                  <p className="text-xl font-bold mt-1">{formatNumber(data.total_requests)}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-500">Tokens In</p>
                  <p className="text-xl font-bold mt-1">{formatNumber(data.total_tokens_in)}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-500">Tokens Out</p>
                  <p className="text-xl font-bold mt-1">{formatNumber(data.total_tokens_out)}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-500">Total Tokens</p>
                  <p className="text-xl font-bold mt-1">{formatNumber(data.total_tokens)}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-xs text-gray-500">Cost</p>
                  <p className="text-xl font-bold mt-1">${data.total_cost.toFixed(4)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">Recent Usage</h3>
                {data.recent_usage.length === 0 ? (
                  <p className="text-gray-500 text-sm">No usage data yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-600">
                          <th className="pb-2 pr-4 font-medium">Timestamp</th>
                          <th className="pb-2 pr-4 font-medium">Endpoint</th>
                          <th className="pb-2 pr-4 font-medium">Tokens</th>
                          <th className="pb-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recent_usage.map((u) => (
                          <tr key={u.id} className="border-b last:border-0">
                            <td className="py-2 pr-4 text-xs text-gray-500">{new Date(u.created_at).toLocaleString()}</td>
                            <td className="py-2 pr-4 font-mono text-xs">{u.endpoint}</td>
                            <td className="py-2 pr-4">{formatNumber(u.tokens)}</td>
                            <td className="py-2">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                u.status === 'completed' || u.status === 'success'
                                  ? 'bg-green-100 text-green-800'
                                  : u.status === 'error' || u.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {u.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
