import { createSubscriptionSession } from '@/lib/actions/credits'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const tiers = {
  starter: {
    name: "Starter",
    price: "£19.99",
    credits: "1,000,000 credits",
    stripe: "price_starter_1999",
  },
  pro: {
    name: "Pro",
    price: "£59.99",
    credits: "5,000,000 credits",
    stripe: "price_pro_5999",
  },
  team: {
    name: "Team",
    price: "£199",
    credits: "20,000,000 credits",
    stripe: "price_team_19900",
  },
}

export default function SubscribePage({ searchParams }: { searchParams: { tier?: string } }) {
  const tier = searchParams.tier || 'starter'
  const selected = tiers[tier as keyof typeof tiers] || tiers.starter

  async function handleSubscribe(formData: FormData) {
    'use server'
    const tierValue = formData.get('tier') as string
    const url = await createSubscriptionSession('00000000-0000-0000-0000-000000000000', tierValue as any)
    if (url) {
      redirect(url as string)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-10 flex justify-center">
      <div className="border rounded-xl p-8 bg-[#0D0D0D] w-96">
        <h1 className="text-3xl font-bold mb-4">Subscribe to {selected.name}</h1>

        <p className="text-4xl font-bold mb-2">{selected.price}</p>
        <p className="text-gray-300 mb-6">{selected.credits}</p>

        <form action={handleSubscribe}>
          <input type="hidden" name="tier" value={tier} />
          <button
            type="submit"
            className="w-full py-3 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF]"
          >
            Continue to Checkout
          </button>
        </form>

        <a
          href="/pricing"
          className="block text-center mt-4 text-gray-400 hover:text-gray-200"
        >
          Back to Pricing
        </a>
      </div>
    </div>
  )
}
