import { SUBSCRIPTION_PLANS } from '@/lib/actions/credits'

export const dynamic = 'force-dynamic'

const tiers = [
  {
    name: "Starter",
    price: "£19.99",
    credits: "1,000,000 credits",
    description: "Perfect for builders and light automation.",
    tier: "starter",
  },
  {
    name: "Pro",
    price: "£59.99",
    credits: "5,000,000 credits",
    description: "For serious builders running multiple agents.",
    tier: "pro",
  },
  {
    name: "Team",
    price: "£199",
    credits: "20,000,000 credits",
    description: "For businesses running 24/7 agent operations.",
    tier: "team",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-10 text-center">Pricing</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map((t) => (
          <div
            key={t.name}
            className="border rounded-xl p-6 bg-[#0D0D0D] flex flex-col"
          >
            <h2 className="text-2xl font-semibold mb-2">{t.name}</h2>
            <p className="text-4xl font-bold mb-4">{t.price}</p>
            <p className="text-gray-300 mb-4">{t.credits}</p>
            <p className="text-gray-400 mb-6">{t.description}</p>

            <a
              href={`/subscribe?tier=${t.tier}`}
              className="mt-auto py-2 rounded bg-[#4A4AFF] hover:bg-[#5A5AFF] text-center block"
            >
              Choose {t.name}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
