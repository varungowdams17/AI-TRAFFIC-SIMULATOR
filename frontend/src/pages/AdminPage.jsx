/**
 * AdminPage.jsx
 * Admin control panel for managing simulation parameters,
 * traffic intensity, signal timing, and system configuration.
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useTraffic } from '../context/TrafficContext'

export default function AdminPage() {
  const { state, dispatch, speakAlert } = useTraffic()
  const [signalDurations, setSignalDurations] = useState({ north: 30, south: 30, east: 25, west: 20 })
  const [vehicleCount, setVehicleCount] = useState(10)
  const [customAlert, setCustomAlert] = useState('')

  const handleAddVehicles = () => {
    dispatch({ type: 'ADD_VEHICLES', payload: vehicleCount })
    // Increase density to simulate more vehicles
    const boost = vehicleCount * 0.5
    dispatch({
      type: 'UPDATE_DENSITY',
      payload: {
        north: Math.min(100, state.trafficDensity.north + boost),
        south: Math.min(100, state.trafficDensity.south + boost),
        east:  Math.min(100, state.trafficDensity.east + boost),
        west:  Math.min(100, state.trafficDensity.west + boost),
      }
    })
  }

  const handleReduceTraffic = () => {
    dispatch({
      type: 'UPDATE_DENSITY',
      payload: {
        north: Math.max(5, state.trafficDensity.north - 20),
        south: Math.max(5, state.trafficDensity.south - 20),
        east:  Math.max(5, state.trafficDensity.east - 20),
        west:  Math.max(5, state.trafficDensity.west - 20),
      }
    })
    dispatch({ type: 'ADD_ALERT', payload: { type: 'success', message: 'Traffic reduced on all roads' } })
  }

  const handleVoiceAlert = (msg) => {
    speakAlert(msg)
    dispatch({ type: 'ADD_ALERT', payload: { type: 'info', message: `Voice: "${msg}"` } })
  }

  const handleCustomAlert = () => {
    if (!customAlert.trim()) return
    speakAlert(customAlert)
    dispatch({ type: 'ADD_ALERT', payload: { type: 'info', message: customAlert } })
    setCustomAlert('')
  }

  const presetAlerts = [
    'Traffic congestion detected on main road',
    'Emergency vehicle priority activated',
    'Accident detected. Traffic rerouting initiated',
    'Peak hour traffic. Please use alternate routes',
    'All signals operating normally',
    'System maintenance scheduled tonight',
  ]

  return (
    <div className="min-h-screen pt-16 bg-dark-900">
      <div className="section-container py-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold gradient-text">Admin Control Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Manage simulation parameters and system configuration</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Traffic Control */}
          <div className="space-y-4">
            <div className="glass-card border border-white/10 p-5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">🚗 Traffic Control</h3>

              <div className="space-y-4">
                {/* Add vehicles */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Add Vehicles</label>
                  <div className="flex gap-2">
                    <input
                      type="number" min="1" max="50" value={vehicleCount}
                      onChange={e => setVehicleCount(parseInt(e.target.value))}
                      className="flex-1 bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
                    />
                    <button onClick={handleAddVehicles} className="btn-primary text-sm py-2 px-4">Add</button>
                  </div>
                </div>

                <button onClick={handleReduceTraffic} className="w-full btn-success text-sm">
                  📉 Reduce Traffic
                </button>

                <button
                  onClick={() => dispatch({ type: 'TOGGLE_PEAK_HOUR' })}
                  className={`w-full text-sm py-3 rounded-xl font-semibold border transition-all ${
                    state.peakHourMode
                      ? 'bg-orange-500/30 text-orange-400 border-orange-500/50'
                      : 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
                  }`}
                >
                  {state.peakHourMode ? '🔥 Disable Peak Hour' : '🌅 Enable Peak Hour'}
                </button>

                <button
                  onClick={() => dispatch({ type: 'RESET_SIMULATION' })}
                  className="w-full btn-secondary text-sm"
                >
                  🔄 Reset Simulation
                </button>
              </div>
            </div>

            {/* Simulation Settings */}
            <div className="glass-card border border-white/10 p-5">
              <h3 className="font-bold text-white mb-4">⚙️ Simulation Settings</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>Speed</span>
                    <span className="text-primary-400 font-mono">{state.simulationSpeed}x</span>
                  </div>
                  <input
                    type="range" min="0.5" max="4" step="0.5"
                    value={state.simulationSpeed}
                    onChange={e => dispatch({ type: 'SET_SPEED', payload: parseFloat(e.target.value) })}
                    className="w-full accent-primary-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Dark Mode</span>
                  <button
                    onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
                    className={`w-12 h-6 rounded-full transition-all ${state.darkMode ? 'bg-primary-500' : 'bg-slate-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${state.darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Simulation</span>
                  <button
                    onClick={() => dispatch({ type: 'TOGGLE_SIMULATION' })}
                    className={`w-12 h-6 rounded-full transition-all ${state.isRunning ? 'bg-green-500' : 'bg-slate-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${state.isRunning ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Signal Timing */}
          <div className="space-y-4">
            <div className="glass-card border border-white/10 p-5">
              <h3 className="font-bold text-white mb-4">🚦 Signal Timing (seconds)</h3>
              <div className="space-y-4">
                {['north', 'south', 'east', 'west'].map(road => (
                  <div key={road}>
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span className="capitalize">{road}</span>
                      <span className="text-yellow-400 font-mono">{signalDurations[road]}s</span>
                    </div>
                    <input
                      type="range" min="10" max="90" step="5"
                      value={signalDurations[road]}
                      onChange={e => setSignalDurations(d => ({ ...d, [road]: parseInt(e.target.value) }))}
                      className="w-full accent-yellow-500"
                    />
                  </div>
                ))}
                <button
                  onClick={() => dispatch({ type: 'ADD_ALERT', payload: { type: 'success', message: 'Signal timings updated successfully' } })}
                  className="w-full btn-primary text-sm"
                >
                  💾 Apply Signal Timings
                </button>
              </div>
            </div>

            {/* Traffic Density Override */}
            <div className="glass-card border border-white/10 p-5">
              <h3 className="font-bold text-white mb-4">📊 Density Override</h3>
              <div className="space-y-3">
                {['north', 'south', 'east', 'west'].map(road => (
                  <div key={road}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span className="capitalize">{road}</span>
                      <span className={`font-mono font-bold ${
                        state.trafficDensity[road] > 70 ? 'text-red-400' :
                        state.trafficDensity[road] > 40 ? 'text-yellow-400' : 'text-green-400'
                      }`}>{Math.round(state.trafficDensity[road])}%</span>
                    </div>
                    <div className="w-full h-3 bg-dark-900 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${state.trafficDensity[road]}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full ${
                          state.trafficDensity[road] > 70 ? 'bg-red-500' :
                          state.trafficDensity[road] > 40 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Voice Alert System */}
          <div className="space-y-4">
            <div className="glass-card border border-white/10 p-5">
              <h3 className="font-bold text-white mb-4">🔊 Voice Alert System</h3>

              {/* Custom alert */}
              <div className="mb-4">
                <label className="text-xs text-slate-400 mb-2 block">Custom Alert</label>
                <textarea
                  value={customAlert}
                  onChange={e => setCustomAlert(e.target.value)}
                  placeholder="Type custom voice alert..."
                  rows={3}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 resize-none"
                />
                <button onClick={handleCustomAlert} className="w-full btn-primary text-sm mt-2">
                  🔊 Speak Alert
                </button>
              </div>

              {/* Preset alerts */}
              <div>
                <div className="text-xs text-slate-400 mb-2 font-semibold">Preset Alerts</div>
                <div className="space-y-2">
                  {presetAlerts.map((alert, i) => (
                    <button
                      key={i}
                      onClick={() => handleVoiceAlert(alert)}
                      className="w-full text-left text-xs p-3 rounded-xl bg-dark-900 border border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20 transition-all"
                    >
                      🔊 {alert}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Emergency Controls */}
            <div className="glass-card border border-white/10 p-5">
              <h3 className="font-bold text-white mb-4">🚨 Emergency Controls</h3>
              <div className="space-y-2">
                {[
                  { type: 'Ambulance', road: 'north', icon: '🚑', color: 'red' },
                  { type: 'Police', road: 'east', icon: '🚓', color: 'purple' },
                  { type: 'Fire Truck', road: 'west', icon: '🚒', color: 'orange' },
                ].map(em => (
                  <button
                    key={em.type}
                    onClick={() => {
                      dispatch({ type: 'TRIGGER_EMERGENCY', payload: { type: em.type, road: em.road } })
                      setTimeout(() => dispatch({ type: 'CLEAR_EMERGENCY' }), 15000)
                    }}
                    disabled={state.emergencyActive}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-3 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <span>{em.icon}</span>
                    <span>Deploy {em.type}</span>
                  </button>
                ))}

                {state.emergencyActive && (
                  <button
                    onClick={() => dispatch({ type: 'CLEAR_EMERGENCY' })}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all"
                  >
                    ✅ Clear Emergency
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* System Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 glass-card border border-white/10 p-5"
        >
          <h3 className="font-bold text-white mb-4">📋 System Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { label: 'Total Vehicles', value: state.totalVehicles, icon: '🚗' },
              { label: 'Moving', value: state.movingVehicles, icon: '▶️' },
              { label: 'Waiting', value: state.waitingVehicles, icon: '⏸️' },
              { label: 'Emergencies', value: state.analytics.totalEmergencies, icon: '🚨' },
              { label: 'Accidents', value: state.analytics.totalAccidents, icon: '⚠️' },
              { label: 'Congestion', value: `${state.analytics.congestionPercent}%`, icon: '🚦' },
              { label: 'Avg Wait', value: `${state.analytics.avgWaitTime}s`, icon: '⏱️' },
              { label: 'Throughput', value: `${state.analytics.throughput}/m`, icon: '📈' },
            ].map(item => (
              <div key={item.label} className="text-center p-3 bg-dark-900 rounded-xl border border-white/5">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-lg font-bold text-white">{item.value}</div>
                <div className="text-xs text-slate-500">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
