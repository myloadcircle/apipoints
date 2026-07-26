import { getAgents } from '@/lib/actions/agents'
import AgentBuilder from '@/components/agent-builder'
import AgentPlayground from '@/components/agent-playground'
import ParallelAgentRunner from '@/components/parallel-agent-runner'
import AgentMarketplace from '@/components/agent-marketplace'
import { AGENT_TEMPLATES } from '@/lib/actions/agents'

export const dynamic = 'force-dynamic'

export default async function AgentsPage() {
  let agents = []

  try {
    agents = await getAgents('00000000-0000-0000-0000-000000000000')
  } catch (error) {
    console.error('Failed to fetch agents:', error)
  }

  return (
    <div className="p-8 max-w-7xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Agents</h1>
        <p className="text-gray-600 mt-2">Build, test, and run AI agents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AgentBuilder />
        <AgentPlayground agents={agents} />
      </div>

      <ParallelAgentRunner agents={agents} />

      <div>
        <h2 className="text-xl font-bold mb-4">Agent Marketplace</h2>
        <AgentMarketplace templates={AGENT_TEMPLATES} />
      </div>

      <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white">
        <h2 className="text-xl font-semibold mb-4">Your Agents ({agents.length})</h2>

        {agents.length === 0 ? (
          <p className="text-gray-400">No agents yet. Create one or add from marketplace.</p>
        ) : (
          <ul className="space-y-3">
            {agents.map((a: any) => (
              <li key={a.id} className="border-b border-gray-700 pb-3">
                <p className="font-bold">{a.name}</p>
                <p className="text-gray-400 text-sm">{a.role}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
