/**
 * AlgorithmsPage.jsx
 * Interactive visualization and explanation of all ADA algorithms used
 * in the traffic management system.
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Dijkstra Visualization ───────────────────────────────────────────────────
function DijkstraViz() {
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [visited, setVisited] = useState([])
  const [distances, setDistances] = useState({})
  const [path, setPath] = useState([])

  // City graph: nodes = intersections, edges = roads with weights (distance/time)
  const nodes = {
    A: { x: 80,  y: 80,  label: 'Home' },
    B: { x: 220, y: 60,  label: 'School' },
    C: { x: 360, y: 80,  label: 'Hospital' },
    D: { x: 80,  y: 200, label: 'Market' },
    E: { x: 220, y: 200, label: 'Center' },
    F: { x: 360, y: 200, label: 'Airport' },
    G: { x: 150, y: 300, label: 'Park' },
    H: { x: 300, y: 300, label: 'Station' },
  }

  const edges = [
    { from: 'A', to: 'B', weight: 4 },
    { from: 'A', to: 'D', weight: 2 },
    { from: 'B', to: 'C', weight: 5 },
    { from: 'B', to: 'E', weight: 3 },
    { from: 'C', to: 'F', weight: 2 },
    { from: 'D', to: 'E', weight: 6 },
    { from: 'D', to: 'G', weight: 3 },
    { from: 'E', to: 'F', weight: 4 },
    { from: 'E', to: 'H', weight: 5 },
    { from: 'F', to: 'H', weight: 3 },
    { from: 'G', to: 'H', weight: 7 },
  ]

  const steps = [
    { visited: ['A'], distances: { A: 0, B: 4, C: '∞', D: 2, E: '∞', F: '∞', G: '∞', H: '∞' }, path: ['A'], msg: 'Start at A (Home). Initialize distances.' },
    { visited: ['A', 'D'], distances: { A: 0, B: 4, C: '∞', D: 2, E: 8, F: '∞', G: 5, H: '∞' }, path: ['A', 'D'], msg: 'Visit D (dist=2). Update neighbors E=8, G=5.' },
    { visited: ['A', 'D', 'B'], distances: { A: 0, B: 4, C: 9, D: 2, E: 7, F: '∞', G: 5, H: '∞' }, path: ['A', 'B'], msg: 'Visit B (dist=4). Update C=9, E=7.' },
    { visited: ['A', 'D', 'B', 'G'], distances: { A: 0, B: 4, C: 9, D: 2, E: 7, F: '∞', G: 5, H: 12 }, path: ['A', 'D', 'G'], msg: 'Visit G (dist=5). Update H=12.' },
    { visited: ['A', 'D', 'B', 'G', 'E'], distances: { A: 0, B: 4, C: 9, D: 2, E: 7, F: 11, G: 5, H: 12 }, path: ['A', 'B', 'E'], msg: 'Visit E (dist=7). Update F=11, H=12.' },
    { visited: ['A', 'D', 'B', 'G', 'E', 'C'], distances: { A: 0, B: 4, C: 9, D: 2, E: 7, F: 11, G: 5, H: 12 }, path: ['A', 'B', 'C'], msg: 'Visit C (dist=9). No better paths found.' },
    { visited: ['A', 'D', 'B', 'G', 'E', 'C', 'F'], distances: { A: 0, B: 4, C: 9, D: 2, E: 7, F: 11, G: 5, H: 12 }, path: ['A', 'B', 'E', 'F'], msg: 'Visit F (dist=11). Shortest path to Airport found!' },
  ]

  const runDijkstra = async () => {
    setRunning(true)
    setStep(0)
    setVisited([])
    setDistances({})
    setPath([])
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 900))
      setStep(i)
      setVisited(steps[i].visited)
      setDistances(steps[i].distances)
      setPath(steps[i].path)
    }
    setRunning(false)
  }

  const currentStep = steps[step] || steps[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">Dijkstra's Shortest Path</h3>
          <p className="text-xs text-slate-400 mt-1">Finding shortest route from Home (A) to Airport (F)</p>
        </div>
        <button onClick={runDijkstra} disabled={running} className="btn-primary text-sm py-2 px-4">
          {running ? '⏳ Running...' : '▶ Run Algorithm'}
        </button>
      </div>

      {/* Graph SVG */}
      <div className="bg-dark-900 rounded-xl p-4 border border-white/10">
        <svg width="100%" viewBox="0 0 440 360" className="max-h-72">
          {/* Edges */}
          {edges.map((e, i) => {
            const from = nodes[e.from]
            const to = nodes[e.to]
            const isPath = path.includes(e.from) && path.includes(e.to)
            return (
              <g key={i}>
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isPath ? '#22c55e' : 'rgba(255,255,255,0.15)'}
                  strokeWidth={isPath ? 3 : 1.5}
                />
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 5}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {e.weight}
                </text>
              </g>
            )
          })}

          {/* Nodes */}
          {Object.entries(nodes).map(([id, node]) => {
            const isVisited = visited.includes(id)
            const isInPath = path.includes(id)
            return (
              <g key={id}>
                <circle
                  cx={node.x} cy={node.y} r={22}
                  fill={isInPath ? '#22c55e' : isVisited ? '#0ea5e9' : '#1e293b'}
                  stroke={isInPath ? '#22c55e' : isVisited ? '#0ea5e9' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={2}
                />
                <text x={node.x} y={node.y - 2} fill="white" fontSize="12" fontWeight="bold" textAnchor="middle">{id}</text>
                <text x={node.x} y={node.y + 10} fill="rgba(255,255,255,0.6)" fontSize="7" textAnchor="middle">{node.label}</text>
                {distances[id] !== undefined && (
                  <text x={node.x} y={node.y + 36} fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">
                    d={distances[id]}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Step info */}
      <div className="p-3 bg-primary-500/10 rounded-xl border border-primary-500/20 text-sm text-primary-300">
        <span className="font-bold">Step {step + 1}/{steps.length}:</span> {currentStep.msg}
      </div>
    </div>
  )
}

// ─── Greedy Signal Viz ────────────────────────────────────────────────────────
function GreedyViz() {
  const [densities, setDensities] = useState({ N: 65, S: 30, E: 80, W: 45 })
  const [greenRoad, setGreenRoad] = useState(null)
  const [duration, setDuration] = useState(null)

  const runGreedy = () => {
    const sorted = Object.entries(densities).sort((a, b) => b[1] - a[1])
    const best = sorted[0][0]
    const dur = Math.min(60, 20 + Math.floor(sorted[0][1] / 100 * 40))
    setGreenRoad(best)
    setDuration(dur)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-white">Greedy Signal Optimization</h3>
        <p className="text-xs text-slate-400 mt-1">Assign green signal to road with highest vehicle density</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Object.entries(densities).map(([road, val]) => (
          <div key={road} className={`p-3 rounded-xl border transition-all ${
            greenRoad === road ? 'bg-green-500/20 border-green-500/40' : 'bg-dark-900 border-white/10'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-white">{road === 'N' ? 'North' : road === 'S' ? 'South' : road === 'E' ? 'East' : 'West'}</span>
              <span className={`text-sm font-mono font-bold ${greenRoad === road ? 'text-green-400' : 'text-white'}`}>{val}%</span>
            </div>
            <input
              type="range" min="5" max="100" value={val}
              onChange={e => setDensities(d => ({ ...d, [road]: parseInt(e.target.value) }))}
              className="w-full accent-primary-500"
            />
            <div className="w-full h-2 bg-dark-800 rounded-full mt-2 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${val > 70 ? 'bg-red-500' : val > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${val}%` }} />
            </div>
          </div>
        ))}
      </div>

      <button onClick={runGreedy} className="btn-primary w-full">🧠 Apply Greedy Algorithm</button>

      {greenRoad && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
          <div className="text-green-400 font-bold">✅ Greedy Decision:</div>
          <div className="text-white mt-1">
            Give GREEN signal to <span className="text-green-400 font-bold">
              {greenRoad === 'N' ? 'North' : greenRoad === 'S' ? 'South' : greenRoad === 'E' ? 'East' : 'West'}
            </span> road for <span className="text-yellow-400 font-bold">{duration} seconds</span>
          </div>
          <div className="text-slate-400 text-xs mt-2">
            Reason: Highest density ({densities[greenRoad]}%) → Maximum throughput achieved
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── Priority Queue Viz ───────────────────────────────────────────────────────
function PriorityQueueViz() {
  const [queue, setQueue] = useState([
    { id: 1, type: '🚗 Car', priority: 1 },
    { id: 2, type: '🚌 Bus', priority: 2 },
    { id: 3, type: '🚛 Truck', priority: 1 },
  ])
  const [processing, setProcessing] = useState(null)

  const addEmergency = (type, priority, emoji) => {
    const newV = { id: Date.now(), type: `${emoji} ${type}`, priority }
    setQueue(q => [...q, newV].sort((a, b) => b.priority - a.priority))
  }

  const processNext = () => {
    if (queue.length === 0) return
    setProcessing(queue[0])
    setQueue(q => q.slice(1))
    setTimeout(() => setProcessing(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-white">Priority Queue – Emergency Handling</h3>
        <p className="text-xs text-slate-400 mt-1">Higher priority vehicles get green signal first</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => addEmergency('Ambulance', 10, '🚑')} className="btn-danger text-xs py-2 px-3">+ Ambulance</button>
        <button onClick={() => addEmergency('Police', 9, '🚓')} className="text-xs py-2 px-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-all">+ Police</button>
        <button onClick={() => addEmergency('Fire Truck', 8, '🚒')} className="text-xs py-2 px-3 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl hover:bg-orange-500/30 transition-all">+ Fire Truck</button>
        <button onClick={processNext} className="btn-success text-xs py-2 px-3">Process Next ▶</button>
      </div>

      {processing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-3 bg-green-500/20 rounded-xl border border-green-500/40 text-green-300 text-sm font-semibold">
          🟢 Processing: {processing.type} (Priority: {processing.priority})
        </motion.div>
      )}

      <div className="space-y-2">
        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Queue (sorted by priority)</div>
        <AnimatePresence>
          {queue.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                i === 0 ? 'bg-primary-500/20 border-primary-500/40' : 'bg-dark-900 border-white/10'
              }`}
            >
              <span className="text-xs font-mono text-slate-500 w-4">{i + 1}</span>
              <span className="flex-1 text-sm font-medium text-white">{v.type}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 bg-dark-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                    style={{ width: `${v.priority * 10}%` }} />
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  v.priority >= 8 ? 'bg-red-500/20 text-red-400' :
                  v.priority >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>P{v.priority}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {queue.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-4">Queue empty. Add vehicles above.</div>
        )}
      </div>
    </div>
  )
}

// ─── Sorting Viz ──────────────────────────────────────────────────────────────
function SortingViz() {
  const [arr, setArr] = useState([64, 34, 25, 12, 22, 11, 90, 45])
  const [sorting, setSorting] = useState(false)
  const [comparing, setComparing] = useState([])
  const [sorted, setSorted] = useState([])

  const bubbleSort = async () => {
    setSorting(true)
    setSorted([])
    let a = [...arr]
    const n = a.length
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        setComparing([j, j + 1])
        await new Promise(r => setTimeout(r, 300))
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]]
          setArr([...a])
        }
      }
      setSorted(s => [...s, n - 1 - i])
    }
    setSorted(Array.from({ length: n }, (_, i) => i))
    setComparing([])
    setSorting(false)
  }

  const randomize = () => {
    setArr(Array.from({ length: 8 }, () => Math.floor(Math.random() * 90) + 10))
    setSorted([])
    setComparing([])
  }

  const maxVal = Math.max(...arr)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-white">Bubble Sort – Vehicle Priority Arrangement</h3>
        <p className="text-xs text-slate-400 mt-1">Sort vehicles by priority score for signal allocation</p>
      </div>

      <div className="flex gap-2">
        <button onClick={bubbleSort} disabled={sorting} className="btn-primary text-sm py-2 px-4">
          {sorting ? '⏳ Sorting...' : '▶ Sort'}
        </button>
        <button onClick={randomize} disabled={sorting} className="btn-secondary text-sm py-2 px-4">🔀 Randomize</button>
      </div>

      <div className="flex items-end gap-2 h-40 bg-dark-900 rounded-xl p-4 border border-white/10">
        {arr.map((val, i) => (
          <motion.div
            key={i}
            layout
            className={`flex-1 rounded-t-lg flex items-end justify-center pb-1 transition-colors ${
              sorted.includes(i) ? 'bg-green-500' :
              comparing.includes(i) ? 'bg-yellow-500' : 'bg-primary-500'
            }`}
            style={{ height: `${(val / maxVal) * 100}%` }}
          >
            <span className="text-xs font-bold text-white">{val}</span>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-primary-500 rounded" /> Unsorted</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded" /> Comparing</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> Sorted</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const algorithms = [
  {
    id: 'dijkstra',
    name: "Dijkstra's Algorithm",
    category: 'Graph',
    purpose: 'Shortest Path Routing',
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V)',
    icon: '🗺️',
    color: 'blue',
    description: 'Finds the shortest path between intersections in the city road network. Used for emergency vehicle routing and traffic rerouting after accidents.',
    steps: ['Initialize distances to ∞, source = 0', 'Pick unvisited node with minimum distance', 'Update distances of neighbors', 'Mark node as visited', 'Repeat until destination reached'],
    component: DijkstraViz,
  },
  {
    id: 'greedy',
    name: 'Greedy Algorithm',
    category: 'Optimization',
    purpose: 'Signal Optimization',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(1)',
    icon: '🧠',
    color: 'green',
    description: 'Dynamically assigns green signal to the road with highest vehicle density at each decision point, maximizing throughput without global planning.',
    steps: ['Measure vehicle density on all roads', 'Sort roads by density (descending)', 'Assign green to highest density road', 'Calculate optimal signal duration', 'Repeat every cycle'],
    component: GreedyViz,
  },
  {
    id: 'priority',
    name: 'Priority Queue',
    category: 'Data Structure',
    purpose: 'Emergency Handling',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(n)',
    icon: '🚨',
    color: 'red',
    description: 'Maintains a max-heap of vehicles sorted by priority. Emergency vehicles (ambulance, police, fire truck) get highest priority and immediate green signal.',
    steps: ['Vehicle enters intersection queue', 'Assign priority (emergency=10, normal=1)', 'Insert into max-heap', 'Extract max priority vehicle', 'Grant green signal to that road'],
    component: PriorityQueueViz,
  },
  {
    id: 'sorting',
    name: 'Sorting Algorithms',
    category: 'Sorting',
    purpose: 'Vehicle Arrangement',
    timeComplexity: 'O(n²) Bubble / O(n log n) Quick',
    spaceComplexity: 'O(1)',
    icon: '📊',
    color: 'purple',
    description: 'Sorts vehicles in queue by priority score for efficient signal allocation. Bubble sort for small queues, quicksort for large traffic volumes.',
    steps: ['Assign priority score to each vehicle', 'Compare adjacent vehicles', 'Swap if out of order', 'Repeat until sorted', 'Process in sorted order'],
    component: SortingViz,
  },
]

export default function AlgorithmsPage() {
  const [activeAlgo, setActiveAlgo] = useState('dijkstra')
  const current = algorithms.find(a => a.id === activeAlgo)
  const AlgoComponent = current?.component

  const colorMap = {
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    green: 'border-green-500/30 bg-green-500/10 text-green-400',
    red: 'border-red-500/30 bg-red-500/10 text-red-400',
    purple: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  }

  return (
    <div className="min-h-screen pt-16 bg-dark-900">
      <div className="section-container py-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold gradient-text">ADA Algorithms</h1>
          <p className="text-slate-400 text-sm mt-1">Interactive visualization of all algorithms powering the traffic system</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Algorithm selector */}
          <div className="space-y-3">
            {algorithms.map(algo => (
              <motion.button
                key={algo.id}
                whileHover={{ x: 4 }}
                onClick={() => setActiveAlgo(algo.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  activeAlgo === algo.id
                    ? colorMap[algo.color]
                    : 'bg-dark-800 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{algo.icon}</span>
                  <div>
                    <div className="font-bold text-sm text-white">{algo.name}</div>
                    <div className="text-xs opacity-70">{algo.purpose}</div>
                  </div>
                </div>
              </motion.button>
            ))}

            {/* Additional algorithms info */}
            <div className="glass-card border border-white/10 p-4 space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Also Used</div>
              {[
                { name: 'Dynamic Programming', use: 'Traffic Prediction', icon: '📈' },
                { name: 'BFS/DFS Graph', use: 'Road Network', icon: '🕸️' },
                { name: 'Binary Search', use: 'Route Lookup', icon: '🔍' },
              ].map(a => (
                <div key={a.name} className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{a.icon}</span>
                  <div>
                    <div className="text-white font-medium">{a.name}</div>
                    <div className="opacity-60">{a.use}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Algorithm info */}
            <motion.div
              key={activeAlgo}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card border border-white/10 p-5"
            >
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{current?.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">{current?.name}</h2>
                    <div className="flex gap-2 mt-1">
                      <span className="badge-blue">{current?.category}</span>
                      <span className="badge-green">{current?.purpose}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs space-y-1">
                  <div className="text-slate-400">Time: <span className="text-yellow-400 font-mono">{current?.timeComplexity}</span></div>
                  <div className="text-slate-400">Space: <span className="text-purple-400 font-mono">{current?.spaceComplexity}</span></div>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed mb-4">{current?.description}</p>

              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Algorithm Steps</div>
                <div className="space-y-2">
                  {current?.steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className="text-slate-300">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Interactive visualization */}
            <motion.div
              key={`viz-${activeAlgo}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card border border-white/10 p-5"
            >
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                🎮 Interactive Visualization
              </div>
              {AlgoComponent && <AlgoComponent />}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
