'use client'

import { useState, useEffect } from 'react'

interface ApiKey {
  id: string
  key: string
  key_name: string | null
  created_at: string
  last_used: string | null
  active: boolean
}

export default function ApiKeys({ userId }: { userId: string }) {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [showNewKey, setShowNewKey] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  async function fetchKeys() {
    setLoading(true)
    try {
      const res = await fetch(`/api/keys/list?ownerId=${userId}`)
      const json = await res.json()
      if (json.success) setKeys(json.data)
    } catch (e: any) {
      console.error('Failed to fetch keys', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchKeys() }, [userId])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/keys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: userId, keyName: keyName || undefined })
      })
      const json = await res.json()
      if (json.success) {
        setShowNewKey(json.data.key)
        setKeyName('')
        await fetchKeys()
      }
    } catch (e: any) {
      console.error('Failed to generate key', e)
    } finally {
      setGenerating(false)
    }
  }

  async function handleRevoke(keyId: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return
    try {
      const res = await fetch('/api/keys/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId })
      })
      const json = await res.json()
      if (json.success) await fetchKeys()
    } catch (e: any) {
      console.error('Failed to revoke key', e)
    }
  }

  async function handleCopy(key: string) {
    try {
      await navigator.clipboard.writeText(key)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = key
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }

  function maskKey(key: string) {
    if (key.length <= 8) return '••••••••'
    return key.slice(0, 4) + '••••••••' + key.slice(-4)
  }

  return (
    <div className="border rounded bg-gray-50">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <h2 className="font-bold text-lg">API Keys</h2>
        <span className="text-gray-500">{collapsed ? '▶' : '▼'}</span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Key Name (optional)</label>
              <input
                type="text"
                placeholder="e.g. Production API Key"
                className="w-full p-2 border rounded text-sm"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 bg-black text-white rounded text-sm disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate New Key'}
            </button>
          </div>

          {showNewKey && (
            <div className="bg-green-50 border border-green-200 p-3 rounded flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-green-700 font-semibold mb-1">New key generated — copy it now, it will not be shown again</p>
                <code className="block font-mono text-sm break-all bg-white p-2 rounded border">{showNewKey}</code>
              </div>
              <button
                onClick={() => { handleCopy(showNewKey); setShowNewKey(null) }}
                className="shrink-0 px-3 py-1 bg-green-600 text-white rounded text-xs"
              >
                Copy
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-gray-500 text-sm">Loading keys...</p>
          ) : keys.length === 0 ? (
            <p className="text-gray-500 text-sm">No API keys yet. Generate one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-600">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Key</th>
                    <th className="pb-2 pr-4 font-medium">Created</th>
                    <th className="pb-2 pr-4 font-medium">Last Used</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{k.key_name || <span className="text-gray-400 italic">Unnamed</span>}</td>
                      <td className="py-2 pr-4">
                        <code className="font-mono text-xs bg-white px-2 py-1 rounded border">{maskKey(k.key)}</code>
                      </td>
                      <td className="py-2 pr-4 text-gray-500 text-xs">{new Date(k.created_at).toLocaleDateString()}</td>
                      <td className="py-2 pr-4 text-gray-500 text-xs">
                        {k.last_used ? new Date(k.last_used).toLocaleDateString() : <span className="text-gray-400">Never</span>}
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          k.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {k.active ? 'Active' : 'Revoked'}
                        </span>
                      </td>
                      <td className="py-2 flex gap-2">
                        <button
                          onClick={() => handleCopy(k.key)}
                          className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-100"
                          title="Copy key"
                        >
                          Copy
                        </button>
                        {k.active && (
                          <button
                            onClick={() => handleRevoke(k.id)}
                            className="px-2 py-1 text-xs bg-red-50 border border-red-200 text-red-700 rounded hover:bg-red-100"
                            title="Revoke key"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
