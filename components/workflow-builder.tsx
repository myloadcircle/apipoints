'use client'

import { useState } from 'react'
import { getAgents } from '@/lib/actions/agents'
import { createWorkflow } from '@/lib/actions/agents'
import { useRouter } from 'next/navigation'

export default function WorkflowBuilder({ agents }: { agents: any[] }) {
  const [name, setName] = useState('')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const router = useRouter()

  function toggleAgent(agentId: string) {
    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    )
  }

  async function handleCreate() {
    if (selectedAgents.length === 0) {
      alert('Please select at least one agent')
      return
    }

    try {
      await createWorkflow({
        user_id: '00000000-0000-0000-0000-000000000000',
        name,
        agentIds: selectedAgents
      })
      router.push('/workflows')
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white max-w-xl">
      <h2 className="text-2xl font-semibold mb-4">Create Workflow</h2>

      <input
        className="w-full p-2 mb-4 rounded bg-black border text-white"
        placeholder="Workflow Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <h3 className="text-lg font-semibold mb-2">Select Agents (in order)</h3>

      <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
        {agents.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between border p-2 rounded"
          >
            <div>
              <span className="font-bold">{a.name}</span>
              <span className="text-gray-400 text-sm ml-2">({a.role})</span>
            </div>
            <button
              onClick={() => toggleAgent(a.id)}
              className={`px-3 py-1 rounded text-sm ${
                selectedAgents.includes(a.id)
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#4A4AFF] hover:bg-[#5A5AFF]'
              }`}
            >
              {selectedAgents.includes(a.id) ? 'Remove' : 'Add'}
            </button>
          </div>
        ))}
      </div>

      {selectedAgents.length > 0 && (
        <div className="mb-4 p-3 bg-black rounded border">
          <p className="text-sm text-gray-400 mb-2">Workflow order:</p>
          {selectedAgents.map((id, index) => {
            const agent = agents.find((a) => a.id === id)
            return (
              <p key={id} className="text-sm">
                {index + 1}. {agent?.name}
              </p>
            )
          })}
        </div>
      )}

      <button
        onClick={handleCreate}
        className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF]"
      >
        Save Workflow
      </button>
    </div>
  )
}
