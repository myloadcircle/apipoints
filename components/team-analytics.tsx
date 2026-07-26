'use client'

import { useState, useEffect } from 'react'
import { getTeamUsageAnalytics } from '@/lib/actions/agents'

export default function TeamAnalytics({ teamId }: { teamId: string }) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const data = await getTeamUsageAnalytics(teamId)
        setAnalytics(data)
      } catch (error: any) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [teamId])

  if (loading) {
    return <p className="text-white">Loading analytics...</p>
  }

  if (!analytics) {
    return <p className="text-gray-400">No analytics data yet.</p>
  }

  return (
    <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white space-y-6">
      <h2 className="text-2xl font-semibold">Team Usage Analytics</h2>

      <div className="border p-4 rounded bg-black">
        <p className="text-gray-300">Total Credits Burned: <span className="text-red-400 font-bold">{analytics.stats.total_credits?.toLocaleString()}</span></p>
        <p className="text-gray-300">Total Events: <span className="font-bold">{analytics.stats.total_events}</span></p>
        {analytics.stats.first_usage && (
          <p className="text-gray-400 text-sm">First Usage: {new Date(analytics.stats.first_usage).toLocaleString()}</p>
        )}
        {analytics.stats.last_usage && (
          <p className="text-gray-400 text-sm">Last Usage: {new Date(analytics.stats.last_usage).toLocaleString()}</p>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Credits by Agent</h3>
        <div className="space-y-3">
          {analytics.perAgent.map((a: any) => (
            <div key={a.agent_name} className="border p-3 rounded bg-black">
              <p className="font-semibold">{a.agent_name}</p>
              <p className="text-gray-300 text-sm">Runs: {a.runs}</p>
              <p className="text-red-400 text-sm">Credits: {a.credits?.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
