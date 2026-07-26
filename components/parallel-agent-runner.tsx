'use client'

import { useState } from 'react'

export default function ParallelAgentRunner({ agents }: { agents: any[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    )
  }

  async function run() {
    if (selected.length === 0 || !input) {
      alert('Please select agents and enter input')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/agents/parallel', {
        method: 'POST',
        body: JSON.stringify({
          agentIds: selected,
          input,
          userId: '00000000-0000-0000-0000-000000000000'
        })
      })

      const data = await res.json()
      if (data.results) {
        setResults(data.results)
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white space-y-4">
      <h2 className="text-2xl font-semibold">Parallel Agent Runner</h2>

      <textarea
        className="w-full p-2 rounded bg-black border text-white h-32"
        placeholder="Shared input for all agents"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {agents.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between border p-2 rounded"
          >
            <span>{a.name}</span>
            <button
              onClick={() => toggle(a.id)}
              className={`px-3 py-1 rounded text-sm ${
                selected.includes(a.id)
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#4A4AFF] hover:bg-[#5A5AFF]'
              }`}
            >
              {selected.includes(a.id) ? 'Remove' : 'Add'}
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={run}
        disabled={loading}
        className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] disabled:opacity-50"
      >
        {loading ? 'Running...' : 'Run in Parallel'}
      </button>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((r) => (
            <div key={r.agentId} className="bg-black border p-4 rounded">
              <h3 className="font-semibold mb-2">
                Agent: {agents.find((a: any) => a.id === r.agentId)?.name}
              </h3>
              <p className="whitespace-pre-wrap text-sm">{r.output}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
