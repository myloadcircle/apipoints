'use client'

import { useState } from 'react'
import { TEAM_SUBSCRIPTION_PLANS } from '@/lib/actions/agents'
import { createTeamSubscriptionSession } from '@/lib/actions/agents'
import { createTeamTopUpSession } from '@/lib/actions/agents'
import { useRouter } from 'next/navigation'

export default function TeamBilling({ teamId }: { teamId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubscribe(tier: string) {
    setLoading(true)
    try {
      const session = await createTeamSubscriptionSession(teamId, tier)
      if (session) {
        window.location.href = session as string
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleTopUp() {
    setLoading(true)
    try {
      const session = await createTeamTopUpSession(teamId)
      if (session) {
        window.location.href = session as string
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0D0D0D] border p-6 rounded-xl text-white space-y-6">
      <h2 className="text-2xl font-semibold">Team Billing</h2>

      <div>
        <h3 className="text-xl font-semibold mb-4">Subscription Plans</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="border p-4 rounded bg-black">
            <h4 className="font-bold">Starter</h4>
            <p className="text-2xl font-bold mt-2">£49.99/mo</p>
            <p className="text-gray-400 mb-4">10M credits</p>
            <button
              onClick={() => handleSubscribe('starter')}
              disabled={loading}
              className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] disabled:opacity-50"
            >
              Subscribe
            </button>
          </div>
          <div className="border p-4 rounded bg-blue-950">
            <h4 className="font-bold">Pro</h4>
            <p className="text-2xl font-bold mt-2">£149.99/mo</p>
            <p className="text-gray-400 mb-4">50M credits</p>
            <button
              onClick={() => handleSubscribe('pro')}
              disabled={loading}
              className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] disabled:opacity-50"
            >
              Subscribe
            </button>
          </div>
          <div className="border p-4 rounded bg-black">
            <h4 className="font-bold">Enterprise</h4>
            <p className="text-2xl font-bold mt-2">£499.99/mo</p>
            <p className="text-gray-400 mb-4">250M credits</p>
            <button
              onClick={() => handleSubscribe('enterprise')}
              disabled={loading}
              className="w-full py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] disabled:opacity-50"
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={handleTopUp}
          disabled={loading}
          className="w-full py-2 rounded bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Top Up £20 (200K credits)'}
        </button>
      </div>
    </div>
  )
}
