import { useState, useEffect } from 'react'
import { ToastProvider } from './ToastContext.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Journal from './pages/Journal.jsx'
import Analysis from './pages/Analysis.jsx'
import Backtest from './pages/Backtest.jsx'
import Settings from './pages/Settings.jsx'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'journal',   label: 'Journal',   icon: '📋' },
  { id: 'analysis',  label: 'Analysis',  icon: '📈' },
  { id: 'backtest',  label: 'Backtest',  icon: '🔄' },
  { id: 'settings',  label: 'Settings',  icon: '⚙️' },
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-GB', { hour12: false }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const Page = { dashboard: Dashboard, journal: Journal, analysis: Analysis, backtest: Backtest, settings: Settings }[page]

  return (
    <ToastProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* TOP BAR */}
        <div style={{
          height: 48, background: 'var(--bg1)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'stretch', flexShrink: 0, zIndex: 100
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', borderRight: '1px solid var(--border)', minWidth: 195 }}>
            <div style={{ width: 28, height: 28, background: 'var(--blue)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff' }}>KK</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>KEVAL <span style={{ color: 'var(--blue2)' }}>KABARIYA</span></div>
          </div>

          {/* Nav */}
          <div style={{ display: 'flex' }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={{
                border: 'none', borderBottom: `2px solid ${page === n.id ? 'var(--blue)' : 'transparent'}`,
                borderRight: '1px solid var(--border)', color: page === n.id ? '#fff' : 'var(--text4)',
                padding: '0 18px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                background: page === n.id ? 'rgba(37,99,235,.06)' : 'transparent',
                transition: 'all .15s', fontFamily: 'var(--sans)'
              }}>
                <span>{n.icon}</span> {n.label}
              </button>
            ))}
          </div>

          {/* Right */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 0, borderLeft: '1px solid var(--border)' }}>
            <div style={{ padding: '0 16px', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'blink 2s infinite' }}></div>
              <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--blue3)' }}>{clock}</span>
            </div>
            <div style={{ padding: '0 14px', fontSize: 10, color: 'var(--text4)', fontFamily: 'var(--mono)' }}>
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Page key={page} />
        </div>

      </div>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
      `}</style>
    </ToastProvider>
  )
}
