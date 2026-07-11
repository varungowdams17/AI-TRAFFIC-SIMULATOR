/**
 * AlertBanner.jsx
 * Floating alert notifications for emergency, accident, and system events.
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTraffic } from '../context/TrafficContext'

const alertStyles = {
  emergency: 'bg-red-500/20 border-red-500/50 text-red-300',
  danger: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
  success: 'bg-green-500/20 border-green-500/50 text-green-300',
  info: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
}

export default function AlertBanner() {
  const { state } = useTraffic()
  const latestAlerts = state.alerts.slice(0, 3)

  return (
    <div className="fixed top-20 right-4 z-40 space-y-2 max-w-sm w-full">
      <AnimatePresence>
        {latestAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className={`glass-card border px-4 py-3 text-sm font-medium ${alertStyles[alert.type] || alertStyles.info}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex-1">{alert.message}</span>
              <span className="text-xs opacity-60 whitespace-nowrap">{alert.time}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
