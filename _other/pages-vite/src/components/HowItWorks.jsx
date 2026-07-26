import React from 'react'
import { motion } from 'framer-motion'
import { Key, Database, Zap, Check } from 'lucide-react'

const steps = [
  {
    icon: Key,
    title: 'Get API Key',
    description: 'Sign up and generate your API key. Starter plan includes full access to all intelligence endpoints.',
    color: 'text-green-400'
  },
  {
    icon: Database,
    title: 'Query Intelligence',
    description: 'Access real-time LLM pricing, model benchmarks, and deprecation alerts via REST API or MCP.',
    color: 'text-blue-400'
  },
  {
    icon: Zap,
    title: 'Integrate via MCP',
    description: 'Connect Claude, Cursor, or Windsurf via MCP-native endpoints. Get intelligence directly in your workflow.',
    color: 'text-yellow-400'
  }
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6 bg-darker">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">How AgentLayer Works</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Simple API access to real-time AI operations intelligence. No infrastructure to manage.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="glass rounded-2xl p-8 text-center relative"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center font-bold text-dark">
                {index + 1}
              </div>
              <step.icon className={`w-12 h-12 mx-auto mb-4 ${step.color}`} />
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-400 leading-relaxed">{step.description}</p>
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
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-green-400">Hourly updates • 8+ providers • MCP-native</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
