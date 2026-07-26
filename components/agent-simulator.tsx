'use client'

import { useState } from 'react'

const BASE_COST = 10
const PROVIDER_COST = 25
const RETRY_COST = 40
const FALLBACK_COST = 60

export default function AgentUsageSimulator() {
  const [providers, setProviders] = useState(1)
  const [retries, setRetries] = useState(0)
  const [fallbacks, setFallbacks] = useState(0)
  const [result, setResult] = useState<number | null>(null)

  function simulate() {
    const burn =
      BASE_COST +
      providers * PROVIDER_COST +
      retries * RETRY_COST +
      fallbacks * FALLBACK_COST

    setResult(burn)
  }

  return (
    <div className="bg-[#0D0D0D] border rounded-xl p-6 text-white w-full">
      <h2 className="text-2xl font-semibold mb-4">Agent Usage Simulator</h2>

      <div className="space-y-4">
        <div>
          <label className="block mb-1">Provider Calls</label>
          <input
            type="number"
            value={providers}
            onChange={(e) => setProviders(Number(e.target.value))}
            className="w-full p-2 rounded bg-black border text-white"
          />
        </div>

        <div>
          <label className="block mb-1">Retries</label>
          <input
            type="number"
            value={retries}
            onChange={(e) => setRetries(Number(e.target.value))}
            className="w-full p-2 rounded bg-black border text-white"
          />
        </div>

        <div>
          <label className="block mb-1">Fallbacks</label>
          <input
            type="number"
            value={fallbacks}
            onChange={(e) => setFallbacks(Number(e.target.value))}
            className="w-full p-2 rounded bg-black border text-white"
          />
        </div>

        <button
          onClick={simulate}
          className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF]"
        >
          Simulate Burn
        </button>

        {result !== null && (
          <div className="mt-4 p-4 bg-black border rounded">
            <p className="text-lg">
              Estimated Credits Burned:{" "}
              <span className="font-bold text-red-400">{result}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
