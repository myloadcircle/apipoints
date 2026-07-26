'use client'

import { useState, useEffect } from 'react'
import { getSSOConfig, startSSOLogin, getAuditLogs, getTeamRateLimit } from '@/lib/actions/agents'
import { useRouter } from 'next/navigation'

export default function EnterpriseAdminConsole({ teamId }: { teamId: string }) {
  const [ssoConfig, setSsoConfig] = useState<any>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [rateLimit, setRateLimit] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      try {
        const [config, logs, limit] = await Promise.all([
          getSSOConfig(teamId),
          getAuditLogs(teamId),
          getTeamRateLimit(teamId)
        ])
        setSsoConfig(config)
        setAuditLogs(logs)
        setRateLimit(limit)
      } catch (error: any) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [teamId])

  async function handleSSOLogin() {
    try {
      const url = await startSSOLogin(teamId)
      window.location.href = url as string
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (loading) {
    return <p className="text-white p-10">Loading...</p>
  }

  return (
    <div className="p-10 bg-black text-white space-y-10">
      <h1 className="text-3xl font-bold">Enterprise Admin Console</h1>

      <section className="bg-[#0D0D0D] border p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">SSO Configuration</h2>
        {ssoConfig ? (
          <div>
            <p><strong>Provider:</strong> {ssoConfig.provider}</p>
            <p><strong>Client ID:</strong> {ssoConfig.client_id}</p>
          </div>
        ) : (
          <p className="text-gray-400">SSO not configured yet.</p>
        )}
        <button
          onClick={handleSSOLogin}
          className="mt-4 w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF]"
        >
          Test SSO Login
        </button>
      </section>

      <section className="bg-[#0D0D0D] border p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Rate Limits</h2>
        {rateLimit && (
          <div>
            <p><strong>Max Requests/Min:</strong> {rateLimit.max_requests_per_minute}</p>
            <p><strong>Current Window Count:</strong> {rateLimit.request_count}</p>
          </div>
        )}
      </section>

      <section className="bg-[#0D0D0D] border p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Audit Logs ({auditLogs.length})</h2>
        {auditLogs.length === 0 ? (
          <p className="text-gray-400">No audit logs yet.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="border-b border-gray-700 pb-3">
                <p className="text-sm text-gray-400">
                  {new Date(log.created_at).toLocaleString()}
                </p>
                <p className="font-semibold">{log.action}</p>
                {log.metadata && (
                  <p className="text-gray-300 text-sm">
                    {JSON.stringify(log.metadata)}
                  </p>
                )}
                {log.users?.email && (
                  <p className="text-gray-400 text-xs">User: {log.users.email}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
