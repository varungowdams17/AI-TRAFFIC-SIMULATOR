/**
 * DashboardPage.jsx
 * Live analytics dashboard with real-time charts, KPI cards,
 * and traffic monitoring panels.
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { useTraffic } from '../context/TrafficContext'
import StatCard from '../components/StatCard'

const COLORS = ['#0ea5e9', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']

export default function DashboardPage() {
  const { state } = useTraffic()
  const { analytics, trafficDensity, densityHistory, waitTimeHistory, throughputHistory, alerts, accidents } = state

  // Prepare chart data
  const densityData = densityHistory.slice(-15).map((d, i) => ({
    time: d.time || `T-${15 - i}`,
    density: d.value || 0,
  }))

  const waitData = waitTimeHistory.slice(-15).map((d, i) => ({
    time: d.time || `T-${15 - i}`,
    wait: d.value || 0,
  }))

  const throughputData = throughputHistory.slice(-15).map((d, i) => ({
    time: d.time || `T-${15 - i}`,
    throughput: d.value || 0,
  }))

  const roadDensityData = [
    { road: 'North', density: Math.round(trafficDensity.north), fill: '#0ea5e9' },
    { road: 'South', density: Math.round(trafficDensity.south), fill: '#8b5cf6' },
    { road: 'East',  density: Math.round(trafficDensity.east),  fill: '#22c55e' },
    { road: 'West',  density: Math.round(trafficDensity.west),  fill: '#f59e0b' },
  ]

  const pieData = [
    { name: 'Moving', value: state.movingVehicles || 1 },
    { name: 'Waiting', value: state.waitingVehicles || 0 },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen pt-16 bg-dark-900">
      <div className="section-container py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold gradient-text">Live Analytics Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time traffic monitoring and performance metrics</p>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6"
        >
          <motion.div variants={itemVariants}>
            <StatCard title="Total Vehicles" value={state.totalVehicles} icon="🚗" color="blue" subtitle="In simulation" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Moving" value={state.movingVehicles} icon="▶️" color="green" subtitle="Active vehicles" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Waiting" value={state.waitingVehicles} icon="⏸️" color="yellow" subtitle="At signals" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Congestion" value={analytics.congestionPercent} unit="%" icon="🚦" color="red" subtitle="Average density" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Avg Wait Time" value={analytics.avgWaitTime} unit="s" icon="⏱️" color="purple" subtitle="Per vehicle" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Throughput" value={analytics.throughput} unit="/min" icon="📈" color="cyan" subtitle="Vehicles cleared" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Fuel Wastage" value={analytics.fuelWastage} unit="L/h" icon="⛽" color="yellow" subtitle="Estimated" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard title="Pollution" value={analytics.pollutionLevel} unit="AQI" icon="🌫️" color="red" subtitle="CO₂ index" />
          </motion.div>
        </motion.div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Density over time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass-card border border-white/10 p-5"
          >
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-primary-400">📊</span> Traffic Density Over Time
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={densityData}>
                <defs>
                  <linearGradient id="densityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="density" stroke="#0ea5e9" fill="url(#densityGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Vehicle distribution pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card border border-white/10 p-5"
          >
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-accent-400">🥧</span> Vehicle Status
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Road density bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card border border-white/10 p-5"
          >
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-green-400">📊</span> Road-wise Density
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={roadDensityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="road" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="density" radius={[6, 6, 0, 0]}>
                  {roadDensityData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Throughput line chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card border border-white/10 p-5"
          >
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-yellow-400">📈</span> Throughput vs Wait Time
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={throughputData.map((d, i) => ({ ...d, wait: waitData[i]?.wait || 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
                <Line type="monotone" dataKey="throughput" stroke="#22c55e" strokeWidth={2} dot={false} name="Throughput" />
                <Line type="monotone" dataKey="wait" stroke="#f59e0b" strokeWidth={2} dot={false} name="Wait Time" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Bottom Row: Alerts + Accidents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alert Log */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card border border-white/10 p-5"
          >
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-red-400">🔔</span> Alert Log
              <span className="ml-auto badge-blue">{alerts.length} events</span>
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-slate-500 text-sm text-center py-4">No alerts yet. Start the simulation.</div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl text-xs border ${
                    alert.type === 'emergency' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
                    alert.type === 'danger' ? 'bg-orange-500/10 border-orange-500/20 text-orange-300' :
                    alert.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-300' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-300'
                  }`}>
                    <span className="flex-1">{alert.message}</span>
                    <span className="text-slate-500 whitespace-nowrap">{alert.time}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card border border-white/10 p-5"
          >
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-green-400">⚡</span> System Status
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Simulation Engine', status: state.isRunning ? 'Running' : 'Stopped', ok: state.isRunning },
                { label: 'Greedy Signal Optimizer', status: 'Active', ok: true },
                { label: 'Emergency Priority Queue', status: state.emergencyActive ? 'ACTIVE' : 'Standby', ok: !state.emergencyActive },
                { label: 'Dijkstra Route Engine', status: state.accidentActive ? 'Rerouting' : 'Ready', ok: !state.accidentActive },
                { label: 'DP Traffic Predictor', status: state.isRunning ? 'Predicting' : 'Idle', ok: state.isRunning },
                { label: 'Voice Alert System', status: 'Enabled', ok: true },
                { label: 'Peak Hour Mode', status: state.peakHourMode ? 'ACTIVE' : 'Normal', ok: !state.peakHourMode },
                { label: 'Accident Detection', status: state.accidentActive ? 'ALERT' : 'Monitoring', ok: !state.accidentActive },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    item.ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
