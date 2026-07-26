import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, Zap } from 'lucide-react'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Endpoints from './components/Endpoints'
import Pricing from './components/Pricing'
import Footer from './components/Footer'
import Nav from './components/Nav'

function App() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-dark text-white">
      <Nav scrolled={scrolled} />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Endpoints />
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}

export default App
