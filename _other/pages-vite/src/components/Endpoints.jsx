import React from 'react'
import { motion } from 'framer-motion'
import { Database, BarChart3, AlertTriangle, Globe, Activity, Zap } from 'lucide-react'

const endpoints = [
  {
    method: 'GET',
    path: '/v1/llm-costs',
    description: 'Real-time LLM pricing across all providers. Returns model IDs, input/output costs per 1M tokens.',
    color: 'text-green-400 bg-green-500/10'
  },
  {
    method: 'GET',
    path: '/v1/model-benchmarks',
    description: 'Performance benchmarks comparing model quality, speed, and cost metrics.',
    color: 'text-blue-400 bg-blue-500/10'
  },
  {
    method: 'GET',
    path: '/v1/deprecations',
    description: 'Active and upcoming model/provider deprecations with 30-day advance notice.',
    color: 'text-orange-400 bg-orange-500/10'
  },
  {
    method: 'GET',
    path: '/v1/providers',
    description: 'List all tracked LLM providers with metadata and update timestamps.',
    color: 'text-purple-400 bg-purple-500/10'
  },
  {
    method: 'GET',
    path: '/v1/changes',
    description: 'Recent pricing changes and model updates across all providers. Hourly diff.',
    color: 'text-yellow-400 bg-yellow-500/10'
  }
]

export default function Endpoints() {
  return (
    <section id="endpoints" className="py-20 px-6 bg-darker">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Intelligence Endpoints</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            MCP-native API endpoints delivering real-time LLM pricing, benchmarks, and alerts.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-4">
          {endpoints.map((endpoint, index) => (
            <motion.div
              key={endpoint.path}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-xl p-6 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start gap-4">
                <span className={`px-3 py-1 rounded-md text-xs font-bold ${endpoint.color}`}>
                  {endpoint.method}
                </span>
                <div className="flex-1">
                  <code className="text-green-400 font-mono text-lg">{endpoint.path}</code>
                  <p className="text-gray-400 mt-2">{endpoint.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-6 py-3">
            <Zap className="w-5 h-5 text-green-400" />
            <span className="text-green-400">MCP-native • All endpoints support x-api-key auth</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
