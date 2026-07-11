/**
 * TrafficCanvas.jsx
 * Main canvas-based traffic simulation with real-time vehicle movement,
 * signal management, and emergency vehicle handling.
 * Uses HTML5 Canvas API for high-performance rendering.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useTraffic } from '../context/TrafficContext'

// ─── Vehicle Types Configuration ─────────────────────────────────────────────
const VEHICLE_TYPES = {
  car:       { emoji: '🚗', speed: 2.5, size: 18, color: '#60a5fa', priority: 1 },
  bike:      { emoji: '🏍️', speed: 3.5, size: 12, color: '#a78bfa', priority: 1 },
  truck:     { emoji: '🚛', speed: 1.5, size: 26, color: '#fb923c', priority: 1 },
  bus:       { emoji: '🚌', speed: 1.8, size: 28, color: '#facc15', priority: 1 },
  ambulance: { emoji: '🚑', speed: 5.0, size: 22, color: '#f87171', priority: 10 },
  police:    { emoji: '🚓', speed: 4.5, size: 20, color: '#818cf8', priority: 9 },
  firetruck: { emoji: '🚒', speed: 4.0, size: 24, color: '#fb7185', priority: 8 },
}

// ─── Road directions ──────────────────────────────────────────────────────────
const DIRECTIONS = ['north', 'south', 'east', 'west']

let vehicleIdCounter = 0

function createVehicle(direction, canvasW, canvasH, type = null) {
  const cx = canvasW / 2
  const cy = canvasH / 2
  const laneOffset = 18
  const vType = type || weightedRandomType()
  const cfg = VEHICLE_TYPES[vType]

  let x, y, dx, dy, lane

  switch (direction) {
    case 'north': // coming from top, going down
      lane = cx + laneOffset
      x = lane; y = 0; dx = 0; dy = cfg.speed
      break
    case 'south': // coming from bottom, going up
      lane = cx - laneOffset
      x = lane; y = canvasH; dx = 0; dy = -cfg.speed
      break
    case 'east': // coming from right, going left
      lane = cy - laneOffset
      x = canvasW; y = lane; dx = -cfg.speed; dy = 0
      break
    case 'west': // coming from left, going right
      lane = cy + laneOffset
      x = 0; y = lane; dx = cfg.speed; dy = 0
      break
    default:
      x = 0; y = 0; dx = 0; dy = 0
  }

  return {
    id: ++vehicleIdCounter,
    type: vType,
    direction,
    x, y, dx, dy,
    speed: cfg.speed,
    size: cfg.size,
    color: cfg.color,
    emoji: cfg.emoji,
    state: 'moving',
    priority: cfg.priority,
    waitTime: 0,
    opacity: 1,
  }
}

function weightedRandomType() {
  const weights = { car: 50, bike: 25, truck: 10, bus: 8, ambulance: 2, police: 3, firetruck: 2 }
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (const [type, w] of Object.entries(weights)) {
    r -= w
    if (r <= 0) return type
  }
  return 'car'
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TrafficCanvas() {
  const canvasRef = useRef(null)
  const vehiclesRef = useRef([])
  const animFrameRef = useRef(null)
  const { state, dispatch } = useTraffic()
  const stateRef = useRef(state)
  const [fps, setFps] = useState(0)
  const lastFpsTime = useRef(Date.now())
  const frameCount = useRef(0)
  // Throttle the expensive dispatch so it fires at most every 200ms
  const lastDispatchTime = useRef(0)

  // Keep stateRef in sync
  useEffect(() => { stateRef.current = state }, [state])

  // ── Spawn vehicles based on density ────────────────────────────────────────
  const spawnVehicles = useCallback((canvas) => {
    const { trafficDensity, isRunning, isPaused } = stateRef.current
    if (!isRunning || isPaused) return

    DIRECTIONS.forEach(dir => {
      const density = trafficDensity[dir] || 30
      const spawnChance = density / 1000 * stateRef.current.simulationSpeed
      if (Math.random() < spawnChance) {
        // Check if emergency active on this road
        const isEmergencyRoad = stateRef.current.emergencyActive &&
          stateRef.current.emergencyRoad === dir
        const vType = isEmergencyRoad ? 'ambulance' : null
        vehiclesRef.current.push(createVehicle(dir, canvas.width, canvas.height, vType))
      }
    })

    // Limit max vehicles for performance
    if (vehiclesRef.current.length > 120) {
      vehiclesRef.current = vehiclesRef.current.slice(-100)
    }
  }, [])

  // ── Update vehicle positions ────────────────────────────────────────────────
  const updateVehicles = useCallback((canvas) => {
    const { signals, emergencyActive, emergencyRoad, accidentActive, accidents } = stateRef.current
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const roadW = 80
    const speed = stateRef.current.simulationSpeed

    // Stop line positions — where vehicles must halt before the intersection box
    const STOP_LINE = {
      north: cy - roadW / 2 - 8,   // vehicle coming DOWN stops here (y value)
      south: cy + roadW / 2 + 8,   // vehicle coming UP stops here (y value)
      east:  cx + roadW / 2 + 8,   // vehicle coming LEFT stops here (x value)
      west:  cx - roadW / 2 - 8,   // vehicle coming RIGHT stops here (x value)
    }

    // Remove off-screen vehicles
    vehiclesRef.current = vehiclesRef.current.filter(v =>
      v.x > -60 && v.x < canvas.width + 60 &&
      v.y > -60 && v.y < canvas.height + 60
    )

    // Sort vehicles by distance to stop line so front vehicle is processed first
    // This lets us detect queue stacking
    const byDir = { north: [], south: [], east: [], west: [] }
    vehiclesRef.current.forEach(v => byDir[v.direction]?.push(v))

    // Sort each direction: vehicle closest to stop line first
    byDir.north.sort((a, b) => b.y - a.y)   // highest y = closest to stop line
    byDir.south.sort((a, b) => a.y - b.y)   // lowest y = closest to stop line
    byDir.east.sort((a, b)  => a.x - b.x)   // lowest x = closest to stop line
    byDir.west.sort((a, b)  => b.x - a.x)   // highest x = closest to stop line

    vehiclesRef.current.forEach(v => {
      const isEmergency = v.priority >= 8
      const signal = signals[v.direction]
      const isGreen = signal?.state === 'green'

      // ── Determine if this vehicle should stop ──────────────────────────
      let shouldStop = false

      if (!isEmergency) {
        // Check signal: is vehicle approaching the stop line on a red signal?
        const stopLine = STOP_LINE[v.direction]
        const QUEUE_GAP = v.size + 6   // gap between queued vehicles

        switch (v.direction) {
          case 'north': {
            // Moving downward (dy > 0). Stop when y >= stopLine
            const distToStop = stopLine - v.y
            if (distToStop >= 0 && distToStop < 120) {
              if (!isGreen) shouldStop = true
              // Queue: stop behind the vehicle ahead
              const ahead = byDir.north.find(o => o.id !== v.id && o.y > v.y && o.y - v.y < QUEUE_GAP + 4)
              if (ahead && ahead.state === 'waiting') shouldStop = true
            }
            break
          }
          case 'south': {
            // Moving upward (dy < 0). Stop when y <= stopLine
            const distToStop = v.y - stopLine
            if (distToStop >= 0 && distToStop < 120) {
              if (!isGreen) shouldStop = true
              const ahead = byDir.south.find(o => o.id !== v.id && o.y < v.y && v.y - o.y < QUEUE_GAP + 4)
              if (ahead && ahead.state === 'waiting') shouldStop = true
            }
            break
          }
          case 'east': {
            // Moving leftward (dx < 0). Stop when x <= stopLine
            const distToStop = v.x - stopLine
            if (distToStop >= 0 && distToStop < 120) {
              if (!isGreen) shouldStop = true
              const ahead = byDir.east.find(o => o.id !== v.id && o.x < v.x && v.x - o.x < QUEUE_GAP + 4)
              if (ahead && ahead.state === 'waiting') shouldStop = true
            }
            break
          }
          case 'west': {
            // Moving rightward (dx > 0). Stop when x >= stopLine
            const distToStop = stopLine - v.x
            if (distToStop >= 0 && distToStop < 120) {
              if (!isGreen) shouldStop = true
              const ahead = byDir.west.find(o => o.id !== v.id && o.x > v.x && o.x - v.x < QUEUE_GAP + 4)
              if (ahead && ahead.state === 'waiting') shouldStop = true
            }
            break
          }
        }

        // Accident blockage — stop vehicles on the blocked road
        if (accidentActive && accidents.length > 0) {
          const accRoad = accidents[accidents.length - 1].road?.toLowerCase()
          if (v.direction === accRoad) {
            const stopLine2 = STOP_LINE[v.direction]
            switch (v.direction) {
              case 'north': if (stopLine2 - v.y >= 0 && stopLine2 - v.y < 160) shouldStop = true; break
              case 'south': if (v.y - stopLine2 >= 0 && v.y - stopLine2 < 160) shouldStop = true; break
              case 'east':  if (v.x - stopLine2 >= 0 && v.x - stopLine2 < 160) shouldStop = true; break
              case 'west':  if (stopLine2 - v.x >= 0 && stopLine2 - v.x < 160) shouldStop = true; break
            }
          }
        }
      }

      // ── Apply movement or stop ─────────────────────────────────────────
      if (shouldStop) {
        v.state = 'waiting'
        v.waitTime++
        // Snap to stop line so vehicles don't creep past it
        const stopLine = STOP_LINE[v.direction]
        switch (v.direction) {
          case 'north': if (v.y > stopLine - 2) v.y = Math.min(v.y, stopLine); break
          case 'south': if (v.y < stopLine + 2) v.y = Math.max(v.y, stopLine); break
          case 'east':  if (v.x < stopLine + 2) v.x = Math.max(v.x, stopLine); break
          case 'west':  if (v.x > stopLine - 2) v.x = Math.min(v.x, stopLine); break
        }
      } else {
        v.state = 'moving'
        v.waitTime = 0
        v.x += v.dx * speed
        v.y += v.dy * speed
      }
    })

    // Throttle dispatch — max 5×/sec
    const now = Date.now()
    if (now - lastDispatchTime.current > 200) {
      lastDispatchTime.current = now
      dispatch({ type: 'UPDATE_VEHICLES', payload: vehiclesRef.current })
    }
  }, [dispatch])

  // ── Draw everything on canvas ───────────────────────────────────────────────
  const draw = useCallback((ctx, canvas) => {
    const { signals, emergencyActive, emergencyRoad, accidentActive, accidents, trafficDensity } = stateRef.current
    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2
    const roadW = 80

    // Clear
    ctx.clearRect(0, 0, W, H)

    // ── Background ──────────────────────────────────────────────────────────
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.7)
    bgGrad.addColorStop(0, '#0f1629')
    bgGrad.addColorStop(1, '#0a0e1a')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // ── Grid lines (city blocks) ────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    // ── Roads ───────────────────────────────────────────────────────────────
    // Horizontal road
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, cy - roadW / 2, W, roadW)
    // Vertical road
    ctx.fillRect(cx - roadW / 2, 0, roadW, H)

    // Road borders
    ctx.strokeStyle = 'rgba(148,163,184,0.3)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(0, cy - roadW / 2, W, roadW)
    ctx.strokeRect(cx - roadW / 2, 0, roadW, H)

    // Center lane markings (dashed white)
    ctx.setLineDash([15, 10])
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 2
    // Horizontal center line
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(cx - roadW / 2, cy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx + roadW / 2, cy); ctx.lineTo(W, cy); ctx.stroke()
    // Vertical center line
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, cy - roadW / 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx, cy + roadW / 2); ctx.lineTo(cx, H); ctx.stroke()
    ctx.setLineDash([])

    // ── Intersection box ────────────────────────────────────────────────────
    ctx.fillStyle = '#263148'
    ctx.fillRect(cx - roadW / 2, cy - roadW / 2, roadW, roadW)
    ctx.strokeStyle = 'rgba(14,165,233,0.3)'
    ctx.lineWidth = 2
    ctx.strokeRect(cx - roadW / 2, cy - roadW / 2, roadW, roadW)

    // ── Zebra crossings ─────────────────────────────────────────────────────
    const stripeW = 8, stripeH = 14, numStripes = 4
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    for (let i = 0; i < numStripes; i++) {
      // North crossing
      ctx.fillRect(cx - roadW / 2 + i * (roadW / numStripes), cy - roadW / 2 - stripeH, roadW / numStripes - 2, stripeH)
      // South crossing
      ctx.fillRect(cx - roadW / 2 + i * (roadW / numStripes), cy + roadW / 2, roadW / numStripes - 2, stripeH)
      // East crossing
      ctx.fillRect(cx + roadW / 2, cy - roadW / 2 + i * (roadW / numStripes), stripeH, roadW / numStripes - 2)
      // West crossing
      ctx.fillRect(cx - roadW / 2 - stripeH, cy - roadW / 2 + i * (roadW / numStripes), stripeH, roadW / numStripes - 2)
    }

    // ── Stop lines (solid white lines where vehicles halt) ──────────────────
    ctx.lineWidth = 3
    ctx.setLineDash([])
    // North stop line (vehicles coming from top stop here)
    ctx.strokeStyle = signals.north?.state === 'green' ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.8)'
    ctx.beginPath(); ctx.moveTo(cx - roadW / 2, cy - roadW / 2 - 8); ctx.lineTo(cx + roadW / 2, cy - roadW / 2 - 8); ctx.stroke()
    // South stop line
    ctx.strokeStyle = signals.south?.state === 'green' ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.8)'
    ctx.beginPath(); ctx.moveTo(cx - roadW / 2, cy + roadW / 2 + 8); ctx.lineTo(cx + roadW / 2, cy + roadW / 2 + 8); ctx.stroke()
    // East stop line
    ctx.strokeStyle = signals.east?.state === 'green' ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.8)'
    ctx.beginPath(); ctx.moveTo(cx + roadW / 2 + 8, cy - roadW / 2); ctx.lineTo(cx + roadW / 2 + 8, cy + roadW / 2); ctx.stroke()
    // West stop line
    ctx.strokeStyle = signals.west?.state === 'green' ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.8)'
    ctx.beginPath(); ctx.moveTo(cx - roadW / 2 - 8, cy - roadW / 2); ctx.lineTo(cx - roadW / 2 - 8, cy + roadW / 2); ctx.stroke()

    // ── Traffic Signals ─────────────────────────────────────────────────────
    const signalPositions = {
      north: { x: cx + roadW / 2 + 12, y: cy - roadW / 2 - 10 },
      south: { x: cx - roadW / 2 - 28, y: cy + roadW / 2 + 10 },
      east:  { x: cx + roadW / 2 + 10, y: cy + roadW / 2 + 12 },
      west:  { x: cx - roadW / 2 - 28, y: cy - roadW / 2 - 28 },
    }

    DIRECTIONS.forEach(dir => {
      const pos = signalPositions[dir]
      const sig = signals[dir]
      const isGreen = sig?.state === 'green'

      // Signal pole
      ctx.fillStyle = '#374151'
      ctx.fillRect(pos.x + 6, pos.y, 4, 30)

      // Signal box
      ctx.fillStyle = '#111827'
      ctx.beginPath()
      ctx.roundRect(pos.x, pos.y - 5, 16, 36, 4)
      ctx.fill()

      // Red light
      ctx.beginPath()
      ctx.arc(pos.x + 8, pos.y + 5, 5, 0, Math.PI * 2)
      ctx.fillStyle = isGreen ? 'rgba(239,68,68,0.2)' : '#ef4444'
      if (!isGreen) {
        ctx.shadowColor = '#ef4444'
        ctx.shadowBlur = 12
      }
      ctx.fill()
      ctx.shadowBlur = 0

      // Green light
      ctx.beginPath()
      ctx.arc(pos.x + 8, pos.y + 25, 5, 0, Math.PI * 2)
      ctx.fillStyle = isGreen ? '#22c55e' : 'rgba(34,197,94,0.2)'
      if (isGreen) {
        ctx.shadowColor = '#22c55e'
        ctx.shadowBlur = 15
      }
      ctx.fill()
      ctx.shadowBlur = 0

      // Timer label
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.font = 'bold 9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`${sig?.timer || 0}s`, pos.x + 8, pos.y + 48)
    })

    // ── Density heatmap overlay ─────────────────────────────────────────────
    const heatmapAlpha = 0.15
    const densityColors = {
      north: `rgba(${getDensityColor(trafficDensity.north)},${heatmapAlpha})`,
      south: `rgba(${getDensityColor(trafficDensity.south)},${heatmapAlpha})`,
      east:  `rgba(${getDensityColor(trafficDensity.east)},${heatmapAlpha})`,
      west:  `rgba(${getDensityColor(trafficDensity.west)},${heatmapAlpha})`,
    }

    ctx.fillStyle = densityColors.north
    ctx.fillRect(cx - roadW / 2, 0, roadW, cy - roadW / 2)
    ctx.fillStyle = densityColors.south
    ctx.fillRect(cx - roadW / 2, cy + roadW / 2, roadW, H - cy - roadW / 2)
    ctx.fillStyle = densityColors.east
    ctx.fillRect(cx + roadW / 2, cy - roadW / 2, W - cx - roadW / 2, roadW)
    ctx.fillStyle = densityColors.west
    ctx.fillRect(0, cy - roadW / 2, cx - roadW / 2, roadW)

    // ── Accident visualization ──────────────────────────────────────────────
    if (accidentActive && accidents.length > 0) {
      const accRoad = accidents[accidents.length - 1].road?.toLowerCase()
      const accPositions = {
        north: { x: cx + 10, y: cy - 100 },
        south: { x: cx - 10, y: cy + 100 },
        east:  { x: cx + 100, y: cy - 10 },
        west:  { x: cx - 100, y: cy + 10 },
      }
      const ap = accPositions[accRoad]
      if (ap) {
        // Flashing warning
        const flash = Math.sin(Date.now() / 200) > 0
        if (flash) {
          ctx.shadowColor = '#f59e0b'
          ctx.shadowBlur = 20
          ctx.font = '24px serif'
          ctx.textAlign = 'center'
          ctx.fillText('⚠️', ap.x, ap.y)
          ctx.shadowBlur = 0
        }
        // Blockage cone
        ctx.fillStyle = 'rgba(245,158,11,0.3)'
        ctx.beginPath()
        ctx.arc(ap.x, ap.y, 25, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // ── Emergency corridor ──────────────────────────────────────────────────
    if (emergencyActive) {
      const corridorAlpha = 0.1 + 0.05 * Math.sin(Date.now() / 300)
      ctx.fillStyle = `rgba(239,68,68,${corridorAlpha})`
      switch (emergencyRoad) {
        case 'north': ctx.fillRect(cx - roadW / 2, 0, roadW, cy - roadW / 2); break
        case 'south': ctx.fillRect(cx - roadW / 2, cy + roadW / 2, roadW, H); break
        case 'east':  ctx.fillRect(cx + roadW / 2, cy - roadW / 2, W, roadW); break
        case 'west':  ctx.fillRect(0, cy - roadW / 2, cx - roadW / 2, roadW); break
      }
    }

    // ── Vehicles ────────────────────────────────────────────────────────────
    ctx.font = '16px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    vehiclesRef.current.forEach(v => {
      // Shadow for waiting vehicles
      if (v.state === 'waiting') {
        ctx.shadowColor = '#f59e0b'
        ctx.shadowBlur = 8
      } else if (v.priority >= 8) {
        ctx.shadowColor = '#ef4444'
        ctx.shadowBlur = 15
      }

      ctx.globalAlpha = v.opacity
      ctx.fillText(v.emoji, v.x, v.y)
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
    })

    // ── Road labels ─────────────────────────────────────────────────────────
    ctx.font = 'bold 11px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(148,163,184,0.6)'
    ctx.fillText('NORTH', cx, 20)
    ctx.fillText('SOUTH', cx, H - 10)
    ctx.fillText('WEST', 30, cy)
    ctx.fillText('EAST', W - 30, cy)

    // ── Density labels ──────────────────────────────────────────────────────
    ctx.font = 'bold 10px monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillText(`${Math.round(trafficDensity.north)}%`, cx + roadW / 2 + 30, cy - 80)
    ctx.fillText(`${Math.round(trafficDensity.south)}%`, cx - roadW / 2 - 30, cy + 80)
    ctx.fillText(`${Math.round(trafficDensity.east)}%`, cx + 80, cy + roadW / 2 + 20)
    ctx.fillText(`${Math.round(trafficDensity.west)}%`, cx - 80, cy - roadW / 2 - 20)

    // ── Emergency banner ────────────────────────────────────────────────────
    if (emergencyActive) {
      const bannerAlpha = 0.8 + 0.2 * Math.sin(Date.now() / 200)
      ctx.fillStyle = `rgba(239,68,68,${bannerAlpha})`
      ctx.font = 'bold 13px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🚨 EMERGENCY PRIORITY ACTIVE', cx, 45)
    }

    // ── FPS counter ─────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(100,116,139,0.5)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`${fps} FPS | ${vehiclesRef.current.length} vehicles`, 8, H - 8)
  }, [fps])

  // Helper: density to RGB color
  function getDensityColor(density) {
    if (density > 70) return '239,68,68'
    if (density > 40) return '245,158,11'
    return '34,197,94'
  }

  // ── Main animation loop ─────────────────────────────────────────────────────
  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // FPS calculation
    frameCount.current++
    const now = Date.now()
    if (now - lastFpsTime.current >= 1000) {
      setFps(frameCount.current)
      frameCount.current = 0
      lastFpsTime.current = now
    }

    spawnVehicles(canvas)
    updateVehicles(canvas)
    draw(ctx, canvas)

    animFrameRef.current = requestAnimationFrame(animate)
  }, [spawnVehicles, updateVehicles, draw])

  // Start/stop animation loop
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [animate])

  // Resize canvas to container
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-2xl cursor-crosshair"
      style={{ display: 'block' }}
    />
  )
}
