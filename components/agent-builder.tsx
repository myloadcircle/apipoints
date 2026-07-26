'use client'

import { useState } from 'react'
import { AGENT_TEMPLATES } from '@/lib/actions/agents'
import { createAgent } from '@/lib/actions/agents'
import { useRouter } from 'next/navigation'

export default function AgentBuilder() {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const router = useRouter()

  function applyTemplate(templateKey: string) {
    const template = AGENT_TEMPLATES[templateKey as keyof typeof AGENT_TEMPLATES]
    if (template) {
      setName(template.name)
      setRole(template.role)
      setSystemPrompt(template.systemPrompt)
      setSelectedTemplate(templateKey)
    }
  }

  async function handleCreate() {
    try {
      await createAgent({
        user_id: '00000000-0000-0000-0000-000000000000',
        name,
        role,
        system_prompt: systemPrompt
      })
      router.push('/agents')
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white max-w-xl">
      <h2 className="text-2xl font-semibold mb-4">Create New Agent</h2>

      <div className="mb-4">
        <label className="block mb-2">Quick Templates</label>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(AGENT_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => applyTemplate(key)}
              className={`px-3 py-1 rounded text-sm ${
                selectedTemplate === key
                  ? 'bg-[#4A4AFF]'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      <input
        className="w-full p-2 mb-4 rounded bg-black border text-white"
        placeholder="Agent Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="w-full p-2 mb-4 rounded bg-black border text-white"
        placeholder="Agent Role (e.g., Researcher, Writer)"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />

      <textarea
        className="w-full p-2 mb-4 rounded bg-black border text-white h-40"
        placeholder="System Prompt"
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
      />

      <button
        onClick={handleCreate}
        className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF]"
      >
        Save Agent
      </button>
    </div>
  )
}
