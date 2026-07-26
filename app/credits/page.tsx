import { getCreditBalance, getUsageEvents, addCredits } from '@/lib/actions/credits'
import { TopUpModal, LowBalanceBanner } from '@/components/credit-modals'
import AgentUsageSimulator from '@/components/agent-simulator'
import CreditExpiryNotice from '@/components/credit-expiry-notice'
import UpgradeNudge from '@/components/upgrade-nudge'
import CreditBurnTimeline from '@/components/credit-burn-timeline'
import AgentExecutionLogs from '@/components/agent-execution-logs'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function CreditPanel({ creditsRemaining, creditsUsed }: { creditsRemaining: number, creditsUsed: number }) {
  return (
    <div className="rounded-lg border p-4 bg-[#0D0D0D] text-white">
      <h2 className="text-lg font-semibold mb-2">Credits</h2>

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-300">Remaining</span>
        <span className="text-xl font-bold">{creditsRemaining.toLocaleString()}</span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-300">Used this month</span>
        <span className="text-xl font-bold text-red-400">
          {creditsUsed.toLocaleString()}
        </span>
      </div>

      <form action={async () => {
        'use server'
        // Add 1000 credits for demo
        await addCredits('00000000-0000-0000-0000-000000000000', 1000)
      }}>
        <button className="w-full mt-4 py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] text-white">
          Top Up Credits
        </button>
      </form>
    </div>
  );
}

function UsageList({ events }: { events: any[] }) {
  return (
    <div className="rounded-lg border p-4 bg-[#0D0D0D] text-white mt-4">
      <h3 className="text-md font-semibold mb-2">Recent Usage</h3>

      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {events.map((e) => (
          <li key={e.id} className="flex justify-between text-sm">
            <span className="text-gray-300">{e.event_type}</span>
            <span className="text-red-400">-{e.credits_burned}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function CreditsPage() {
  const dummyUserId = '00000000-0000-0000-0000-000000000000'
  const ledger = await getCreditBalance(dummyUserId)
  const events = await getUsageEvents(dummyUserId, 100)

  // Get agent logs
  const { data: logs } = await supabase
    .from('agent_logs')
    .select('*')
    .eq('user_id', dummyUserId)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className='p-8 max-w-7xl'>
      <CreditExpiryNotice lastUpdated={ledger.last_updated} />
      <UpgradeNudge creditsRemaining={ledger.credits_remaining} />
      <LowBalanceBanner creditsRemaining={ledger.credits_remaining} />

      <div className='mb-8'>
        <h1 className='text-2xl font-bold'>Credits & Usage</h1>
        <p className='text-gray-600 mt-2'>Manage your credits and view usage history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CreditPanel
          creditsRemaining={ledger.credits_remaining}
          creditsUsed={ledger.credits_used}
        />

        <div className="md:col-span-2 space-y-6">
          <UsageList events={events} />
          <CreditBurnTimeline events={events} />
          <AgentExecutionLogs logs={logs || []} />
        </div>
      </div>

      <div className='mt-8 border p-4 rounded bg-gray-50'>
        <h2 className='text-xl font-bold mb-4'>Credit System Info</h2>
        <div className='space-y-2 text-sm text-gray-600'>
          <p><strong>Base Cost:</strong> 10 credits per API call</p>
          <p><strong>Provider Cost:</strong> 25 credits per provider attempted</p>
          <p><strong>Retry Penalty:</strong> 40 credits per retry</p>
          <p><strong>Fallback Penalty:</strong> 60 credits per fallback</p>
          <p className='mt-4 text-xs'>
            Example: 3 providers + 1 retry + 1 fallback = 10 + (3×25) + 40 + 60 = 185 credits
          </p>
        </div>
      </div>

      <div className='mt-8 border p-4 rounded bg-gray-50'>
        <h2 className='text-xl font-bold mb-4'>Subscription Plans</h2>
        <div className='grid grid-cols-3 gap-4'>
          <div className='border p-4 rounded'>
            <h3 className='font-bold'>Starter</h3>
            <p className='text-2xl font-bold mt-2'>£19.99/mo</p>
            <p className='text-sm text-gray-600 mt-1'>1,000,000 credits</p>
            <a href="/subscribe?tier=starter" className="block mt-3 text-center py-2 bg-black text-white rounded text-sm">Choose</a>
          </div>
          <div className='border p-4 rounded bg-blue-50'>
            <h3 className='font-bold'>Pro</h3>
            <p className='text-2xl font-bold mt-2'>£59.99/mo</p>
            <p className='text-sm text-gray-600 mt-1'>5,000,000 credits</p>
            <a href="/subscribe?tier=pro" className="block mt-3 text-center py-2 bg-black text-white rounded text-sm">Choose</a>
          </div>
          <div className='border p-4 rounded'>
            <h3 className='font-bold'>Team</h3>
            <p className='text-2xl font-bold mt-2'>£199/mo</p>
            <p className='text-sm text-gray-600 mt-1'>20,000,000 credits</p>
            <a href="/subscribe?tier=team" className="block mt-3 text-center py-2 bg-black text-white rounded text-sm">Choose</a>
          </div>
        </div>
      </div>

      <div className='mt-8'>
        <AgentUsageSimulator />
      </div>
    </div>
  );
}
