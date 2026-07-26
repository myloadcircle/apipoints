'use client'

import { useState, useEffect } from 'react'
import { getDashboardLogs, getAgentNames } from '@/lib/actions/dashboard'

interface LogEntry {
  id: string
  agent_name: string
  event_type: string
  message: string
  status: string
  created_at: string
}

export default function Logs({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [agents, setAgents] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(true)

  const [filterAgent, setFilterAgent] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  useEffect(() => {
    getAgentNames(userId).then(setAgents).catch(() => {})
  }, [userId])

  async function loadLogs() {
    setLoading(true)
    try {
      const filters: any = {}
      if (filterAgent) filters.agent = filterAgent
      if (filterStatus) filters.status = filterStatus
      if (filterDateFrom) filters.dateFrom = filterDateFrom
      if (filterDateTo) filters.dateTo = filterDateTo
      const result = await getDashboardLogs(userId, filters)
      setLogs(result)
    } catch (e: any) {
      console.error('Failed to load logs', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!collapsed) loadLogs()
  }, [collapsed, userId])

  function handleFilterChange() {
    loadLogs()
  }

  return (
    <div className="border rounded bg-gray-50">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <h2 className="font-bold text-lg">Logs</h2>
        <span className="text-gray-500">{collapsed ? '▶' : '▼'}</span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Agent</label>
              <select
                className="w-full p-2 border rounded text-sm"
                value={filterAgent}
                onChange={(e) => { setFilterAgent(e.target.value); handleFilterChange() }}
              >
                <option value="">All Agents</option>
                {agents.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select
                className="w-full p-2 border rounded text-sm"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); handleFilterChange() }}
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">From</label>
              <input
                type="date"
                className="w-full p-2 border rounded text-sm"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); handleFilterChange() }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">To</label>
              <input
                type="date"
                className="w-full p-2 border rounded text-sm"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); handleFilterChange() }}
              />
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500 text-sm">Loading logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-gray-500 text-sm">No log entries found.</p>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b text-left text-gray-600">
                    <th className="pb-2 pr-3 font-medium">Timestamp</th>
                    <th className="pb-2 pr-3 font-medium">Agent</th>
                    <th className="pb-2 pr-3 font-medium">Event</th>
                    <th className="pb-2 pr-3 font-medium">Message</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-white">
                      <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 text-xs font-medium">{log.agent_name}</td>
                      <td className="py-2 pr-3 text-xs">
                        <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">{log.event_type}</span>
                      </td>
                      <td className="py-2 pr-3 text-xs max-w-xs truncate">{log.message}</td>
                      <td className="py-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          log.status === 'success' || log.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : log.status === 'error' || log.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : log.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
