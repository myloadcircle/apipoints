import React from 'react'
import { Zap, Database, Activity } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-green-400" />
              <span className="text-lg font-bold">AgentLayer</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Real-time operational intelligence for AI systems. Stop flying blind on your AI costs.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Endpoints</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#endpoints" className="hover:text-white transition-colors">/v1/llm-costs</a></li>
              <li><a href="#endpoints" className="hover:text-white transition-colors">/v1/model-benchmarks</a></li>
              <li><a href="#endpoints" className="hover:text-white transition-colors">/v1/deprecations</a></li>
              <li><a href="#endpoints" className="hover:text-white transition-colors">/v1/providers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-white transition-colors">Live Prices</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Get API Key</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © 2026 AgentLayer. Built on Cloudflare.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Database className="w-4 h-4" />
              8 providers
            </span>
            <span className="flex items-center gap-1">
              <Activity className="w-4 h-4" />
              Hourly updates
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
