/**
 * SimulatorPage.jsx
 * Main simulation page — wider control panel for full manual control.
 */

import React from 'react'
import { motion } from 'framer-motion'
import TrafficCanvas from '../simulator/TrafficCanvas'
import SimulatorControls from '../simulator/SimulatorControls'
import { useTraffic } from '../context/TrafficContext'

const ROADS = ['north', 'south', 'east', 'west']
const ROAD_ICONS = { north: '⬆️', south: '⬇️', east: '➡️', west: '⬅️' }

export default function SimulatorPage() {
  const { state } = useTraffic()

  return (
    <div className="min-h-screen pt-16 bg-dark-900">
      <div className="section-container py-4">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold gradient-text">Traffic Simulator — Manual Control</h1>
              <p className="text-slate-400 text-sm mt-0.5">You control every signal, density, and event in real-time</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                state.isRunning && !state.isPaused
                  ? 'bg-green-500/10 text-green-400 border-green-500/30'
                  : state.isPaused
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${state.isRunning && !state.isPaused ? 'bg-green-400 animate-pulse' : state.isPaused ? 'bg-yellow-400' : 'bg-slate-400'}`} />
                {state.isRunning && !state.isPaused ? 'LIVE' : state.isPaused ? 'PAUSED' : 'STOPPED'}
              </div>
              {state.emergencyActive && <div className="badge-red animate-pulse">🚨 Emergency</div>}
              {state.accidentActive  && <div className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-semibold">⚠️ Accident</div>}
              {state.peakHourMode    && <div className="badge-yellow">🔥 Peak Hour</div>}
            </div>
          </div>
        </motion.div>

        {/* ── Live Signal Status Bar ───────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="mb-4 grid grid-cols-4 gap-3">
          {ROADS.map(road => {
            const sig = state.signals[road]
            const isGreen = sig?.state === 'green'
            const density = Math.round(state.trafficDensity[road] || 0)
            return (
              <div key={road} className={`glass-card border p-3 text-center transition-all ${
                isGreen ? 'border-green-500/50 bg-green-500/5' : 'border-white/10'
              }`}>
                <div className="text-lg mb-1">{ROAD_ICONS[road]}</div>
                <div className="text-xs font-bold uppercase text-slate-400">{road}</div>
                {/* Signal light dots */}
                <div className="flex justify-center gap-1 my-1.5">
                  <div className={`w-3 h-3 rounded-full ${!isGreen ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-red-900'}`} />
                  <div className={`w-3 h-3 rounded-full ${isGreen ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-green-900'}`} />
                </div>
                <div className={`text-sm font-bold font-mono ${isGreen ? 'text-green-400' : 'text-red-400'}`}>
                  {sig?.timer || 0}s
                </div>
                {/* Density bar */}
                <div className="w-full h-1 bg-dark-900 rounded-full mt-1.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${density > 70 ? 'bg-red-500' : density > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${density}%` }} />
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{density}%</div>
              </div>
            )
          })}
        </motion.div>

        {/* ── Main Layout: Canvas + Controls ──────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Canvas — 2 columns */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
            className="xl:col-span-2 flex flex-col gap-3">
            <div className="glass-card border border-white/10 overflow-hidden" style={{ height: '520px' }}>
              <TrafficCanvas />
            </div>

            {/* Legend */}
            <div className="glass-card border border-white/10 p-3">
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Vehicles:</span>
                {['🚗 Car', '🏍️ Bike', '🚛 Truck', '🚌 Bus', '🚑 Ambulance', '🚓 Police', '🚒 Fire'].map(v => (
                  <span key={v}>{v}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1.5">
                <span className="font-semibold text-slate-300">Density:</span>
                <span className="text-green-400">■ Low &lt;40%</span>
                <span className="text-yellow-400">■ Medium 40–70%</span>
                <span className="text-red-400">■ High &gt;70%</span>
                <span className="text-orange-400">⚠️ Accident</span>
                <span className="text-red-300">🚨 Emergency</span>
              </div>
            </div>
          </motion.div>

          {/* Controls — 1 column, scrollable */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="xl:col-span-1 overflow-y-auto" style={{ maxHeight: '680px' }}>
            <SimulatorControls />
          </motion.div>
        </div>

        {/* ── Algorithm Status Bar ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { algo: 'Greedy',        purpose: 'Signal Optimization', status: 'Active',                                    color: 'green'  },
            { algo: 'Priority Queue',purpose: 'Emergency Handling',  status: state.emergencyActive ? 'ACTIVE' : 'Standby', color: state.emergencyActive ? 'red' : 'blue' },
            { algo: 'Dijkstra',      purpose: 'Route Optimization',  status: state.accidentActive  ? 'Rerouting' : 'Ready', color: state.accidentActive ? 'yellow' : 'blue' },
            { algo: 'Dynamic Prog.', purpose: 'Traffic Prediction',  status: state.isRunning ? 'Running' : 'Idle',         color: state.isRunning ? 'purple' : 'blue' },
          ].map(item => (
            <div key={item.algo} className="glass-card border border-white/10 p-3">
              <div className="text-xs text-slate-500 mb-0.5">{item.purpose}</div>
              <div className="font-bold text-sm text-white">{item.algo}</div>
              <div className={`text-xs mt-1 font-semibold ${
                item.color === 'green'  ? 'text-green-400'  :
                item.color === 'red'    ? 'text-red-400'    :
                item.color === 'yellow' ? 'text-yellow-400' :
                item.color === 'purple' ? 'text-purple-400' : 'text-blue-400'
              }`}>● {item.status}</div>
            </div>
          ))}
        </motion.div>

      </div>
    </div>
  )
}
