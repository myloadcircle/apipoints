'use client'

import { useState } from 'react'
import { runRequest } from '@/lib/actions/run'

export default function TestConsole({ api }: { api: any }) {
  const [input, setInput] = useState('{}')
  const [output, setOutput] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')

  async function handleRun() {
    setLoading(true)
    try {
      const parsed = JSON.parse(input)
      const result = await runRequest(api.id, parsed, apiKey)
      setOutput(result)
    } catch (e: any) {
      setOutput({ error: e.message || 'Invalid JSON or request failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border p-4 rounded">
      <h3 className="font-bold mb-2">Test Console</h3>
      <input
        type="text"
        placeholder="API Key (optional)"
        className="w-full p-2 border rounded mb-2 font-mono text-sm"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <textarea
        className="w-full h-32 p-2 border rounded font-mono text-sm"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        onClick={handleRun}
        disabled={loading}
        className="mt-2 px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        {loading ? 'Running...' : 'Run'}
      </button>
      {output && (
        <pre className="mt-4 p-2 bg-gray-100 rounded text-sm overflow-auto">
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </div>
  )
}
