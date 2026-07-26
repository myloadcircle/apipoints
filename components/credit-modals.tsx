'use client'

import { useState } from 'react'
import { createTopUpSession } from '@/lib/actions/credits'

export function TopUpModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false)

  if (!open) return null

  async function handleTopUp() {
    setLoading(true)
    try {
      const url = await createTopUpSession('00000000-0000-0000-0000-000000000000')
      window.location.href = url as string
    } catch (error) {
      console.error('Top up failed:', error)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0D0D0D] p-6 rounded-lg border border-gray-700 w-80 text-white">
        <h2 className="text-lg font-semibold mb-4">Top Up Credits</h2>
        <p className="text-gray-300 mb-4">Add £5 and receive 50,000 credits.</p>

        <button
          onClick={handleTopUp}
          disabled={loading}
          className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay £5'}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 rounded bg-gray-700 hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export function LowBalanceBanner({ creditsRemaining }: { creditsRemaining: number }) {
  if (creditsRemaining > 5000) return null

  return (
    <div className="bg-red-600 text-white p-3 rounded mb-4 text-center">
      Your credits are running low ({creditsRemaining.toLocaleString()} remaining). Top up to avoid interruptions.
    </div>
  )
}
