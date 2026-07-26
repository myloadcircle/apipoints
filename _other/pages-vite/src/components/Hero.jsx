import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Database, Clock, AlertTriangle, Zap } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(74,222,128,0.15)_0%,_transparent_50%)]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-300">Real-time AI operations intelligence</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            AI OPERATIONS
            <br />
            <span className="text-green-400">INTELLIGENCE</span>
          </h1>

          <p className="text-2xl text-gray-300 mb-4 font-medium">
            Stop flying blind on your AI costs.
          </p>

          <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Real-time LLM pricing, model benchmarks, and deprecation alerts — delivered via MCP-native API.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="#pricing"
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              Start for $99/mo
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#endpoints"
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
            >
              View endpoints →
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            {[
              { icon: Database, label: '8 LLM providers tracked', color: 'text-blue-400' },
              { icon: Zap, label: '5 intelligence endpoints', color: 'text-yellow-400' },
              { icon: Clock, label: '<1h price update latency', color: 'text-green-400' },
              { icon: AlertTriangle, label: '30d deprecation notice', color: 'text-orange-400' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="glass rounded-xl p-4 text-center"
              >
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <p className="text-sm text-gray-300">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500 ml-2">bash</span>
              </div>
              <pre className="text-sm text-gray-300 overflow-x-auto">
                <code>curl https://agentlayer-api.agentlayer.workers.dev/v1/llm-costs {'\n'}-H "x-api-key: al_live_..."</code>
              </pre>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
