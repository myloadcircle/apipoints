'use client'

import { useState } from 'react'

export const dynamic = 'force-dynamic'

export default function WebhookTesterPage() {
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState('POST')
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}')
  const [body, setBody] = useState('{\n  "event": "test",\n  "payload": {}\n}')
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  async function sendTest() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method,
          headers: JSON.parse(headers),
          body: JSON.parse(body),
          secret: secret || undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Test failed')
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
      <h1 className='text-2xl font-bold'>Webhook Sandbox Tester</h1>

      <div className='space-y-6'>
        <div>
          <label className='block text-sm font-bold mb-1'>Webhook URL</label>
          <input
            type='url'
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder='https://your-endpoint.com/webhook'
            className='border p-2 rounded w-full'
          />
        </div>

        <div>
          <label className='block text-sm font-bold mb-1'>Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className='border p-2 rounded w-full'
          >
            <option value='POST'>POST</option>
            <option value='PUT'>PUT</option>
            <option value='PATCH'>PATCH</option>
            <option value='GET'>GET</option>
          </select>
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
          <label className='block text-sm font-bold mb-1'>Request Body (JSON)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className='border p-2 rounded w-full h-48 font-mono text-sm'
          />
        </div>

        <div>
          <label className='block text-sm font-bold mb-1'>Secret (optional, for signature testing)</label>
          <input
            type='text'
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder='Enter webhook secret to test signature'
            className='border p-2 rounded w-full font-mono text-sm'
          />
        </div>

        <button
          onClick={sendTest}
          disabled={loading || !url}
          className='px-4 py-2 bg-black text-white rounded disabled:opacity-50'
        >
          {loading ? 'Sending...' : 'Send Test Webhook'}
        </button>

        {error && (
          <div className='border border-red-300 bg-red-50 p-4 rounded'>
            <p className='text-red-600 font-bold'>Error</p>
            <p className='text-sm text-red-700'>{error}</p>
          </div>
        )}

        {result && (
          <div className='space-y-4'>
            <h2 className='text-xl font-semibold'>Test Results</h2>

            <div className='grid grid-cols-3 gap-4'>
              <div className='border p-4 rounded bg-gray-50'>
                <p className='text-sm text-gray-600'>Status Code</p>
                <p className={`text-2xl font-bold ${result.statusCode >= 200 && result.statusCode < 300 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.statusCode}
                </p>
              </div>

              <div className='border p-4 rounded bg-gray-50'>
                <p className='text-sm text-gray-600'>Duration</p>
                <p className='text-2xl font-bold'>{result.durationMs}ms</p>
              </div>

              <div className='border p-4 rounded bg-gray-50'>
                <p className='text-sm text-gray-600'>Success</p>
                <p className={`text-2xl font-bold ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {result.success ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            {result.responseHeaders && (
              <div>
                <p className='font-bold mb-2'>Response Headers</p>
                <pre className='bg-gray-50 p-4 rounded border text-xs overflow-auto'>
                  {JSON.stringify(result.responseHeaders, null, 2)}
                </pre>
              </div>
            )}

            {result.responseBody && (
              <div>
                <p className='font-bold mb-2'>Response Body</p>
                <pre className='bg-gray-50 p-4 rounded border text-xs overflow-auto whitespace-pre-wrap'>
                  {result.responseBody}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
