/**
 * TrafficContext.jsx
 * Global state + simulation engine for AI Traffic Simulator.
 *
 * Signal rotation fix:
 *  - Uses a single master interval (1 Hz) that handles BOTH density ticks
 *    AND signal countdown/rotation — no stale-closure issues.
 *  - Signal timer counts down every second; when it hits 0 the next road
 *    gets green (Greedy: highest density wins).
 */

import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROADS = ['north', 'south', 'east', 'west']

function greedyNextGreen(densities, currentGreen, emergencyActive, emergencyRoad) {
  if (emergencyActive && emergencyRoad) return emergencyRoad
  // Sort by density descending; skip current green so we actually rotate
  const sorted = [...ROADS].sort((a, b) => densities[b] - densities[a])
  // Pick highest-density road that is NOT currently green (forces rotation)
  const next = sorted.find(r => r !== currentGreen)
  return next || sorted[0]
}

function buildSignals(greenRoad, greenDuration, redDuration) {
  const signals = {}
  ROADS.forEach(r => {
    signals[r] = {
      state:    r === greenRoad ? 'green' : 'red',
      timer:    r === greenRoad ? greenDuration : redDuration,
      duration: r === greenRoad ? greenDuration : redDuration,
    }
  })
  return signals
}

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  isRunning: false,
  isPaused:  false,
  simulationSpeed: 1,
  peakHourMode: false,
  darkMode: true,

  vehicles: [],
  totalVehicles: 0,
  movingVehicles: 0,
  waitingVehicles: 0,
  trafficDensity: { north: 30, south: 25, east: 40, west: 20 },

  // Signals: each road has { state, timer, duration }
  signals: buildSignals('south', 30, 30),
  activeSignal: 'south',

  emergencyActive: false,
  emergencyType: null,
  emergencyRoad: null,

  accidents: [],
  accidentActive: false,

  analytics: {
    avgWaitTime: 0, fuelWastage: 0, pollutionLevel: 0,
    congestionPercent: 0, totalEmergencies: 0, totalAccidents: 0, throughput: 0,
  },

  densityHistory: [],
  waitTimeHistory: [],
  throughputHistory: [],
  alerts: [],
  dijkstraResult: null,
  greedyResult: null,
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function trafficReducer(state, action) {
  switch (action.type) {

    case 'TOGGLE_SIMULATION':
      return { ...state, isRunning: !state.isRunning, isPaused: false }

    case 'PAUSE_SIMULATION':
      return { ...state, isPaused: !state.isPaused }

    case 'RESET_SIMULATION':
      return {
        ...initialState,
        darkMode: state.darkMode,
        alerts: [{ id: Date.now(), type: 'info', message: 'Simulation reset', time: new Date().toLocaleTimeString() }]
      }

    case 'SET_SPEED':
      return { ...state, simulationSpeed: action.payload }

    case 'TOGGLE_PEAK_HOUR':
      return {
        ...state,
        peakHourMode: !state.peakHourMode,
        trafficDensity: !state.peakHourMode
          ? { north: 85, south: 90, east: 80, west: 75 }
          : { north: 30, south: 25, east: 40, west: 20 }
      }

    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode }

    case 'UPDATE_VEHICLES':
      return {
        ...state,
        vehicles: action.payload,
        totalVehicles: action.payload.length,
        movingVehicles:  action.payload.filter(v => v.state === 'moving').length,
        waitingVehicles: action.payload.filter(v => v.state === 'waiting').length,
      }

    // Manual signal override from control panel
    case 'UPDATE_SIGNALS':
      return { ...state, signals: action.payload.signals, activeSignal: action.payload.activeSignal }

    case 'UPDATE_DENSITY':
      return { ...state, trafficDensity: action.payload }

    // Master tick: density + signal countdown + rotation in one dispatch
    case 'MASTER_TICK': {
      const { density, analytics, historyEntry } = action.payload

      // ── Signal countdown ──────────────────────────────────────────────────
      const newSignals = {}
      let newActiveSignal = state.activeSignal
      let needRotation = false

      ROADS.forEach(r => {
        const sig = state.signals[r]
        const newTimer = Math.max(0, (sig.timer || 0) - 1)
        newSignals[r] = { ...sig, timer: newTimer }
        // Green road timer hit 0 → time to rotate
        if (r === state.activeSignal && newTimer === 0) needRotation = true
      })

      if (needRotation) {
        // Greedy: pick next road
        newActiveSignal = greedyNextGreen(density, state.activeSignal, state.emergencyActive, state.emergencyRoad)
        const greenDuration = Math.min(60, 20 + Math.floor((density[newActiveSignal] || 30) / 100 * 40))
        const redDuration   = Math.min(40, 10 + Math.floor((density[newActiveSignal] || 30) / 100 * 20))
        ROADS.forEach(r => {
          newSignals[r] = {
            state:    r === newActiveSignal ? 'green' : 'red',
            timer:    r === newActiveSignal ? greenDuration : redDuration,
            duration: r === newActiveSignal ? greenDuration : redDuration,
          }
        })
      }

      return {
        ...state,
        trafficDensity: density,
        signals: newSignals,
        activeSignal: newActiveSignal,
        analytics: { ...state.analytics, ...analytics },
        densityHistory:    [...state.densityHistory.slice(-19),    historyEntry.density],
        waitTimeHistory:   [...state.waitTimeHistory.slice(-19),   historyEntry.waitTime],
        throughputHistory: [...state.throughputHistory.slice(-19), historyEntry.throughput],
      }
    }

    case 'TRIGGER_EMERGENCY':
      return {
        ...state,
        emergencyActive: true,
        emergencyType: action.payload.type,
        emergencyRoad: action.payload.road,
        // Immediately give green to emergency road
        signals: buildSignals(action.payload.road, 60, 60),
        activeSignal: action.payload.road,
        alerts: [
          { id: Date.now(), type: 'emergency', message: `🚨 ${action.payload.type} on ${action.payload.road} – Priority Activated!`, time: new Date().toLocaleTimeString() },
          ...state.alerts.slice(0, 9)
        ],
        analytics: { ...state.analytics, totalEmergencies: state.analytics.totalEmergencies + 1 }
      }

    case 'CLEAR_EMERGENCY':
      return {
        ...state,
        emergencyActive: false,
        emergencyType: null,
        emergencyRoad: null,
        alerts: [
          { id: Date.now(), type: 'success', message: '✅ Emergency cleared – Normal traffic resumed', time: new Date().toLocaleTimeString() },
          ...state.alerts.slice(0, 9)
        ]
      }

    case 'TRIGGER_ACCIDENT':
      return {
        ...state,
        accidentActive: true,
        accidents: [...state.accidents, { id: Date.now(), road: action.payload.road, time: new Date().toLocaleTimeString() }],
        alerts: [
          { id: Date.now(), type: 'danger', message: `⚠️ Accident on ${action.payload.road} – Rerouting!`, time: new Date().toLocaleTimeString() },
          ...state.alerts.slice(0, 9)
        ],
        analytics: { ...state.analytics, totalAccidents: state.analytics.totalAccidents + 1 }
      }

    case 'CLEAR_ACCIDENT':
      return {
        ...state,
        accidentActive: state.accidents.filter(a => a.id !== action.payload).length > 0,
        accidents: state.accidents.filter(a => a.id !== action.payload),
        alerts: [
          { id: Date.now(), type: 'success', message: '✅ Road cleared – Traffic restored', time: new Date().toLocaleTimeString() },
          ...state.alerts.slice(0, 9)
        ]
      }

    case 'ADD_ALERT':
      return {
        ...state,
        alerts: [
          { id: Date.now(), ...action.payload, time: new Date().toLocaleTimeString() },
          ...state.alerts.slice(0, 9)
        ]
      }

    case 'ADD_VEHICLES':
      return {
        ...state,
        alerts: [
          { id: Date.now(), type: 'info', message: `Added ${action.payload} vehicles`, time: new Date().toLocaleTimeString() },
          ...state.alerts.slice(0, 9)
        ]
      }

    case 'SET_DIJKSTRA_RESULT': return { ...state, dijkstraResult: action.payload }
    case 'SET_GREEDY_RESULT':   return { ...state, greedyResult:   action.payload }

    default: return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const TrafficContext = createContext(null)

export function TrafficProvider({ children }) {
  const [state, dispatch] = useReducer(trafficReducer, initialState)

  // Use a ref so the interval callback always reads fresh state
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode)
  }, [state.darkMode])

  // ── Master 1-second interval ──────────────────────────────────────────────
  // One interval handles everything: density fluctuation + signal countdown +
  // signal rotation. No stale-closure issues because we read from stateRef.
  useEffect(() => {
    if (!state.isRunning || state.isPaused) return

    const interval = setInterval(() => {
      const s = stateRef.current
      if (!s.isRunning || s.isPaused) return

      const speed = s.simulationSpeed
      const peakMult = s.peakHourMode ? 1.5 : 1

      // ── Density fluctuation ─────────────────────────────────────────────
      const newDensity = {}
      ROADS.forEach(road => {
        const current = s.trafficDensity[road]
        const change = (Math.random() - 0.45) * 5 * speed * peakMult
        let next = Math.max(5, Math.min(100, current + change))
        // Accident road stays congested
        if (s.accidentActive && s.accidents.length > 0) {
          const accRoad = s.accidents[s.accidents.length - 1].road?.toLowerCase()
          if (road === accRoad) next = Math.min(100, next + 8)
        }
        newDensity[road] = next
      })

      // ── Analytics ───────────────────────────────────────────────────────
      const avg = Object.values(newDensity).reduce((a, b) => a + b, 0) / 4
      const analytics = {
        avgWaitTime:       Math.floor(avg * 0.6),
        fuelWastage:       Math.floor(avg * 0.15),
        pollutionLevel:    Math.floor(avg * 0.12),
        congestionPercent: Math.floor(avg),
        throughput:        Math.floor((100 - avg) * 2),
      }
      const t = new Date().toLocaleTimeString()
      const historyEntry = {
        density:    { time: t, value: Math.floor(avg) },
        waitTime:   { time: t, value: analytics.avgWaitTime },
        throughput: { time: t, value: analytics.throughput },
      }

      dispatch({ type: 'MASTER_TICK', payload: { density: newDensity, analytics, historyEntry } })
    }, 1000) // always 1 second — speed affects vehicle movement, not tick rate

    return () => clearInterval(interval)
  }, [state.isRunning, state.isPaused]) // only restart when run/pause changes

  // ── Voice alerts ──────────────────────────────────────────────────────────
  const speakAlert = useCallback((message) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(message)
      u.rate = 0.9; u.pitch = 1; u.volume = 0.8
      window.speechSynthesis.speak(u)
    }
  }, [])

  useEffect(() => {
    if (state.emergencyActive && state.emergencyType)
      speakAlert(`Emergency. ${state.emergencyType} on ${state.emergencyRoad} road. Priority activated.`)
  }, [state.emergencyActive, state.emergencyType, state.emergencyRoad, speakAlert])

  useEffect(() => {
    if (state.accidentActive)
      speakAlert('Accident detected. Traffic rerouting initiated.')
  }, [state.accidentActive, speakAlert])

  return (
    <TrafficContext.Provider value={{ state, dispatch, speakAlert }}>
      {children}
    </TrafficContext.Provider>
  )
}

export function useTraffic() {
  const ctx = useContext(TrafficContext)
  if (!ctx) throw new Error('useTraffic must be used within TrafficProvider')
  return ctx
}

export default TrafficContext
