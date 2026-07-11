/**
 * Navbar.jsx
 * Responsive navigation bar with dark/light mode toggle and active route highlighting.
 */

import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTraffic } from '../context/TrafficContext'

const navLinks = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/simulator', label: 'Simulator', icon: '🚦' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/algorithms', label: 'Algorithms', icon: '🧮' },
  { path: '/admin', label: 'Admin', icon: '⚙️' },
  { path: '/docs', label: 'Docs', icon: '📄' },
]

export default function Navbar() {
  const { state, dispatch } = useTraffic()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-dark-800/95 backdrop-blur-xl border-b border-white/10 shadow-xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-lg font-bold shadow-lg group-hover:shadow-primary-500/40 transition-shadow">
                🚦
              </div>
              {state.isRunning && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-dark-800" />
              )}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold gradient-text leading-tight">AI Traffic</div>
              <div className="text-xs text-slate-400 leading-tight">Simulator v1.0</div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  location.pathname === link.path
                    ? 'text-primary-400 bg-primary-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary-500/10 rounded-lg border border-primary-500/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Simulation Status */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              state.isRunning && !state.isPaused
                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                : state.isPaused
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                state.isRunning && !state.isPaused ? 'bg-green-400 animate-pulse' :
                state.isPaused ? 'bg-yellow-400' : 'bg-slate-400'
              }`} />
              {state.isRunning && !state.isPaused ? 'LIVE' : state.isPaused ? 'PAUSED' : 'STOPPED'}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
              className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-lg"
              title="Toggle dark/light mode"
            >
              {state.darkMode ? '☀️' : '🌙'}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <div className="space-y-1.5">
                <span className={`block w-5 h-0.5 bg-white transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-5 h-0.5 bg-white transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-5 h-0.5 bg-white transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark-800/98 backdrop-blur-xl border-b border-white/10"
          >
            <div className="section-container py-4 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === link.path
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-lg">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
