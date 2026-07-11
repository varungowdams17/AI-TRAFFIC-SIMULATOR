/**
 * StatCard.jsx
 * Reusable animated statistics card for the dashboard.
 */

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function StatCard({ title, value, unit = '', icon, color = 'blue', trend, subtitle }) {
  const [displayValue, setDisplayValue] = useState(0)

  // Animated counter effect
  useEffect(() => {
    const target = typeof value === 'number' ? value : 0
    const duration = 600
    const steps = 20
    const increment = (target - displayValue) / steps
    let current = displayValue
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      if (step >= steps) {
        setDisplayValue(target)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`glass-card border bg-gradient-to-br p-5 ${colorMap[color]} transition-all duration-300`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl">{icon}</div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">
        {displayValue.toLocaleString()}<span className="text-lg ml-1 opacity-70">{unit}</span>
      </div>
      <div className="text-sm font-medium opacity-80">{title}</div>
      {subtitle && <div className="text-xs opacity-50 mt-1">{subtitle}</div>}
    </motion.div>
  )
}
