/**
 * App.jsx
 * Root application component with routing, lazy loading, and Suspense.
 * Pages are code-split so only the current page's JS is loaded.
 */

import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { TrafficProvider } from './context/TrafficContext'
import Navbar from './components/Navbar'
import AlertBanner from './components/AlertBanner'

// Lazy-load all pages — each becomes its own JS chunk
const LandingPage    = lazy(() => import('./pages/LandingPage'))
const SimulatorPage  = lazy(() => import('./pages/SimulatorPage'))
const DashboardPage  = lazy(() => import('./pages/DashboardPage'))
const AlgorithmsPage = lazy(() => import('./pages/AlgorithmsPage'))
const AdminPage      = lazy(() => import('./pages/AdminPage'))
const DocsPage       = lazy(() => import('./pages/DocsPage'))

// Minimal loading spinner shown while a page chunk loads
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Loading...</span>
      </div>
    </div>
  )
}

function App() {
  return (
    <TrafficProvider>
      <Router>
        <div className="min-h-screen bg-dark-900 text-white font-sans">
          <Navbar />
          <AlertBanner />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"           element={<LandingPage />} />
              <Route path="/simulator"  element={<SimulatorPage />} />
              <Route path="/dashboard"  element={<DashboardPage />} />
              <Route path="/algorithms" element={<AlgorithmsPage />} />
              <Route path="/admin"      element={<AdminPage />} />
              <Route path="/docs"       element={<DocsPage />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </TrafficProvider>
  )
}

export default App
