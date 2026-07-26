'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function WebhookSimulatorPage({ params }: any) {
  const apiId = params.id
  const webhookId = params.webhookId
  const userId = 'REPLACE_WITH_AUTH_USER_ID'

  // Get webhook details
  const { data: webhook } = await supabase
    .from('api_request_webhooks')
    .select('*, request:request_id(payload)')
    .eq('id', webhookId)
    .eq('user_id', userId)
    .single()

  // Get available logs for this webhook
  const { data: logs } = await supabase
    .from('api_request_webhook_logs')
    .select('id, created_at, status_code, success')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className='p-8 space-y-10 max-w-6xl'>
      <h1 className='text-2xl font-bold'>Webhook Delivery Simulator</h1>

      {webhook && (
        <div className='border p-4 rounded bg-gray-50'>
          <p className='font-bold'>{webhook.event}</p>
          <p className='text-sm text-gray-700'>{webhook.url}</p>
        </div>
      )}

      <SimulatorForm 
        webhookId={webhookId}
        requestId={webhook?.request_id || ''}
        logs={logs || []}
        defaultBody={webhook?.request?.payload || {}}
      />
    </div>
  )
}

function SimulatorForm({ webhookId, requestId, logs, defaultBody }: any) {
  const [selectedLogId, setSelectedLogId] = useState('')
  const [body, setBody] = useState(JSON.stringify(defaultBody, null, 2))
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}')
  const [secret, setSecret] = useState('')
  const [simulateSignature, setSimulateSignature] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  async function runSimulation() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/requests/${requestId}/webhooks/${webhookId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_id: selectedLogId || undefined,
          override_body: JSON.parse(body),
          override_headers: JSON.parse(headers),
          override_secret: secret || undefined,
          simulate_signature: simulateSignature
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Simulation failed')
      } else {
        setResult(data)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-2 gap-6'>
        <div>
          <label className='block text-sm font-bold mb-1'>Select Log Entry (Optional)</label>
          <select
            value={selectedLogId}
            onChange={(e) => setSelectedLogId(e.target.value)}
            className='border p-2 rounded w-full'
          >
            <option value=''>None (Use Default)</option>
            {logs.map((log: any) => (
              <option key={log.id} value={log.id}>
                {new Date(log.created_at).toLocaleString()} - {log.status_code} ({log.success ? 'Success' : 'Failed'})
              </option>
            ))}
          </select>
        </div>

        <div className='flex items-center gap-2'>
          <input
            type='checkbox'
            checked={simulateSignature}
            onChange={(e) => setSimulateSignature(e.target.checked)}
            className='w-4 h-4'
          />
          <label className='text-sm font-bold'>Simulate Signature</label>
        </div>
      </div>

      <div>
        <label className='block text-sm font-bold mb-1'>Request Body (JSON)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className='border p-2 rounded w-full h-48 font-mono text-sm'
        />
      </div>

      <div>
        <label className='block text-sm font-bold mb-1'>Headers (JSON)</label>
        <textarea
          value={headers}
          onChange={(e) => setHeaders(e.target.value)}
          className='border p-2 rounded w-full h-24 font-mono text-sm'
        />
      </div>

      <div>
        <label className='block text-sm font-bold mb-1'>Override Secret (Optional)</label>
        <input
          type='text'
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder='Enter secret to test signature'
          className='border p-2 rounded w-full font-mono text-sm'
        />
      </div>

      <button
        onClick={runSimulation}
        disabled={loading}
        className='px-4 py-2 bg-black text-white rounded disabled:opacity-50'
      >
        {loading ? 'Simulating...' : 'Run Simulation'}
      </button>

      {error && (
        <div className='border border-red-300 bg-red-50 p-4 rounded'>
          <p className='text-red-600 font-bold'>Error</p>
          <p className='text-sm text-red-700'>{error}</p>
        </div>
      )}

      {result && (
        <div className='space-y-6'>
          <div className='border p-4 rounded bg-green-50'>
            <p className='font-bold text-green-800'>Simulation Complete</p>
            <p className='text-sm text-green-700'>No external request was made.</p>
          </div>

          <div className='border p-4 rounded bg-gray-50'>
            <h3 className='font-bold mb-2'>Final Request Headers</h3>
            <pre className='bg-white p-3 rounded border text-xs overflow-auto'>
              {JSON.stringify(result.simulation.request_headers, null, 2)}
            </pre>
          </div>

          <div className='border p-4 rounded bg-gray-50'>
            <h3 className='font-bold mb-2'>Final Request Body</h3>
            <pre className='bg-white p-3 rounded border text-xs overflow-auto whitespace-pre-wrap'>
              {JSON.stringify(result.simulation.request_body, null, 2)}
            </pre>
          </div>

          {result.simulation.signature && (
            <div className='border p-4 rounded bg-blue-50'>
              <h3 className='font-bold mb-2'>Signature Generated</h3>
              <p className='text-sm font-mono bg-white p-2 rounded border break-all'>
                {result.simulation.signature}
              </p>
              <p className='text-xs text-gray-600 mt-2'>Timestamp: {result.simulation.timestamp}</p>
              
              {result.simulation.signature_explanation && (
                <pre className='bg-white p-3 rounded border text-xs mt-2 whitespace-pre-wrap'>
                  {result.simulation.signature_explanation}
                </pre>
              )}
            </div>
          )}

          {result.diff && (result.diff.headers_changed || result.diff.body_changed) && (
            <div className='border p-4 rounded bg-yellow-50'>
              <h3 className='font-bold mb-2'>Changes from Original</h3>
              {result.diff.headers_changed && <p className='text-sm'>Headers were modified</p>}
              {result.diff.body_changed && <p className='text-sm'>Body was modified</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
