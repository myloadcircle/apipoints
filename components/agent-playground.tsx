'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AgentPlayground({ agents }: { agents: any[] }) {
  const [agentId, setAgentId] = useState('')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function run() {
    if (!agentId || !input) {
      alert('Please select an agent and enter input')
      return
    }

    setLoading(true)
    setOutput('')

    try {
      const res = await fetch('/api/agents/stream', {
        method: 'POST',
        body: JSON.stringify({
          agentId,
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
      <h2 className="text-2xl font-semibold">Agent Playground</h2>

      <select
        className="w-full p-2 rounded bg-black border text-white"
        value={agentId}
        onChange={(e) => setAgentId(e.target.value)}
      >
        <option value="">Select Agent</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      <textarea
        className="w-full p-2 rounded bg-black border text-white h-40"
        placeholder="Enter your prompt"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        onClick={run}
        disabled={loading}
        className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] disabled:opacity-50"
      >
        {loading ? 'Running...' : 'Run Agent'}
      </button>

      <div className="bg-black border rounded p-4 h-60 overflow-y-auto whitespace-pre-wrap text-sm">
        {output || 'Output will appear here...'}
      </div>
    </div>
  )
}
