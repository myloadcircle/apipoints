'use client'

import { useState, useEffect } from 'react'
import { getWorkflowRuns } from '@/lib/actions/dashboard'

interface WorkflowRun {
  id: string
  workflow_name: string
  steps_executed: number
  duration: number | null
  status: string
  output_summary: string
  started_at: string
}

export default function WorkflowRuns({ userId }: { userId: string }) {
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    if (!collapsed) {
      setLoading(true)
      setError(null)
      getWorkflowRuns(userId)
        .then(setRuns)
        .catch((e: any) => setError(e.message))
        .finally(() => setLoading(false))
    }
  }, [collapsed, userId])

  function formatDuration(seconds: number | null): string {
    if (seconds === null || seconds === undefined) return '-'
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="border rounded bg-gray-50">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <h2 className="font-bold text-lg">Workflow Runs</h2>
        <span className="text-gray-500">{collapsed ? '▶' : '▼'}</span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-4">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading workflow runs...</p>
          ) : error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : runs.length === 0 ? (
            <p className="text-gray-500 text-sm">No workflow runs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-600">
                    <th className="pb-2 pr-4 font-medium">Workflow</th>
                    <th className="pb-2 pr-4 font-medium">Started</th>
                    <th className="pb-2 pr-4 font-medium">Duration</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 font-medium">Output</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b last:border-0 hover:bg-white">
                      <td className="py-2 pr-4 font-medium">{run.workflow_name}</td>
                      <td className="py-2 pr-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(run.started_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-xs">{formatDuration(run.duration)}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          run.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : run.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : run.status === 'running'
                            ? 'bg-blue-100 text-blue-800'
                            : run.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="py-2 text-xs max-w-xs truncate text-gray-600">
                        {run.output_summary}
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
