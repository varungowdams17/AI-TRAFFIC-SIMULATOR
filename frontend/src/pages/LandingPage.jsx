/**
 * LandingPage.jsx
 * Stunning hero landing page with animated traffic visuals,
 * feature showcase, algorithm overview, and team section.
 */

import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'

// ─── Animated Traffic Background ─────────────────────────────────────────────
function TrafficBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const vehicles = Array.from({ length: 18 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: i % 2 === 0 ? 45 + Math.random() * 20 : 75 + Math.random() * 20,
      speed: 0.8 + Math.random() * 1.5,
      emoji: ['🚗', '🚕', '🚙', '🚌', '🚛', '🏍️'][Math.floor(Math.random() * 6)],
      dir: i % 3 === 0 ? -1 : 1,
      lane: i % 4,
    }))

    const draw = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Road
      ctx.fillStyle = 'rgba(30,41,59,0.6)'
      ctx.fillRect(0, 30, canvas.width, 80)

      // Lane markings
      ctx.setLineDash([20, 15])
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(0, 70)
      ctx.lineTo(canvas.width, 70)
      ctx.stroke()
      ctx.setLineDash([])

      // Vehicles
      ctx.font = '18px serif'
      ctx.textBaseline = 'middle'
      vehicles.forEach(v => {
        ctx.save()
        if (v.dir === -1) {
          ctx.translate(v.x, v.y)
          ctx.scale(-1, 1)
          ctx.fillText(v.emoji, 0, 0)
        } else {
          ctx.fillText(v.emoji, v.x, v.y)
        }
        ctx.restore()
        v.x += v.speed * v.dir
        if (v.x > canvas.width + 30) v.x = -30
        if (v.x < -30) v.x = canvas.width + 30
      })

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"
      style={{ height: '140px', top: '50%', transform: 'translateY(-50%)' }}
    />
  )
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function Section({ children, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const problems = [
    { icon: '🚗', title: 'Traffic Congestion', desc: 'Vehicles stuck in long queues at intersections during peak hours' },
    { icon: '🚑', title: 'Ambulance Delays', desc: 'Emergency vehicles blocked by red signals, costing precious lives' },
    { icon: '⏱️', title: 'Poor Signal Timing', desc: 'Fixed signal timers ignore real-time vehicle density' },
    { icon: '⛽', title: 'Fuel Wastage', desc: 'Vehicles idling at signals waste thousands of liters daily' },
    { icon: '🌫️', title: 'Air Pollution', desc: 'Congestion increases CO₂ emissions significantly' },
    { icon: '⚠️', title: 'Accident Blockage', desc: 'No automatic rerouting when accidents block roads' },
  ]

  const features = [
    { icon: '🧠', title: 'AI Signal Optimization', desc: 'Greedy algorithm dynamically adjusts signal timing based on real-time vehicle density', color: 'blue' },
    { icon: '🚨', title: 'Emergency Priority', desc: 'Priority queue ensures ambulances and fire trucks get immediate green signal', color: 'red' },
    { icon: '🗺️', title: 'Smart Routing', desc: "Dijkstra's algorithm finds shortest paths and reroutes around accidents", color: 'green' },
    { icon: '📊', title: 'Live Analytics', desc: 'Real-time dashboard with charts, KPIs, and traffic density heatmaps', color: 'purple' },
    { icon: '🔊', title: 'Voice Alerts', desc: 'AI voice notifications for emergencies, congestion, and system events', color: 'yellow' },
    { icon: '⚡', title: 'Real-time Simulation', desc: 'Canvas-based simulation with realistic vehicle movement and signal behavior', color: 'cyan' },
  ]

  const algorithms = [
    { name: "Dijkstra's Algorithm", use: 'Shortest path routing', complexity: 'O((V+E) log V)', icon: '🗺️' },
    { name: 'Greedy Algorithm', use: 'Signal optimization', complexity: 'O(n log n)', icon: '🧠' },
    { name: 'Priority Queue', use: 'Emergency handling', complexity: 'O(log n)', icon: '🚨' },
    { name: 'Dynamic Programming', use: 'Traffic prediction', complexity: 'O(n²)', icon: '📈' },
    { name: 'Graph Algorithms', use: 'Road network modeling', complexity: 'O(V + E)', icon: '🕸️' },
    { name: 'Sorting Algorithms', use: 'Vehicle prioritization', complexity: 'O(n log n)', icon: '📊' },
  ]

  const team = [
    { name: 'Team Member 1', role: 'Algorithm Design & Backend', usn: '1XX22CS001', icon: '👨‍💻' },
    { name: 'Team Member 2', role: 'Frontend & UI/UX', usn: '1XX22CS002', icon: '👩‍💻' },
    { name: 'Team Member 3', role: 'Simulation & Testing', usn: '1XX22CS003', icon: '👨‍🔬' },
    { name: 'Team Member 4', role: 'Documentation & Report', usn: '1XX22CS004', icon: '👩‍🎓' },
  ]

  const stats = [
    { value: 7, suffix: '+', label: 'ADA Algorithms' },
    { value: 6, suffix: '', label: 'Vehicle Types' },
    { value: 4, suffix: '', label: 'Road Directions' },
    { value: 100, suffix: '%', label: 'Real-time' },
  ]

  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400',
    red: 'from-red-500/20 to-red-600/5 border-red-500/30 text-red-400',
    green: 'from-green-500/20 to-green-600/5 border-green-500/30 text-green-400',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30 text-purple-400',
    yellow: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30 text-yellow-400',
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30 text-cyan-400',
  }

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.08)_0%,transparent_70%)]" />

        {/* Animated grid */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(14,165,233,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />

        {/* Traffic animation strip */}
        <div className="absolute bottom-32 left-0 right-0 h-36 overflow-hidden">
          <TrafficBackground />
        </div>

        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary-400 rounded-full opacity-30"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}

        <div className="relative z-10 section-container text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-400 text-sm font-semibold mb-6"
          >
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
            VTU ADA Mini Project 2024-25
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-black mb-4 leading-tight"
          >
            <span className="gradient-text">AI Traffic</span>
            <br />
            <span className="text-white">Simulator</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-4"
          >
            Smart AI-Based Traffic Management System
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-slate-500 max-w-xl mx-auto mb-10"
          >
            Powered by Dijkstra, Greedy, Priority Queue, Dynamic Programming and Graph Algorithms
            to solve real-world urban traffic problems in real-time.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/simulator">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary text-base px-8 py-4 flex items-center gap-2"
              >
                🚦 Launch Simulator
              </motion.button>
            </Link>
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="btn-secondary text-base px-8 py-4 flex items-center gap-2"
              >
                📊 View Dashboard
              </motion.button>
            </Link>
            <Link to="/algorithms">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 rounded-xl border border-accent-500/40 text-accent-400 font-semibold hover:bg-accent-500/10 transition-all flex items-center gap-2"
              >
                🧮 Algorithms
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto"
          >
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black gradient-text">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 text-sm flex flex-col items-center gap-1"
        >
          <span>Scroll to explore</span>
          <span>↓</span>
        </motion.div>
      </section>

      {/* ── Problem Statement ──────────────────────────────────────────────── */}
      <section className="py-20 bg-dark-800/50">
        <div className="section-container">
          <Section>
            <div className="text-center mb-12">
              <div className="badge-red inline-block mb-4">Problem Statement</div>
              <h2 className="text-3xl font-bold text-white mb-4">Real-World Traffic Problems</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Urban traffic management faces critical challenges that cost lives, time, fuel, and cause environmental damage.
              </p>
            </div>
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {problems.map((p, i) => (
              <Section key={i}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="glass-card border border-white/10 p-5 hover:border-red-500/30 transition-all"
                >
                  <div className="text-3xl mb-3">{p.icon}</div>
                  <h3 className="font-bold text-white mb-2">{p.title}</h3>
                  <p className="text-slate-400 text-sm">{p.desc}</p>
                </motion.div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="section-container">
          <Section>
            <div className="text-center mb-12">
              <div className="badge-green inline-block mb-4">Our Solution</div>
              <h2 className="text-3xl font-bold text-white mb-4">Smart Features</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                AI Traffic Simulator uses cutting-edge ADA algorithms to solve every traffic problem intelligently.
              </p>
            </div>
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Section key={i}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  className={`glass-card border bg-gradient-to-br p-6 transition-all ${colorMap[f.color]}`}
                >
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── Algorithms ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-dark-800/50">
        <div className="section-container">
          <Section>
            <div className="text-center mb-12">
              <div className="badge-blue inline-block mb-4">ADA Subject</div>
              <h2 className="text-3xl font-bold text-white mb-4">Algorithms Used</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Every algorithm is implemented, visualized, and applied to real traffic scenarios.
              </p>
            </div>
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {algorithms.map((algo, i) => (
              <Section key={i}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="glass-card border border-white/10 p-5 flex items-start gap-4 hover:border-primary-500/30 transition-all"
                >
                  <span className="text-3xl">{algo.icon}</span>
                  <div>
                    <h3 className="font-bold text-white">{algo.name}</h3>
                    <p className="text-slate-400 text-sm mt-1">{algo.use}</p>
                    <code className="text-xs text-primary-400 font-mono mt-2 block">{algo.complexity}</code>
                  </div>
                </motion.div>
              </Section>
            ))}
          </div>

          <Section>
            <div className="mt-8 text-center">
              <Link to="/algorithms">
                <motion.button whileHover={{ scale: 1.05 }} className="btn-primary px-8 py-3">
                  🎮 Explore Interactive Visualizations →
                </motion.button>
              </Link>
            </div>
          </Section>
        </div>
      </section>

      {/* ── Architecture ──────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="section-container">
          <Section>
            <div className="text-center mb-12">
              <div className="badge-blue inline-block mb-4">System Design</div>
              <h2 className="text-3xl font-bold text-white mb-4">Architecture Overview</h2>
            </div>
          </Section>

          <Section>
            <div className="glass-card border border-white/10 p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {[
                  { layer: 'Frontend', items: ['React + Vite', 'Canvas API', 'Recharts', 'Framer Motion'], color: 'blue', icon: '🖥️' },
                  { layer: '→', items: [], color: 'slate', icon: '' },
                  { layer: 'Backend', items: ['Python Flask', 'REST API', 'Algorithm Engine', 'SQLite DB'], color: 'green', icon: '⚙️' },
                  { layer: '→', items: [], color: 'slate', icon: '' },
                  { layer: 'Algorithms', items: ['Dijkstra', 'Greedy', 'Priority Queue', 'Dynamic Prog.'], color: 'purple', icon: '🧮' },
                ].map((block, i) => (
                  block.layer === '→' ? (
                    <div key={i} className="text-3xl text-slate-600 hidden md:block">→</div>
                  ) : (
                    <div key={i} className={`flex-1 p-5 rounded-2xl border text-center ${
                      block.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30' :
                      block.color === 'green' ? 'bg-green-500/10 border-green-500/30' :
                      'bg-purple-500/10 border-purple-500/30'
                    }`}>
                      <div className="text-3xl mb-2">{block.icon}</div>
                      <div className="font-bold text-white mb-3">{block.layer}</div>
                      {block.items.map(item => (
                        <div key={item} className="text-xs text-slate-400 py-1 border-b border-white/5 last:border-0">{item}</div>
                      ))}
                    </div>
                  )
                ))}
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-dark-800/50">
        <div className="section-container">
          <Section>
            <div className="text-center mb-12">
              <div className="badge-blue inline-block mb-4">Our Team</div>
              <h2 className="text-3xl font-bold text-white mb-4">Project Team</h2>
              <p className="text-slate-400">VTU B.E. Computer Science – ADA Mini Project 2024-25</p>
            </div>
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map((member, i) => (
              <Section key={i}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="glass-card border border-white/10 p-6 text-center hover:border-primary-500/30 transition-all"
                >
                  <div className="text-5xl mb-4">{member.icon}</div>
                  <h3 className="font-bold text-white">{member.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{member.role}</p>
                  <code className="text-xs text-primary-400 font-mono mt-2 block">{member.usn}</code>
                </motion.div>
              </Section>
            ))}
          </div>

          <Section>
            <div className="mt-8 glass-card border border-white/10 p-6 text-center">
              <div className="text-slate-400 text-sm">
                <span className="text-white font-semibold">Guide:</span> Prof. [Guide Name] |
                <span className="text-white font-semibold ml-2">Department:</span> Computer Science & Engineering |
                <span className="text-white font-semibold ml-2">College:</span> [College Name], VTU
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="section-container">
          <Section>
            <div className="animated-border p-10 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Experience Smart Traffic?</h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Launch the simulator and see ADA algorithms solve real-world traffic problems in real-time.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/simulator">
                  <motion.button whileHover={{ scale: 1.05 }} className="btn-primary px-10 py-4 text-lg">
                    🚦 Start Simulation
                  </motion.button>
                </Link>
                <Link to="/docs">
                  <motion.button whileHover={{ scale: 1.05 }} className="btn-secondary px-10 py-4 text-lg">
                    📄 View Documentation
                  </motion.button>
                </Link>
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 bg-dark-900">
        <div className="section-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚦</span>
              <div>
                <div className="font-bold gradient-text">AI Traffic Simulator</div>
                <div className="text-xs text-slate-500">VTU ADA Mini Project 2024-25</div>
              </div>
            </div>
            <div className="text-slate-500 text-sm text-center">
              Built with React, Python Flask, Canvas API & ADA Algorithms
            </div>
            <div className="flex gap-4 text-sm text-slate-500">
              <Link to="/simulator" className="hover:text-white transition-colors">Simulator</Link>
              <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              <Link to="/algorithms" className="hover:text-white transition-colors">Algorithms</Link>
              <Link to="/docs" className="hover:text-white transition-colors">Docs</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
