'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getWorkflows } from '@/lib/actions/agents'

export default function MissionControl({ workflows: initialWorkflows }: { workflows: any[] }) {
  const [workflowId, setWorkflowId] = useState('')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [workflows, setWorkflows] = useState(initialWorkflows)
  const router = useRouter()

  async function runWorkflow() {
    if (!workflowId || !input) {
      alert('Please select a workflow and enter input')
      return
    }

    setLoading(true)
    setOutput('Running workflow...')

    try {
      const res = await fetch('/api/workflows/run', {
        method: 'POST',
        body: JSON.stringify({
          workflowId,
          input,
          userId: '00000000-0000-0000-0000-000000000000'
        })
      })

      const data = await res.json()
      if (data.output) {
        setOutput(data.output)
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white space-y-4">
      <h2 className="text-2xl font-semibold">Mission Control</h2>

      <select
        className="w-full p-2 rounded bg-black border text-white"
        value={workflowId}
        onChange={(e) => setWorkflowId(e.target.value)}
      >
        <option value="">Select Workflow</option>
        {workflows.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>

      <textarea
        className="w-full p-2 rounded bg-black border text-white h-32"
        placeholder="Initial input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        onClick={runWorkflow}
        disabled={loading}
        className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] disabled:opacity-50"
      >
        {loading ? 'Running...' : 'Run Workflow'}
      </button>

      <div className="bg-black border rounded p-4 h-60 overflow-y-auto whitespace-pre-wrap text-sm">
        {output || 'Output will appear here...'}
      </div>
    </div>
  )
}
