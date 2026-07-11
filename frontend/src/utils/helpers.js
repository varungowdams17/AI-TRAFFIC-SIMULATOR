/**
 * helpers.js
 * Utility functions used across the AI Traffic Simulator frontend.
 */

// ─── Number Formatting ────────────────────────────────────────────────────────

/** Format a number with commas: 12345 → "12,345" */
export const formatNumber = (n) => Number(n).toLocaleString()

/** Format seconds to mm:ss */
export const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Round to N decimal places */
export const round = (n, decimals = 1) => Math.round(n * 10 ** decimals) / 10 ** decimals

// ─── Traffic Helpers ──────────────────────────────────────────────────────────

/**
 * Get color class based on density percentage.
 * @param {number} density - 0 to 100
 * @returns {string} Tailwind color class
 */
export const getDensityColor = (density) => {
  if (density >= 70) return 'text-red-400'
  if (density >= 40) return 'text-yellow-400'
  return 'text-green-400'
}

/**
 * Get background color for density bar.
 */
export const getDensityBg = (density) => {
  if (density >= 70) return 'bg-red-500'
  if (density >= 40) return 'bg-yellow-500'
  return 'bg-green-500'
}

/**
 * Get congestion level label.
 */
export const getCongestionLevel = (density) => {
  if (density >= 80) return { label: 'CRITICAL', color: 'text-red-400' }
  if (density >= 60) return { label: 'HIGH',     color: 'text-orange-400' }
  if (density >= 40) return { label: 'MODERATE', color: 'text-yellow-400' }
  return { label: 'LOW', color: 'text-green-400' }
}

/**
 * Get vehicle priority number by type.
 */
export const getVehiclePriority = (type) => {
  const priorities = {
    ambulance: 10, police: 9, firetruck: 8,
    bus: 3, truck: 2, car: 1, bike: 1,
  }
  return priorities[type?.toLowerCase()] ?? 1
}

/**
 * Check if vehicle type is emergency.
 */
export const isEmergencyVehicle = (type) =>
  ['ambulance', 'police', 'firetruck', 'fire_truck'].includes(type?.toLowerCase())

// ─── Algorithm Helpers ────────────────────────────────────────────────────────

/**
 * Simulate Dijkstra step-by-step for frontend visualization.
 * Returns array of steps for animation.
 */
export const dijkstraSteps = (graph, source) => {
  const distances = {}
  const predecessors = {}
  const visited = new Set()
  const steps = []

  // Initialize
  Object.keys(graph).forEach(node => {
    distances[node] = node === source ? 0 : Infinity
    predecessors[node] = null
  })

  steps.push({
    action: 'init',
    distances: { ...distances },
    visited: [],
    current: source,
    message: `Initialize: dist[${source}] = 0, all others = ∞`
  })

  while (visited.size < Object.keys(graph).length) {
    // Find unvisited node with minimum distance
    let minNode = null
    let minDist = Infinity
    Object.keys(distances).forEach(node => {
      if (!visited.has(node) && distances[node] < minDist) {
        minDist = distances[node]
        minNode = node
      }
    })

    if (!minNode || minDist === Infinity) break

    visited.add(minNode)

    // Relax neighbors
    const neighbors = graph[minNode] || {}
    Object.entries(neighbors).forEach(([neighbor, weight]) => {
      const newDist = distances[minNode] + weight
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist
        predecessors[neighbor] = minNode
      }
    })

    steps.push({
      action: 'visit',
      current: minNode,
      distances: { ...distances },
      visited: [...visited],
      message: `Visit ${minNode} (dist=${minDist}), relax neighbors`
    })
  }

  return steps
}

/**
 * Reconstruct path from predecessors map.
 */
export const reconstructPath = (predecessors, source, destination) => {
  const path = []
  let current = destination
  while (current !== null && current !== undefined) {
    path.unshift(current)
    current = predecessors[current]
    if (current === source) { path.unshift(source); break }
  }
  return path[0] === source ? path : []
}

// ─── Chart Data Helpers ───────────────────────────────────────────────────────

/**
 * Generate sample chart data for demo mode (when simulation not running).
 */
export const generateDemoChartData = (points = 15) => {
  return Array.from({ length: points }, (_, i) => ({
    time: `T-${points - i}`,
    density: Math.floor(30 + Math.random() * 50),
    waitTime: Math.floor(10 + Math.random() * 40),
    throughput: Math.floor(50 + Math.random() * 100),
  }))
}

// ─── DOM / CSS Helpers ────────────────────────────────────────────────────────

/** Clamp a value between min and max */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

/** Linear interpolation */
export const lerp = (a, b, t) => a + (b - a) * t

/** Generate a random ID */
export const randomId = () => Math.random().toString(36).slice(2, 9)

/** Debounce a function */
export const debounce = (fn, delay) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// ─── City Graph (frontend copy for visualization) ─────────────────────────────
export const CITY_GRAPH = {
  Home:     { School: 4, Market: 2 },
  School:   { Home: 4, Hospital: 5, Center: 3 },
  Hospital: { School: 5, Airport: 2 },
  Market:   { Home: 2, Center: 6, Park: 3 },
  Center:   { School: 3, Market: 6, Airport: 4, Station: 5 },
  Airport:  { Hospital: 2, Center: 4, Station: 3 },
  Park:     { Market: 3, Station: 7 },
  Station:  { Center: 5, Airport: 3, Park: 7 },
}

export const CITY_NODE_POSITIONS = {
  Home:     { x: 80,  y: 80  },
  School:   { x: 220, y: 60  },
  Hospital: { x: 360, y: 80  },
  Market:   { x: 80,  y: 200 },
  Center:   { x: 220, y: 200 },
  Airport:  { x: 360, y: 200 },
  Park:     { x: 150, y: 300 },
  Station:  { x: 300, y: 300 },
}
