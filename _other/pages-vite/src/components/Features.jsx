import React from 'react'
import { motion } from 'framer-motion'
import { Database, BarChart3, AlertTriangle, Zap, Globe, Shield, Clock, Activity } from 'lucide-react'

const features = [
  {
    icon: Database,
    title: 'Live LLM Pricing',
    description: 'Track 8+ LLM providers with normalised cost per 1M tokens. Input/output pricing, model IDs and versions. Hourly updates.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: BarChart3,
    title: 'Intelligence Endpoints',
    description: 'Access /v1/llm-costs, /v1/model-benchmarks, /v1/deprecations, /v1/providers, /v1/changes via REST API.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: AlertTriangle,
    title: 'Deprecation Alerts',
    description: '30-day advance notice for provider and model-level deprecations. Delivered via API for proactive management.',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: Zap,
    title: 'MCP-Native Integration',
    description: 'Built for Claude MCP, Cursor MCP, Windsurf MCP. Any MCP-enabled agent can access intelligence endpoints.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Globe,
    title: 'Real-Time Updates',
    description: 'Hourly price updates across all providers. Stay current with the latest LLM pricing changes as they happen.',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: Shield,
    title: 'API Key System',
    description: 'Secure key generation with usage tracking. Tiered access levels for Starter, Pro, and Scale plans.',
    color: 'from-teal-500 to-green-500'
  },
  {
    icon: Clock,
    title: 'Model Benchmarks',
    description: 'Access performance benchmarks across models. Compare quality, speed, and cost metrics in one place.',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    icon: Activity,
    title: 'Provider Change Tracking',
    description: 'Monitor pricing changes, new model releases, and provider updates. Historical data for cost analysis.',
    color: 'from-sky-500 to-blue-500'
  }
]

export default function Features() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Operational Intelligence for AI Systems</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Real-time LLM pricing, cross-provider comparisons, and model-level benchmark data
            delivered via MCP-native API endpoints.
          </p>
        </motion.div>

        <div className="bento-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-6 hover:border-white/20 transition-colors group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
