import { 
  getRuntimeStatus, 
  getAgentMessages, 
  sendAgentMessage,
  getAgentMemory,
  startAgentRuntime,
  stopAgentRuntime 
} from '@/lib/actions/agent-runtime'

export const dynamic = 'force-dynamic'

export default async function AgentRuntimePage({
  searchParams
}: {
  searchParams: { agent?: string }
}) {
  const agentId = searchParams.agent || ''
  
  const runtime = agentId ? await getRuntimeStatus(agentId) : null
  const messages = agentId ? await getAgentMessages(agentId, false) : []
  const memory = agentId ? await getAgentMemory(agentId) : []

  return (
    <div className='p-8 space-y-10 max-w-6xl'>
      <div>
        <h1 className='text-2xl font-bold'>Agent Runtime</h1>
        <p className='text-gray-600 mt-2'>Local-first multi-agent execution environment</p>
      </div>

      {runtime && (
        <div className='border p-6 rounded bg-gray-50'>
          <div className='flex items-start justify-between'>
            <div>
              <h2 className='text-xl font-bold'>Runtime Status</h2>
              <p className='text-sm text-gray-600 mt-1'>Agent: {runtime.agent_id}</p>
            </div>
            <div className='text-right'>
              <span className={`px-3 py-1 rounded text-sm ${
                runtime.status === 'running' ? 'bg-green-100 text-green-800' :
                runtime.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                runtime.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {runtime.status?.toUpperCase()}
              </span>
            </div>
          </div>

          <div className='grid grid-cols-3 gap-4 mt-6'>
            <div className='bg-white p-3 rounded'>
              <p className='text-sm text-gray-600'>Started</p>
              <p className='font-bold mt-1'>
                {runtime.started_at ? new Date(runtime.started_at).toLocaleString() : 'Not started'}
              </p>
            </div>
            <div className='bg-white p-3 rounded'>
              <p className='text-sm text-gray-600'>Last Heartbeat</p>
              <p className='font-bold mt-1'>
                {new Date(runtime.last_heartbeat).toLocaleString()}
              </p>
            </div>
            <div className='bg-white p-3 rounded'>
              <p className='text-sm text-gray-600'>Current Task</p>
              <p className='font-bold mt-1'>{runtime.current_task || 'None'}</p>
            </div>
          </div>

          <div className='flex gap-2 mt-4'>
            {runtime.status !== 'running' ? (
              <form action={async () => {
                'use server'
                await startAgentRuntime(runtime.agent_id)
              }}>
                <button className='px-4 py-2 bg-green-600 text-white rounded text-sm'>
                  Start Runtime
                </button>
              </form>
            ) : (
              <form action={async () => {
                'use server'
                await stopAgentRuntime(runtime.agent_id)
              }}>
                <button className='px-4 py-2 bg-red-600 text-white rounded text-sm'>
                  Stop Runtime
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className='grid grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Messages ({messages.length})</h2>
          {messages.length > 0 ? (
            messages.map((m: any) => (
              <div key={m.id} className={`border p-4 rounded bg-gray-50 ${m.read ? '' : 'border-blue-300'}`}>
                <div className='flex items-start justify-between'>
                  <div>
                    <p className='font-bold text-sm'>
                      {m.from_agent?.name || 'Unknown'} → {m.to_agent?.name || 'Unknown'}
                    </p>
                    <span className='px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs mt-1 inline-block'>
                      {m.message_type}
                    </span>
                  </div>
                  <span className='text-xs text-gray-500'>
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <pre className='mt-3 text-xs bg-white p-3 rounded overflow-auto'>
                  {JSON.stringify(m.payload, null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <p className='text-gray-500'>No messages yet.</p>
          )}
        </div>

        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Memory ({memory.length})</h2>
          {memory.length > 0 ? (
            memory.map((m: any) => (
              <div key={m.id} className='border p-4 rounded bg-gray-50'>
                <div className='flex items-start justify-between'>
                  <div>
                    <p className='font-bold text-sm'>{m.key}</p>
                    <span className='px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs mt-1 inline-block'>
                      {m.memory_type}
                    </span>
                  </div>
                  {m.expires_at && (
                    <span className='text-xs text-gray-500'>
                      Expires: {new Date(m.expires_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <pre className='mt-3 text-xs bg-white p-3 rounded overflow-auto'>
                  {JSON.stringify(m.value, null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <p className='text-gray-500'>No memory stored.</p>
          )}
        </div>
      </div>
    </div>
  )
}
