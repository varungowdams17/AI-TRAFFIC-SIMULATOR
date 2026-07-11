/**
 * SimulatorControls.jsx
 * FULL MANUAL CONTROL PANEL
 * - Switch any signal green/red with one click
 * - Set exact green duration per road (5–120 seconds)
 * - Set vehicle density per road (0–100%)
 * - Toggle AI auto-mode vs manual mode
 * - Emergency deploy, accident trigger, speed control
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTraffic } from '../context/TrafficContext'

const ROADS = ['north', 'south', 'east', 'west']
const ROAD_ICONS = { north: '⬆️', south: '⬇️', east: '➡️', west: '⬅️' }
const ROAD_COLORS = {
  north: 'blue', south: 'purple', east: 'green', west: 'yellow'
}
const COLOR_MAP = {
  blue:   { bg: 'bg-blue-500/20',   border: 'border-blue-500/40',   text: 'text-blue-400',   active: 'bg-blue-500/40' },
  purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400', active: 'bg-purple-500/40' },
  green:  { bg: 'bg-green-500/20',  border: 'border-green-500/40',  text: 'text-green-400',  active: 'bg-green-500/40' },
  yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', active: 'bg-yellow-500/40' },
}

export default function SimulatorControls() {
  const { state, dispatch } = useTraffic()

  // Local state for manual signal durations (seconds)
  const [manualDurations, setManualDurations] = useState({ north: 30, south: 30, east: 25, west: 20 })
  // Local state for manual density overrides
  const [manualDensity, setManualDensity] = useState({ north: 30, south: 25, east: 40, west: 20 })
  // AI auto mode toggle
  const [autoMode, setAutoMode] = useState(true)
  // Active tab
  const [tab, setTab] = useState('signals') // 'signals' | 'density' | 'emergency' | 'sim'

  // ── Apply manual signal: set one road green, rest red ──────────────────────
  const setGreen = (road) => {
    const newSignals = {}
    ROADS.forEach(r => {
      newSignals[r] = {
        state: r === road ? 'green' : 'red',
        timer: r === road ? manualDurations[road] : manualDurations[r],
        duration: manualDurations[r],
        density: state.trafficDensity[r],
      }
    })
    dispatch({ type: 'UPDATE_SIGNALS', payload: { signals: newSignals, activeSignal: road } })
    dispatch({ type: 'ADD_ALERT', payload: { type: 'info', message: `🟢 Manual: ${road.toUpperCase()} set to GREEN (${manualDurations[road]}s)` } })
  }

  // ── Apply all durations at once ────────────────────────────────────────────
  const applyAllDurations = () => {
    const newSignals = {}
    ROADS.forEach(r => {
      newSignals[r] = {
        ...state.signals[r],
        timer: manualDurations[r],
        duration: manualDurations[r],
      }
    })
    dispatch({ type: 'UPDATE_SIGNALS', payload: { signals: newSignals, activeSignal: state.activeSignal } })
    dispatch({ type: 'ADD_ALERT', payload: { type: 'success', message: '✅ Signal timings applied to all roads' } })
  }

  // ── Apply manual density ───────────────────────────────────────────────────
  const applyDensity = () => {
    dispatch({ type: 'UPDATE_DENSITY', payload: { ...manualDensity } })
    dispatch({ type: 'ADD_ALERT', payload: { type: 'info', message: '📊 Traffic density updated manually' } })
  }

  // ── Set all signals red (stop all) ────────────────────────────────────────
  const stopAll = () => {
    const newSignals = {}
    ROADS.forEach(r => {
      newSignals[r] = { state: 'red', timer: 99, duration: 99, density: state.trafficDensity[r] }
    })
    dispatch({ type: 'UPDATE_SIGNALS', payload: { signals: newSignals, activeSignal: null } })
    dispatch({ type: 'ADD_ALERT', payload: { type: 'warning', message: '🔴 ALL SIGNALS SET TO RED' } })
  }

  // ── Emergency ─────────────────────────────────────────────────────────────
  const triggerEmergency = (type, road, icon) => {
    dispatch({ type: 'TRIGGER_EMERGENCY', payload: { type, road } })
    setTimeout(() => dispatch({ type: 'CLEAR_EMERGENCY' }), 15000)
  }

  // ── Accident ──────────────────────────────────────────────────────────────
  const triggerAccident = (road) => {
    dispatch({ type: 'TRIGGER_ACCIDENT', payload: { road } })
    setTimeout(() => {
      const last = state.accidents[state.accidents.length - 1]
      if (last) dispatch({ type: 'CLEAR_ACCIDENT', payload: last.id })
    }, 20000)
  }

  const tabs = [
    { id: 'signals',   label: '🚦 Signals',   title: 'Signal Control' },
    { id: 'density',   label: '📊 Density',   title: 'Traffic Density' },
    { id: 'emergency', label: '🚨 Emergency', title: 'Emergency & Accidents' },
    { id: 'sim',       label: '⚙️ Sim',       title: 'Simulation' },
  ]

  return (
    <div className="space-y-3">

      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div className="glass-card border border-white/10 p-1 grid grid-cols-4 gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              tab === t.id
                ? 'bg-primary-500/30 text-primary-300 border border-primary-500/40'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

        {/* ════════════════════════════════════════════════════════════════
            TAB 1 — SIGNAL CONTROL
        ════════════════════════════════════════════════════════════════ */}
        {tab === 'signals' && (
          <div className="space-y-3">

            {/* AI / Manual toggle */}
            <div className="glass-card border border-white/10 p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Control Mode</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {autoMode ? '🧠 AI Greedy Algorithm' : '🕹️ Full Manual Control'}
                </div>
              </div>
              <button onClick={() => {
                setAutoMode(!autoMode)
                dispatch({ type: 'ADD_ALERT', payload: { type: 'info', message: autoMode ? '🕹️ Switched to Manual Control' : '🧠 Switched to AI Auto Mode' } })
              }}
                className={`relative w-14 h-7 rounded-full transition-all ${autoMode ? 'bg-primary-500' : 'bg-orange-500'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoMode ? 'left-1' : 'left-8'}`} />
              </button>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={stopAll}
                className="py-2.5 rounded-xl text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all">
                🔴 Stop All
              </button>
              <button onClick={applyAllDurations}
                className="py-2.5 rounded-xl text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all">
                ✅ Apply Timings
              </button>
            </div>

            {/* Per-road signal control */}
            {ROADS.map(road => {
              const sig = state.signals[road]
              const isGreen = sig?.state === 'green'
              const c = COLOR_MAP[ROAD_COLORS[road]]
              return (
                <div key={road} className={`glass-card border ${c.border} p-3 space-y-2`}>
                  {/* Road header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ROAD_ICONS[road]}</span>
                      <span className={`font-bold text-sm uppercase ${c.text}`}>{road}</span>
                    </div>
                    {/* Signal state badge */}
                    <div className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                      isGreen ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-red-500/20 text-red-400 border-red-500/40'
                    }`}>
                      {isGreen ? '🟢 GREEN' : '🔴 RED'} {sig?.timer || 0}s
                    </div>
                  </div>

                  {/* Duration slider */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Green Duration</span>
                      <span className="font-mono font-bold text-white">{manualDurations[road]}s</span>
                    </div>
                    <input type="range" min="5" max="120" step="5"
                      value={manualDurations[road]}
                      onChange={e => setManualDurations(d => ({ ...d, [road]: parseInt(e.target.value) }))}
                      className="w-full accent-green-500 h-2 rounded-full" />
                    <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                      <span>5s</span><span>60s</span><span>120s</span>
                    </div>
                  </div>

                  {/* Set Green button */}
                  <button onClick={() => setGreen(road)}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      isGreen
                        ? 'bg-green-500/30 text-green-300 border border-green-500/50 cursor-default'
                        : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/25 hover:border-green-500/40'
                    }`}>
                    {isGreen ? '✅ Currently GREEN' : `▶ Set ${road.toUpperCase()} GREEN (${manualDurations[road]}s)`}
                  </button>
                </div>
              )
            })}

            {/* Current active signal info */}
            <div className="glass-card border border-primary-500/20 p-3 bg-primary-500/5">
              <div className="text-xs text-primary-400 font-bold mb-1">
                {autoMode ? '🧠 AI Decision' : '🕹️ Manual Override'}
              </div>
              <div className="text-xs text-slate-300">
                Active green: <span className="text-green-400 font-bold uppercase">{state.activeSignal || 'none'}</span>
                {autoMode && <span className="text-slate-500 ml-2">(auto-rotates every 8s)</span>}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 2 — TRAFFIC DENSITY
        ════════════════════════════════════════════════════════════════ */}
        {tab === 'density' && (
          <div className="space-y-3">
            <div className="glass-card border border-white/10 p-3">
              <div className="text-xs text-slate-400 mb-3">
                Set vehicle density per road. Higher density = more vehicles spawning.
              </div>
              {ROADS.map(road => {
                const live = Math.round(state.trafficDensity[road])
                const c = COLOR_MAP[ROAD_COLORS[road]]
                const level = manualDensity[road] > 70 ? 'HIGH' : manualDensity[road] > 40 ? 'MED' : 'LOW'
                const levelColor = manualDensity[road] > 70 ? 'text-red-400' : manualDensity[road] > 40 ? 'text-yellow-400' : 'text-green-400'
                return (
                  <div key={road} className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold uppercase flex items-center gap-1 ${c.text}`}>
                        {ROAD_ICONS[road]} {road}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${levelColor}`}>{level}</span>
                        <span className="text-sm font-mono font-bold text-white">{manualDensity[road]}%</span>
                        <span className="text-xs text-slate-500">(live: {live}%)</span>
                      </div>
                    </div>
                    <input type="range" min="0" max="100" step="5"
                      value={manualDensity[road]}
                      onChange={e => setManualDensity(d => ({ ...d, [road]: parseInt(e.target.value) }))}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: manualDensity[road] > 70 ? '#ef4444' : manualDensity[road] > 40 ? '#f59e0b' : '#22c55e' }} />
                    {/* Visual bar */}
                    <div className="w-full h-1.5 bg-dark-900 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${manualDensity[road] > 70 ? 'bg-red-500' : manualDensity[road] > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${manualDensity[road]}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Preset buttons */}
            <div className="glass-card border border-white/10 p-3 space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Presets</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '🌙 Night (Low)', vals: { north: 10, south: 10, east: 10, west: 10 } },
                  { label: '🌅 Morning', vals: { north: 40, south: 35, east: 50, west: 30 } },
                  { label: '🔥 Peak Hour', vals: { north: 85, south: 90, east: 80, west: 75 } },
                  { label: '🚧 Roadwork', vals: { north: 90, south: 20, east: 20, west: 20 } },
                  { label: '⚖️ Balanced', vals: { north: 50, south: 50, east: 50, west: 50 } },
                  { label: '🎲 Random', vals: Object.fromEntries(ROADS.map(r => [r, Math.floor(Math.random() * 80) + 10])) },
                ].map(preset => (
                  <button key={preset.label} onClick={() => setManualDensity(preset.vals)}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left">
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={applyDensity}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:opacity-90 transition-all">
              📊 Apply Density to Simulation
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 3 — EMERGENCY & ACCIDENTS
        ════════════════════════════════════════════════════════════════ */}
        {tab === 'emergency' && (
          <div className="space-y-3">

            {/* Emergency vehicles */}
            <div className="glass-card border border-white/10 p-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Deploy Emergency Vehicle</div>
              <div className="text-xs text-slate-500 mb-3">Select road → vehicle gets immediate green corridor</div>
              {[
                { type: 'Ambulance',  icon: '🚑', priority: 10, color: 'red' },
                { type: 'Police',     icon: '🚓', priority: 9,  color: 'purple' },
                { type: 'Fire Truck', icon: '🚒', priority: 8,  color: 'orange' },
              ].map(em => (
                <div key={em.type} className="mb-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{em.icon}</span>
                    <span className="text-sm font-bold text-white">{em.type}</span>
                    <span className="text-xs text-slate-500 ml-auto">Priority {em.priority}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {ROADS.map(road => (
                      <button key={road} onClick={() => triggerEmergency(em.type, road, em.icon)}
                        disabled={state.emergencyActive}
                        className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all disabled:opacity-40 disabled:cursor-not-allowed
                          bg-${em.color === 'red' ? 'red' : em.color === 'purple' ? 'purple' : 'orange'}-500/10
                          text-${em.color === 'red' ? 'red' : em.color === 'purple' ? 'purple' : 'orange'}-400
                          border border-${em.color === 'red' ? 'red' : em.color === 'purple' ? 'purple' : 'orange'}-500/20
                          hover:bg-${em.color === 'red' ? 'red' : em.color === 'purple' ? 'purple' : 'orange'}-500/25`}>
                        {ROAD_ICONS[road]}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-1 mt-0.5">
                    {ROADS.map(road => (
                      <div key={road} className="text-center text-xs text-slate-600 capitalize">{road}</div>
                    ))}
                  </div>
                </div>
              ))}

              {state.emergencyActive && (
                <div className="mt-2 p-3 bg-red-500/20 rounded-xl border border-red-500/40 text-center">
                  <div className="text-red-300 text-xs font-bold animate-pulse">
                    🚨 {state.emergencyType} ACTIVE — {state.emergencyRoad?.toUpperCase()}
                  </div>
                  <button onClick={() => dispatch({ type: 'CLEAR_EMERGENCY' })}
                    className="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all">
                    ✅ Clear Emergency
                  </button>
                </div>
              )}
            </div>

            {/* Accident simulation */}
            <div className="glass-card border border-white/10 p-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Simulate Accident</div>
              <div className="text-xs text-slate-500 mb-3">Blocks road, triggers rerouting via Dijkstra</div>
              <div className="grid grid-cols-2 gap-2">
                {ROADS.map(road => (
                  <button key={road} onClick={() => triggerAccident(road)}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/25 transition-all capitalize">
                    <span>{ROAD_ICONS[road]}</span>
                    <span>⚠️ {road}</span>
                  </button>
                ))}
              </div>
              {state.accidentActive && (
                <div className="mt-2 p-3 bg-orange-500/20 rounded-xl border border-orange-500/40 text-center">
                  <div className="text-orange-300 text-xs font-bold">⚠️ ACCIDENT ACTIVE — REROUTING</div>
                  <button onClick={() => {
                    const last = state.accidents[state.accidents.length - 1]
                    if (last) dispatch({ type: 'CLEAR_ACCIDENT', payload: last.id })
                  }}
                    className="mt-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all">
                    ✅ Clear Road
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB 4 — SIMULATION SETTINGS
        ════════════════════════════════════════════════════════════════ */}
        {tab === 'sim' && (
          <div className="space-y-3">

            {/* Play/Pause/Reset */}
            <div className="glass-card border border-white/10 p-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Simulation Control</div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => dispatch({ type: 'TOGGLE_SIMULATION' })}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${
                    state.isRunning
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                  }`}>
                  {state.isRunning ? '⏹' : '▶'}
                </button>
                <button onClick={() => dispatch({ type: 'PAUSE_SIMULATION' })}
                  disabled={!state.isRunning}
                  className="py-3 rounded-xl font-bold text-sm bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 disabled:opacity-40 transition-all">
                  {state.isPaused ? '▶' : '⏸'}
                </button>
                <button onClick={() => dispatch({ type: 'RESET_SIMULATION' })}
                  className="py-3 rounded-xl font-bold text-sm bg-slate-500/20 text-slate-400 border border-slate-500/30 hover:bg-slate-500/30 transition-all">
                  🔄
                </button>
              </div>
              <div className="flex gap-2 mt-2 text-xs text-center text-slate-500">
                <span className="flex-1">{state.isRunning ? 'Stop' : 'Start'}</span>
                <span className="flex-1">{state.isPaused ? 'Resume' : 'Pause'}</span>
                <span className="flex-1">Reset</span>
              </div>
            </div>

            {/* Speed */}
            <div className="glass-card border border-white/10 p-3">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span className="font-bold uppercase tracking-wider">Simulation Speed</span>
                <span className="font-mono font-bold text-primary-400 text-sm">{state.simulationSpeed}x</span>
              </div>
              <input type="range" min="0.5" max="4" step="0.5"
                value={state.simulationSpeed}
                onChange={e => dispatch({ type: 'SET_SPEED', payload: parseFloat(e.target.value) })}
                className="w-full h-3 rounded-full appearance-none cursor-pointer accent-primary-500" />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map(v => <span key={v}>{v}x</span>)}
              </div>
            </div>

            {/* Peak hour */}
            <div className="glass-card border border-white/10 p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Peak Hour Mode</div>
                <div className="text-xs text-slate-500 mt-0.5">Boosts all road densities to 75–90%</div>
              </div>
              <button onClick={() => dispatch({ type: 'TOGGLE_PEAK_HOUR' })}
                className={`relative w-14 h-7 rounded-full transition-all ${state.peakHourMode ? 'bg-orange-500' : 'bg-slate-600'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${state.peakHourMode ? 'left-8' : 'left-1'}`} />
              </button>
            </div>

            {/* Dark mode */}
            <div className="glass-card border border-white/10 p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Dark Mode</div>
                <div className="text-xs text-slate-500 mt-0.5">Toggle UI theme</div>
              </div>
              <button onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
                className={`relative w-14 h-7 rounded-full transition-all ${state.darkMode ? 'bg-primary-500' : 'bg-slate-400'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${state.darkMode ? 'left-8' : 'left-1'}`} />
              </button>
            </div>

            {/* Live stats */}
            <div className="glass-card border border-white/10 p-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Live Stats</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total Vehicles', value: state.totalVehicles, color: 'text-blue-400' },
                  { label: 'Moving', value: state.movingVehicles, color: 'text-green-400' },
                  { label: 'Waiting', value: state.waitingVehicles, color: 'text-yellow-400' },
                  { label: 'Congestion', value: `${state.analytics.congestionPercent}%`, color: 'text-red-400' },
                  { label: 'Avg Wait', value: `${state.analytics.avgWaitTime}s`, color: 'text-purple-400' },
                  { label: 'Throughput', value: `${state.analytics.throughput}/m`, color: 'text-cyan-400' },
                ].map(s => (
                  <div key={s.label} className="bg-dark-900 rounded-xl p-2 text-center">
                    <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
