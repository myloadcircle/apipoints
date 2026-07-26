import { getWorkflows, getAgents, getSharedAgents, WORKFLOW_TEMPLATES } from '@/lib/actions/agents'
import WorkflowBuilder from '@/components/workflow-builder'
import MissionControl from '@/components/mission-control'

export const dynamic = 'force-dynamic'

export default async function WorkflowsPage() {
  let workflows = []
  let agents = []

  try {
    workflows = await getWorkflows('00000000-0000-0000-0000-000000000000')
  } catch (error) {
    console.error('Failed to fetch workflows:', error)
  }

  try {
    agents = await getAgents('00000000-0000-0000-0000-000000000000')
  } catch (error) {
    console.error('Failed to fetch agents:', error)
  }

  let sharedAgents = []
  try {
    sharedAgents = await getSharedAgents()
  } catch (error) {
    console.error('Failed to fetch shared agents:', error)
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Workflows</h1>
        <p className="text-gray-600 mt-2">Create multi-agent workflows</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WorkflowBuilder agents={agents} />

        <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white">
          <h2 className="text-xl font-semibold mb-4">Your Workflows ({workflows.length})</h2>

          {workflows.length === 0 ? (
            <p className="text-gray-400">No workflows yet. Create one to get started.</p>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {workflows.map((wf) => (
                <li key={wf.id} className="border-b border-gray-700 pb-3">
                  <p className="font-bold">{wf.name}</p>
                  <p className="text-gray-400 text-sm">
                    {wf.workflow_steps?.length || 0} steps
                  </p>
                  {wf.workflow_steps?.map((step: any, index: number) => (
                    <p key={step.id} className="text-gray-300 text-sm">
                      {index + 1}. {step.agents?.name}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <MissionControl workflows={workflows} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white">
          <h2 className="text-xl font-semibold mb-4">Workflow Templates</h2>

          {Object.entries(WORKFLOW_TEMPLATES).map(([key, template]: [string, any]) => (
            <div key={key} className="border border-gray-700 p-3 rounded mb-3">
              <h3 className="font-bold">{template.name}</h3>
              <p className="text-gray-400 text-sm mb-2">
                Steps: {template.steps.join(' → ')}
              </p>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/workflows/create-from-template', {
                      method: 'POST',
                      body: JSON.stringify({
                        templateKey: key,
                        userId: '00000000-0000-0000-0000-000000000000'
                      })
                    })
                    if (res.ok) {
                      alert('Workflow created!')
                      window.location.reload()
                    }
                  } catch (error: any) {
                    alert(error.message)
                  }
                }}
                className="w-full py-1 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] text-sm"
              >
                Create from Template
              </button>
            </div>
          ))}
        </div>

        <div className="md:col-span-2 bg-[#0D0D0D] border p-6 rounded-xl text-white">
          <h2 className="text-xl font-semibold mb-4">Agent Marketplace ({sharedAgents.length})</h2>

          {sharedAgents.length === 0 ? (
            <p className="text-gray-400">No shared agents yet.</p>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {sharedAgents.map((sa: any) => (
                <li key={sa.id} className="border-b border-gray-700 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{sa.name}</p>
                      <p className="text-gray-400 text-sm">{sa.role}</p>
                      <p className="text-gray-500 text-xs">Downloads: {sa.downloads || 0}</p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/agents/import', {
                            method: 'POST',
                            body: JSON.stringify({
                              sharedAgentId: sa.id,
                              userId: '00000000-0000-0000-0000-000000000000'
                            })
                          })
                          if (res.ok) {
                            alert('Agent imported!')
                            window.location.reload()
                          }
                        } catch (error: any) {
                          alert(error.message)
                        }
                      }}
                      className="px-3 py-1 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] text-sm"
                    >
                      Import
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
