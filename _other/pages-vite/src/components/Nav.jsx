import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Menu, X } from 'lucide-react'

export default function Nav({ scrolled }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-dark/95 backdrop-blur-md shadow-lg border-b border-white/10' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-dark" />
          </div>
          <span className="text-xl font-bold">AgentLayer</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#endpoints" className="text-sm text-gray-300 hover:text-white transition-colors">Endpoints</a>
          <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors">Live Prices</a>
          <a href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">Pricing</a>
          <a
            href="#pricing"
            className="bg-green-500 hover:bg-green-600 text-dark px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Get API Key
          </a>
        </div>

        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-darker border-t border-white/10 p-4">
          <a href="#endpoints" className="block py-2 text-gray-300">Endpoints</a>
          <a href="#features" className="block py-2 text-gray-300">Live Prices</a>
          <a href="#pricing" className="block py-2 text-gray-300">Pricing</a>
          <a href="#pricing" className="block py-2 text-green-400 font-medium">Get API Key</a>
        </div>
      )}
    </motion.nav>
  )
}
