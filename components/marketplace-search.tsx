'use client'

import { useState } from 'react'
import { searchMarketplace } from '@/lib/actions/agents'

export default function MarketplaceSearch({ onResults }: { onResults: (results: any[]) => void }) {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('')
  const [minRating, setMinRating] = useState(0)
  const [loading, setLoading] = useState(false)

  async function handleSearch() {
    setLoading(true)
    try {
      const results = await searchMarketplace(
        query || undefined,
        role || undefined,
        minRating || undefined
      )
      onResults(results)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white space-y-4">
      <h2 className="text-2xl font-semibold">Search Marketplace</h2>

      <input
        className="w-full p-2 rounded bg-black border text-white"
        placeholder="Search by name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <select
        className="w-full p-2 rounded bg-black border text-white"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="">Any Role</option>
        <option value="Researcher">Researcher</option>
        <option value="Writer">Writer</option>
        <option value="Coder">Coder</option>
        <option value="Analyst">Analyst</option>
      </select>

      <select
        className="w-full p-2 rounded bg-black border text-white"
        value={minRating}
        onChange={(e) => setMinRating(Number(e.target.value))}
      >
        <option value={0}>Any Rating</option>
        <option value={3}>3★+</option>
        <option value={4}>4★+</option>
        <option value={5}>5★ only</option>
      </select>

      <button
        onClick={handleSearch}
        disabled={loading}
        className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] disabled:opacity-50"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </div>
  )
}
