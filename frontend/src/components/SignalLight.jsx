/**
 * SignalLight.jsx
 * Animated traffic signal component with real-time state display.
 */

import React from 'react'
import { motion } from 'framer-motion'

export default function SignalLight({ road, signal, density }) {
  const isGreen = signal?.state === 'green'
  const isYellow = signal?.state === 'yellow'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card border border-white/10 p-4 flex flex-col items-center gap-3"
    >
      {/* Road label */}
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{road}</div>

      {/* Signal housing */}
      <div className="bg-dark-900 rounded-xl p-3 border border-white/10 flex flex-col gap-2 shadow-inner">
        {/* Red */}
        <motion.div
          animate={{
            opacity: !isGreen && !isYellow ? 1 : 0.15,
            boxShadow: !isGreen && !isYellow ? '0 0 15px #ef4444, 0 0 30px #ef4444' : 'none'
          }}
          transition={{ duration: 0.3 }}
          className="w-8 h-8 rounded-full bg-red-500"
        />
        {/* Yellow */}
        <motion.div
          animate={{
            opacity: isYellow ? 1 : 0.15,
            boxShadow: isYellow ? '0 0 15px #f59e0b, 0 0 30px #f59e0b' : 'none'
          }}
          transition={{ duration: 0.3 }}
          className="w-8 h-8 rounded-full bg-yellow-500"
        />
        {/* Green */}
        <motion.div
          animate={{
            opacity: isGreen ? 1 : 0.15,
            boxShadow: isGreen ? '0 0 15px #22c55e, 0 0 30px #22c55e' : 'none'
          }}
          transition={{ duration: 0.3 }}
          className="w-8 h-8 rounded-full bg-green-500"
        />
      </div>

      {/* Status */}
      <div className={`text-xs font-bold px-3 py-1 rounded-full ${
        isGreen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      }`}>
        {isGreen ? '● GO' : '● STOP'}
      </div>

      {/* Timer */}
      <div className="text-center">
        <div className="text-2xl font-mono font-bold text-white">{signal?.timer || 0}s</div>
        <div className="text-xs text-slate-500">remaining</div>
      </div>

      {/* Density bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Density</span>
          <span>{Math.round(density || 0)}%</span>
        </div>
        <div className="w-full h-2 bg-dark-900 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${density || 0}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${
              density > 70 ? 'bg-red-500' : density > 40 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
          />
        </div>
      </div>
    </motion.div>
  )
}
