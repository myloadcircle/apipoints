'use client'

import { AGENT_TEMPLATES } from '@/lib/actions/agents'
import { createAgent } from '@/lib/actions/agents'

export default function AgentMarketplace({ templates }: { templates: any }) {
  async function addAgent(templateKey: string) {
    const template = AGENT_TEMPLATES[templateKey as keyof typeof AGENT_TEMPLATES]
    if (!template) return

    try {
      await createAgent({
        user_id: '00000000-0000-0000-0000-000000000000',
        name: template.name,
        role: template.role,
        system_prompt: template.systemPrompt
      })
      alert('Agent added!')
      window.location.reload()
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white">
      <h2 className="text-2xl font-semibold mb-4">Agent Marketplace</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(AGENT_TEMPLATES).map(([key, t]: [string, any]) => (
          <div key={key} className="border p-4 rounded bg-black">
            <h3 className="text-xl font-semibold">{t.name}</h3>
            <p className="text-gray-300 mb-4">{t.role}</p>
            <p className="text-gray-400 mb-4 text-sm">{t.systemPrompt}</p>

            <button
              onClick={() => addAgent(key)}
              className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF]"
            >
              Add to My Agents
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
