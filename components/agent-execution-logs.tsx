export default function AgentExecutionLogs({ logs }: { logs: any[] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="rounded-lg border p-4 bg-[#0D0D0D] text-white">
        <h3 className="text-lg font-semibold mb-3">Agent Execution Logs</h3>
        <p className="text-gray-400 text-sm">No execution logs yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-4 bg-[#0D0D0D] text-white">
      <h3 className="text-lg font-semibold mb-3">Agent Execution Logs</h3>

      <ul className="space-y-3 max-h-80 overflow-y-auto">
        {logs.map((log) => (
          <li key={log.id} className="border-b border-gray-700 pb-3">
            <p className="text-sm text-gray-400 mb-1">
              {new Date(log.created_at).toLocaleString()}
            </p>
            <p className="font-semibold">{log.agent_name}</p>
            {log.input && (
              <p className="text-gray-300 mt-1 text-sm">Input: {log.input}</p>
            )}
            {log.output && (
              <p className="text-gray-200 mt-1 text-sm">Output: {log.output}</p>
            )}
            <p className="text-red-400 mt-1 text-sm">
              Credits Burned: {log.credits_burned}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
