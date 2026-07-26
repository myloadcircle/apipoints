import { getAutonomousAgents, getMissions, getLearningEntries, toggleAgentStatus, createMission, completeMission, applyLearning, initializeAutonomousAgents } from '@/lib/actions/self-driving'

export const dynamic = 'force-dynamic'

export default async function SelfDrivingPage() {
  const agents = await getAutonomousAgents()
  const missions = await getMissions()
  const learnings = await getLearningEntries()

  const activeAgents = agents.filter(a => a.status === 'active').length
  const runningMissions = missions.filter(m => m.status === 'running').length
  const completedMissions = missions.filter(m => m.status === 'completed').length

  return (
    <div className='p-8 space-y-10 max-w-7xl'>
      <div>
        <h1 className='text-2xl font-bold'>Fully Self-Driving Estate</h1>
        <p className='text-gray-600 mt-2'>Autonomous agents, missions, and self-learning system</p>
      </div>

      <div className='grid grid-cols-4 gap-4'>
        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Active Agents</p>
          <p className='text-3xl font-bold mt-1'>{activeAgents}</p>
        </div>
        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Running Missions</p>
          <p className='text-3xl font-bold mt-1'>{runningMissions}</p>
        </div>
        <div className='border p-4 rounded bg-gray-50'>
          <p className='text-sm text-gray-600'>Completed Missions</p>
          <p className='text-3xl font-bold mt-1'>{completedMissions}</p>
        </div>
        <div className='border p-4 rounded bg-gray-50'>
          <form action={async () => {
            'use server'
            await initializeAutonomousAgents()
          }}>
            <button className='px-4 py-2 bg-black text-white rounded text-sm'>
              Initialize
            </button>
          </form>
          <p className='text-sm text-gray-600 mt-2'>Default Agents</p>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Autonomous Agents ({agents.length})</h2>
          {agents.map((a: any) => (
            <div key={a.id} className='border p-4 rounded bg-gray-50'>
              <div className='flex items-start justify-between'>
                <div>
                  <h3 className='font-bold'>{a.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    a.agent_type === 'discovery' ? 'bg-blue-100 text-blue-800' :
                    a.agent_type === 'optimizer' ? 'bg-green-100 text-green-800' :
                    a.agent_type === 'healer' ? 'bg-red-100 text-red-800' :
                    a.agent_type === 'router' ? 'bg-purple-100 text-purple-800' :
                    a.agent_type === 'monitor' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {a.agent_type?.toUpperCase()}
                  </span>
                </div>
                <form action={async () => {
                  'use server'
                  await toggleAgentStatus(a.id, a.status === 'active' ? 'paused' : 'active')
                }}>
                  <button className={`px-3 py-1 rounded text-sm text-white ${
                    a.status === 'active' ? 'bg-green-600' : 'bg-gray-400'
                  }`}>
                    {a.status === 'active' ? 'ACTIVE' : 'PAUSED'}
                  </button>
                </form>
              </div>
              {a.config && (
                <pre className='mt-3 text-xs bg-white p-3 rounded overflow-auto'>
                  {JSON.stringify(a.config, null, 2)}
                </pre>
              )}
              <div className='flex items-center gap-4 mt-2 text-xs text-gray-600'>
                <span>Runs: {a.run_count}</span>
                {a.last_run && <span>Last: {new Date(a.last_run).toLocaleString()}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Missions ({missions.length})</h2>
          {missions.slice(0, 10).map((m: any) => (
            <div key={m.id} className='border p-4 rounded bg-gray-50'>
              <div className='flex items-start justify-between'>
                <div>
                  <h3 className='font-bold'>{m.title}</h3>
                  <div className='flex items-center gap-2 mt-1'>
                    <span className={`px-2 py-1 rounded text-xs ${
                      m.status === 'completed' ? 'bg-green-100 text-green-800' :
                      m.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      m.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {m.status?.toUpperCase()}
                    </span>
                    <span className='text-xs text-gray-600'>{m.mission_type}</span>
                  </div>
                </div>
                {m.status === 'pending' && (
                  <form action={async () => {
                    'use server'
                    await completeMission(m.id, { auto: true })
                  }}>
                    <button className='px-3 py-1 bg-black text-white rounded text-sm'>
                      Complete
                    </button>
                  </form>
                )}
              </div>
              {m.description && (
                <p className='text-sm text-gray-600 mt-2'>{m.description}</p>
              )}
              <div className='flex items-center gap-4 mt-2 text-xs text-gray-500'>
                <span>Priority: {m.priority}</span>
                <span>Created: {new Date(m.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}

          <h2 className='text-xl font-bold mt-6'>Learning Repository ({learnings.length})</h2>
          {learnings.slice(0, 5).map((l: any) => (
            <div key={l.id} className='border p-3 rounded bg-gray-50 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='font-bold'>{l.context_type}</span>
                <span className='text-xs text-gray-600'>{l.context_key}</span>
              </div>
              <div className='flex items-center gap-4 mt-1'>
                <span className={`text-xs ${l.applied ? 'text-green-600' : 'text-yellow-600'}`}>
                  {l.applied ? 'APPLIED' : 'PENDING'}
                </span>
                <span className='text-xs text-gray-600'>
                  Confidence: {(l.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
