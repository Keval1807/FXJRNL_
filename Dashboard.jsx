import { useState, useEffect, useRef } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import { Chart, registerables } from 'chart.js'
import api, { fmtMoney, fmtPct, calcPnl } from '../api.js'
import { useToast } from '../ToastContext.jsx'
import TradeForm from '../components/TradeForm.jsx'
import ProfitCalendar from '../components/ProfitCalendar.jsx'
import ConsistencyMeter from '../components/ConsistencyMeter.jsx'

Chart.register(...registerables)

const CHART_DEFAULTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#6b7280', font: { size: 8, family: 'JetBrains Mono' }, maxTicksLimit: 8 }, grid: { color: 'rgba(31,41,55,.8)' }, border: { color: '#1f2937' } },
    y: { ticks: { color: '#6b7280', font: { size: 8, family: 'JetBrains Mono' } }, grid: { color: 'rgba(31,41,55,.8)' }, border: { color: '#1f2937' } }
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [settings, setSettings] = useState({ balance: 5000 })
  const [avMode, setAvMode] = useState('value')
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const load = async () => {
    try {
      const [sRes, setRes] = await Promise.all([api.get('/stats'), api.get('/settings')])
      setStats(sRes.data)
      setSettings(setRes.data)
    } catch {
      toast('Failed to load data — is the backend running?', 'error')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="loading"><div className="spinner"></div>Loading...</div>

  const s = stats || {}
  const totalPnl = s.totalPnl || 0
  const accountVal = s.accountValue || parseFloat(settings.balance || 5000)
  const pct = ((totalPnl / parseFloat(settings.balance || 5000)) * 100)

  // Equity curve chart data
  const eqLabels = (s.equityCurve || []).map(p => p.date?.slice(5))
  const eqData = avMode === 'value'
    ? (s.equityCurve || []).map(p => p.value)
    : (s.equityCurve || []).map(p => p.pnl ? s.equityCurve.slice(0, s.equityCurve.indexOf(p) + 1).reduce((a, x) => a + x.pnl, 0) : 0)

  const eqColor = (eqData[eqData.length - 1] || 0) >= (avMode === 'value' ? parseFloat(settings.balance) : 0) ? '#22c55e' : '#ef4444'

  // Daily P&L
  const dpDays = (s.dailyPnl || []).slice(-20)
  const dpColors = dpDays.map(d => d.pnl >= 0 ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)')
  const dpBorders = dpDays.map(d => d.pnl >= 0 ? '#22c55e' : '#ef4444')

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '18px 22px' }}>

      {/* STAT ROW */}
      <div className="grid-4" style={{ marginBottom: 14 }}>
        <div className="stat-box blue">
          <div className="stat-label">ACCOUNT VALUE</div>
          <div className="stat-value" style={{ color: totalPnl >= 0 ? 'var(--blue3)' : 'var(--red)' }}>{fmtMoney(accountVal)}</div>
          <div className="stat-sub" style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtMoney(totalPnl, true)} ({fmtPct(pct || 0)})</div>
        </div>
        <div className="stat-box green">
          <div className="stat-label">TOTAL P&L</div>
          <div className="stat-value" style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtMoney(totalPnl, true)}</div>
          <div className="stat-sub">{(s.totalPips || 0) > 0 ? '+' : ''}{(s.totalPips || 0).toFixed(1)} pips</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">WIN RATE</div>
          <div className="stat-value">{s.totalTrades ? s.winRate + '%' : '—'}</div>
          <div className="stat-sub">{s.wins || 0}W / {s.losses || 0}L / {s.totalTrades || 0} trades</div>
        </div>
        <div className="stat-box amber">
          <div className="stat-label">PROFIT FACTOR</div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{s.profitFactor || '—'}</div>
          <div className="stat-sub">Expectancy: {fmtMoney(s.expectancy || 0, true)}</div>
        </div>
      </div>

      {/* CONSISTENCY METER */}
      <ConsistencyMeter stats={s} />

      {/* CHARTS ROW */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">📈 Account Value Over Time</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['value', 'pnl'].map(m => (
                <button key={m} className="btn btn-sm btn-outline" onClick={() => setAvMode(m)}
                  style={{ background: avMode === m ? 'var(--blue)' : '', borderColor: avMode === m ? 'var(--blue)' : '', color: avMode === m ? '#fff' : '' }}>
                  {m === 'value' ? 'Account Value' : 'P&L'}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body" style={{ height: 200 }}>
            {eqLabels.length ? (
              <Line data={{
                labels: eqLabels,
                datasets: [{ data: eqData, borderColor: eqColor, backgroundColor: eqColor + '20', fill: true, tension: 0.35, pointRadius: eqData.length > 30 ? 0 : 3, borderWidth: 2 }]
              }} options={{ ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, tooltip: { callbacks: { label: c => '$' + c.raw.toFixed(2) } } } }} />
            ) : <div className="empty"><div className="empty-icon">📈</div><div className="empty-text">Log trades to see chart</div></div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">📊 Daily P&L</div></div>
          <div className="card-body" style={{ height: 200 }}>
            {dpDays.length ? (
              <Bar data={{
                labels: dpDays.map(d => d.date?.slice(5)),
                datasets: [{ data: dpDays.map(d => d.pnl), backgroundColor: dpColors, borderColor: dpBorders, borderWidth: 1 }]
              }} options={{ ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, tooltip: { callbacks: { label: c => fmtMoney(c.raw, true) } } } }} />
            ) : <div className="empty"><div className="empty-icon">📊</div><div className="empty-text">No daily data yet</div></div>}
          </div>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid-4" style={{ marginBottom: 14 }}>
        {[
          ['AVG WINNER', fmtMoney(s.avgWin || 0, true), 'var(--green)'],
          ['AVG LOSER', '-' + fmtMoney(s.avgLoss || 0), 'var(--red)'],
          ['BEST TRADE', fmtMoney(s.bestTrade || 0, true), 'var(--green)'],
          ['WORST TRADE', fmtMoney(s.worstTrade || 0), 'var(--red)'],
          ['WIN STREAK', (s.streak?.bestWin || 0) + ' trades', ''],
          ['LOSS STREAK', (s.streak?.worstLoss || 0) + ' trades', 'var(--red)'],
          ['MAX DRAWDOWN', (s.maxDrawdownPct || 0).toFixed(2) + '%', 'var(--amber)'],
          ['TRADING DAYS', s.tradingDays || 0, ''],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 5, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text4)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--mono)', color: color || '#fff' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* PROFIT CALENDAR */}
      <ProfitCalendar calendarData={s.calendarData || {}} />

      {/* TRADE ENTRY FORM */}
      <TradeForm onSaved={load} />

    </div>
  )
}
