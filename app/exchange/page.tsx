'use client'

import { useState } from 'react'

const INTENTS = [
  { value: 'company_check', label: 'Company Check', params: 'company_number' },
  { value: 'vehicle_check', label: 'Vehicle Check', params: 'vrm' },
  { value: 'identity_check', label: 'Identity Check', params: 'id_number' },
  { value: 'valuation', label: 'Valuation', params: 'item_id' },
  { value: 'tender_lookup', label: 'Tender Lookup', params: 'tender_id' },
  { value: 'risk_score', label: 'Risk Score', params: 'entity_id' }
]

export default function ExchangePage() {
  const [intent, setIntent] = useState('company_check')
  const [payload, setPayload] = useState('{"company_number": "12345678"}')
  const [preferences, setPreferences] = useState('{}')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const currentIntent = INTENTS.find(i => i.value === intent)

  async function callExchange() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const parsedPayload = JSON.parse(payload)
      const parsedPrefs = JSON.parse(preferences)

      const res = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          payload: parsedPayload,
          preferences: parsedPrefs,
          user_id: 'test_user_' + Date.now()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Request failed')
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
    <div className='p-8 space-y-10 max-w-4xl'>
      <div>
        <h1 className='text-2xl font-bold'>API Exchange</h1>
        <p className='text-gray-600 mt-2'>Universal endpoint for agents. Single intent, multiple providers, automatic routing.</p>
      </div>

      <div className='border p-6 rounded bg-gray-50 space-y-4'>
        <div>
          <label className='block text-sm font-bold mb-2'>Intent</label>
          <select 
            value={intent} 
            onChange={(e) => {
              setIntent(e.target.value)
              // Update example payload
              const selected = INTENTS.find(i => i.value === e.target.value)
              if (selected) {
                const example: any = {}
                example[selected.params] = 'example_123'
                setPayload(JSON.stringify(example, null, 2))
              }
            }}
            className='w-full border p-2 rounded'
          >
            {INTENTS.map(i => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className='block text-sm font-bold mb-2'>Payload (JSON)</label>
          <textarea 
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={4}
            className='w-full border p-2 rounded font-mono text-sm'
          />
        </div>

        <div>
          <label className='block text-sm font-bold mb-2'>Preferences (JSON, optional)</label>
          <textarea 
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            rows={2}
            placeholder='{"speed": "fast", "cost": "low"}'
            className='w-full border p-2 rounded font-mono text-sm'
          />
        </div>

        <button 
          onClick={callExchange}
          disabled={loading}
          className='px-4 py-2 bg-black text-white rounded disabled:bg-gray-400'
        >
          {loading ? 'Calling...' : 'Call Exchange'}
        </button>
      </div>

      {error && (
        <div className='border border-red-300 bg-red-50 p-4 rounded'>
          <p className='text-red-600'>{error}</p>
        </div>
      )}

      {result && (
        <div className='border p-6 rounded bg-green-50 space-y-4'>
          <h2 className='font-bold text-green-800'>Response</h2>
          
          <div className='grid grid-cols-3 gap-4 text-sm'>
            <div className='bg-white p-3 rounded'>
              <p className='font-bold'>Provider</p>
              <p className='text-gray-700'>{result.provider}</p>
            </div>
            <div className='bg-white p-3 rounded'>
              <p className='font-bold'>Cost</p>
              <p className='text-gray-700'>£{result.cost?.toFixed(2)}</p>
            </div>
            <div className='bg-white p-3 rounded'>
              <p className='font-bold'>Latency</p>
              <p className='text-gray-700'>{result.latency_ms}ms</p>
            </div>
          </div>

          <div>
            <p className='font-bold mb-2'>Data</p>
            <pre className='bg-white p-4 rounded overflow-auto text-xs'>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className='space-y-4'>
        <h2 className='text-xl font-bold'>Discovery Endpoints</h2>
        <div className='grid grid-cols-3 gap-4'>
          <a href='/api/exchange/capabilities' className='border p-4 rounded hover:bg-gray-50'>
            <p className='font-bold'>Capabilities</p>
            <p className='text-sm text-gray-600'>List all intents + schemas</p>
          </a>
          <a href='/api/exchange/pricing' className='border p-4 rounded hover:bg-gray-50'>
            <p className='font-bold'>Pricing</p>
            <p className='text-sm text-gray-600'>Deterministic pricing table</p>
          </a>
          <a href='/api/exchange/providers' className='border p-4 rounded hover:bg-gray-50'>
            <p className='font-bold'>Providers</p>
            <p className='text-sm text-gray-600'>Upstream providers per intent</p>
          </a>
        </div>
      </div>
    </div>
  )
}
