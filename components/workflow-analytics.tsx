'use client'

import { getWorkflowAnalytics } from '@/lib/actions/agents'
import { useEffect, useState } from 'react'

export default function WorkflowAnalytics() {
  const [analytics, setAnalytics] = useState<any[]>([])

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const data = await getWorkflowAnalytics('00000000-0000-0000-0000-000000000000')
        setAnalytics(data)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      }
    }
    fetchAnalytics()
  }, [])

  return (
    <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white">
      <h2 className="text-2xl font-semibold mb-4">Workflow Analytics</h2>

      {analytics.length === 0 ? (
        <p className="text-gray-400">No workflow data yet.</p>
      ) : (
        <div className="space-y-4">
          {analytics.map((w) => (
            <div key={w.id} className="border p-4 rounded bg-black">
              <h3 className="text-xl font-semibold">{w.name}</h3>
              <p className="text-gray-300">Steps: {w.workflow_steps?.length || 0}</p>
              <p className="text-gray-300">Runs: {w.workflow_steps?.reduce((sum: number, s: any) =>
                sum + (s.agents?.runs || 0), 0) || 0}</p>
              <p className="text-red-400">
                Credits Burned: {(w.workflow_steps?.reduce((sum: number, s: any) =>
                  sum + (s.agents?.total_credits || 0), 0) || 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
