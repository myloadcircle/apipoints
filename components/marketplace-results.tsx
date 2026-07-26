'use client'

import { useState } from 'react'
import { rateAgent } from '@/lib/actions/agents'

export default function MarketplaceResults({ results, onRate }: { results: any[], onRate: () => void }) {
  const [ratingAgent, setRatingAgent] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')

  async function handleRate() {
    if (!ratingAgent) return

    try {
      await rateAgent(
        ratingAgent,
        '00000000-0000-0000-0000-000000000000',
        rating,
        review || undefined
      )
      alert('Rating submitted!')
      setRatingAgent(null)
      setReview('')
      onRate()
    } catch (error: any) {
      alert(error.message)
    }
  }

  if (!results || results.length === 0) {
    return (
      <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white">
        <p className="text-gray-400">No results yet. Try searching.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {results.map((r) => (
        <div key={r.id} className="bg-[#0D0D0D] border p-4 rounded-xl text-white">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold">{r.name}</h3>
              <p className="text-gray-300">{r.role}</p>
              <p className="text-yellow-400 mt-2">
                ★ {Number(r.avg_rating).toFixed(1)} ({r.rating_count} reviews)
              </p>
              <p className="text-gray-400 text-sm mt-1">Downloads: {r.downloads || 0}</p>
            </div>
            <button
              onClick={() => setRatingAgent(r.id)}
              className="px-3 py-1 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] text-sm"
            >
              Rate
            </button>
          </div>

          {ratingAgent === r.id && (
            <div className="mt-4 space-y-2 border-t border-gray-700 pt-4">
              <select
                className="w-full p-2 rounded bg-black border text-white"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                <option value={1}>1★</option>
                <option value={2}>2★</option>
                <option value={3}>3★</option>
                <option value={4}>4★</option>
                <option value={5}>5★</option>
              </select>
              <textarea
                className="w-full p-2 rounded bg-black border text-white h-20"
                placeholder="Review (optional)"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
              <button
                onClick={handleRate}
                className="w-full py-1 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] text-sm"
              >
                Submit Rating
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
