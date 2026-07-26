import React from 'react'
import { motion } from 'framer-motion'
import { Check, Zap, Database, Activity } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: '$99',
    period: '/month',
    description: 'Full access to intelligence endpoints with hourly updates.',
    features: [
      'Full access to intelligence endpoints',
      'Hourly price updates',
      'MCP-native integration',
      'API key included',
      '5 intelligence endpoints',
      '8 LLM providers tracked'
    ],
    cta: 'Start for $99/mo',
    ctaLink: 'https://agentlayer.site/api/checkout?plan=starter',
    highlighted: true,
    icon: Zap
  },
  {
    name: 'Pro',
    price: '$299',
    period: '/month',
    description: 'Advanced intelligence for production AI operations.',
    features: [
      'Everything in Starter',
      'Higher rate limits',
      'Priority support',
      'Historical data access',
      'Custom alert webhooks',
      'Advanced benchmarks'
    ],
    cta: 'Start for $299/mo',
    ctaLink: 'https://agentlayer.site/api/checkout?plan=pro',
    highlighted: false,
    icon: Database
  },
  {
    name: 'Scale',
    price: '$499',
    period: '/month',
    description: 'Enterprise-grade intelligence with maximum throughput.',
    features: [
      'Everything in Pro',
      'Highest rate limits',
      'Dedicated support',
      'SLA guarantees',
      'Custom integrations',
      'Team management'
    ],
    cta: 'Start for $499/mo',
    ctaLink: 'https://agentlayer.site/api/checkout?plan=scale',
    highlighted: false,
    icon: Activity
  }
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your AI operations needs. All plans include MCP-native access.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? 'bg-green-500/10 border-2 border-green-500 relative'
                  : 'glass'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 px-4 py-1 rounded-full text-sm font-semibold text-dark">
                  Most Popular
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <plan.icon className={`w-6 h-6 ${plan.highlighted ? 'text-green-400' : 'text-gray-400'}`} />
                <h3 className="text-2xl font-bold">{plan.name}</h3>
              </div>
              <div className="mb-4">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>
              <p className="text-gray-400 mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href={plan.ctaLink}
                className={`block text-center py-3 px-6 rounded-xl font-semibold transition-colors ${
                  plan.highlighted
                    ? 'bg-green-500 hover:bg-green-600 text-dark'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
