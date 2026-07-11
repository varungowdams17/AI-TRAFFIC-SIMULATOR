/**
 * useSimulation.js
 * Custom React hook for simulation control and API integration.
 * Provides clean interface for components to interact with simulation state.
 */

import { useCallback } from 'react'
import { useTraffic } from '../context/TrafficContext'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export function useSimulation() {
  const { state, dispatch, speakAlert } = useTraffic()

  // ── Simulation Controls ───────────────────────────────────────────────────

  const startSimulation = useCallback(async () => {
    dispatch({ type: 'TOGGLE_SIMULATION' })
    try {
      await axios.post(`${API_BASE}/traffic/start`)
    } catch {
      // Backend optional – frontend runs standalone
    }
  }, [dispatch])

  const stopSimulation = useCallback(async () => {
    dispatch({ type: 'TOGGLE_SIMULATION' })
    try {
      await axios.post(`${API_BASE}/traffic/stop`)
    } catch {}
  }, [dispatch])

  const resetSimulation = useCallback(async () => {
    dispatch({ type: 'RESET_SIMULATION' })
    try {
      await axios.post(`${API_BASE}/traffic/reset`)
    } catch {}
  }, [dispatch])

  const setSpeed = useCallback((speed) => {
    dispatch({ type: 'SET_SPEED', payload: speed })
  }, [dispatch])

  const togglePeakHour = useCallback(async () => {
    dispatch({ type: 'TOGGLE_PEAK_HOUR' })
    try {
      await axios.post(`${API_BASE}/traffic/peak-hour`, { enable: !state.peakHourMode })
    } catch {}
  }, [dispatch, state.peakHourMode])

  // ── Emergency Controls ────────────────────────────────────────────────────

  const triggerEmergency = useCallback(async (type, road) => {
    dispatch({ type: 'TRIGGER_EMERGENCY', payload: { type, road } })
    speakAlert(`Emergency vehicle detected. ${type} on ${road} road. Priority corridor activated.`)

    try {
      await axios.post(`${API_BASE}/traffic/emergency`, { type, road })
    } catch {}

    // Auto-clear after 15 seconds
    setTimeout(() => {
      dispatch({ type: 'CLEAR_EMERGENCY' })
    }, 15000)
  }, [dispatch, speakAlert])

  const clearEmergency = useCallback(async () => {
    dispatch({ type: 'CLEAR_EMERGENCY' })
    try {
      await axios.post(`${API_BASE}/traffic/clear-emergency`)
    } catch {}
  }, [dispatch])

  // ── Accident Controls ─────────────────────────────────────────────────────

  const triggerAccident = useCallback(async (road) => {
    dispatch({ type: 'TRIGGER_ACCIDENT', payload: { road } })
    speakAlert(`Accident detected on ${road} road. Traffic rerouting initiated.`)

    try {
      await axios.post(`${API_BASE}/traffic/accident`, { road })
    } catch {}

    // Auto-clear after 20 seconds
    setTimeout(() => {
      const lastAccident = state.accidents[state.accidents.length - 1]
      if (lastAccident) {
        dispatch({ type: 'CLEAR_ACCIDENT', payload: lastAccident.id })
      }
    }, 20000)
  }, [dispatch, speakAlert, state.accidents])

  // ── Algorithm Runners ─────────────────────────────────────────────────────

  const runDijkstra = useCallback(async (source, destination, blockedEdges = []) => {
    try {
      const res = await axios.post(`${API_BASE}/algorithms/dijkstra`, {
        source, destination, blocked_edges: blockedEdges
      })
      dispatch({ type: 'SET_DIJKSTRA_RESULT', payload: res.data.result })
      return res.data
    } catch {
      return null
    }
  }, [dispatch])

  const runGreedy = useCallback(async (densities) => {
    try {
      const res = await axios.post(`${API_BASE}/algorithms/greedy`, { densities })
      dispatch({ type: 'SET_GREEDY_RESULT', payload: res.data.result })
      return res.data
    } catch {
      return null
    }
  }, [dispatch])

  // ── Analytics ─────────────────────────────────────────────────────────────

  const saveSnapshot = useCallback(async () => {
    try {
      await axios.post(`${API_BASE}/analytics/snapshot`, {
        total_vehicles: state.totalVehicles,
        moving_vehicles: state.movingVehicles,
        waiting_vehicles: state.waitingVehicles,
        avg_wait_time: state.analytics.avgWaitTime,
        congestion_percent: state.analytics.congestionPercent,
        throughput: state.analytics.throughput,
        north_density: state.trafficDensity.north,
        south_density: state.trafficDensity.south,
        east_density: state.trafficDensity.east,
        west_density: state.trafficDensity.west,
      })
    } catch {}
  }, [state])

  return {
    // State
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    simulationSpeed: state.simulationSpeed,
    peakHourMode: state.peakHourMode,
    emergencyActive: state.emergencyActive,
    accidentActive: state.accidentActive,
    signals: state.signals,
    trafficDensity: state.trafficDensity,
    analytics: state.analytics,
    alerts: state.alerts,

    // Controls
    startSimulation,
    stopSimulation,
    resetSimulation,
    setSpeed,
    togglePeakHour,
    triggerEmergency,
    clearEmergency,
    triggerAccident,
    runDijkstra,
    runGreedy,
    saveSnapshot,
  }
}
