import { useState, useEffect } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import api, { fmtMoney, fmtPct } from '../api.js'
import { useToast } from '../ToastContext.jsx'
import ProfitCalendar from '../components/ProfitCalendar.jsx'

const CO = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#6b7280', font: { size: 8, family: 'JetBrains Mono' }, maxTicksLimit: 8 }, grid: { color: 'rgba(31,41,55,.8)' }, border: { color: '#1f2937' } }, y: { ticks: { color: '#6b7280', font: { size: 8, family: 'JetBrains Mono' } }, grid: { color: 'rgba(31,41,55,.8)' }, border: { color: '#1f2937' } } } }
const TABS = ['Performance', 'Weekly', 'Monthly', 'Emotions', 'Strategy', 'Mistakes', 'Sessions']

export default function Analysis() {
  const [stats, setStats] = useState(null)
  const [settings, setSettings] = useState({ balance: 5000 })
  const [tab, setTab] = useState('Performance')
  const [eqMode, setEqMode] = useState('equity')
  const toast = useToast()

  useEffect(() => {
    Promise.all([api.get('/stats'), api.get('/settings')]).then(([s, se]) => { setStats(s.data); setSettings(se.data) }).catch(() => toast('Failed to load', 'error'))
  }, [])

  if (!stats) return <div className="loading"><div className="spinner" />Loading...</div>
  const s = stats; const bal = parseFloat(settings.balance || 5000)
  const totalPnl = s.totalPnl || 0; const pct = totalPnl / bal * 100

  const renderGroup = (obj, label = 'Group') => {
    if (!obj || !Object.keys(obj).length) return <div className="empty"><div className="empty-icon">📊</div><div className="empty-text">No data yet</div></div>
    const entries = Object.entries(obj).sort((a, b) => Math.abs(b[1].pnl) - Math.abs(a[1].pnl))
    return (
      <div>
        <div className="grid-2" style={{ marginBottom: 12 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Usage</div></div>
            <div className="card-body" style={{ height: 200 }}>
              <Doughnut data={{ labels: entries.map(([k]) => k), datasets: [{ data: entries.map(([, v]) => v.trades), backgroundColor: ['rgba(37,99,235,.5)','rgba(34,197,94,.5)','rgba(239,68,68,.5)','rgba(245,158,11,.5)','rgba(139,92,246,.5)','rgba(6,182,212,.5)','rgba(249,115,22,.5)'], borderWidth: 1 }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: '55%', plugins: { legend: { labels: { color: '#6b7280', font: { size: 8, family: 'JetBrains Mono' }, boxWidth: 8 } } } }} />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">P&L ($)</div></div>
            <div className="card-body" style={{ height: 200 }}>
              <Bar data={{ labels: entries.map(([k]) => k), datasets: [{ data: entries.map(([, v]) => v.pnl), backgroundColor: entries.map(([, v]) => v.pnl >= 0 ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'), borderColor: entries.map(([, v]) => v.pnl >= 0 ? '#22c55e' : '#ef4444'), borderWidth: 1 }] }} options={{ ...CO, indexAxis: 'y', plugins: { ...CO.plugins, tooltip: { callbacks: { label: c => fmtMoney(c.raw, true) } } } }} />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body-0">
            <div className="table-wrap">
              <table>
                <thead><tr><th>{label}</th><th>TRADES</th><th>WIN RATE</th><th>AVG P&L</th><th>TOTAL P&L</th><th>BEST</th></tr></thead>
                <tbody>
                  {entries.map(([k, v]) => {
                    const wr = v.trades ? (v.wins / v.trades * 100).toFixed(0) : 0
                    const avg = v.trades ? v.pnl / v.trades : 0
                    return (
                      <tr key={k}>
                        <td style={{ color: 'var(--amber)', fontWeight: 600 }}>{k}</td>
                        <td>{v.trades}</td>
                        <td style={{ color: parseInt(wr) >= 50 ? 'var(--green)' : 'var(--red)' }}>{wr}%</td>
                        <td style={{ color: avg >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{fmtMoney(avg, true)}</td>
                        <td style={{ color: v.pnl >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)', fontWeight: 700 }}>{fmtMoney(v.pnl, true)}</td>
                        <td style={{ color: 'var(--green)', fontFamily: 'var(--mono)' }}>{fmtMoney(v.best || 0, true)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Equity/drawdown curve
  const sorted = s.equityCurve || []
  const eqLabels = sorted.map(p => p.date?.slice(5))
  let eqData, eqColor
  if (eqMode === 'equity') { eqData = sorted.map(p => p.value); eqColor = '#2563eb' }
  else {
    let peak = bal; let cum = 0
    eqData = sorted.map(p => { cum += p.pnl; const cur = bal + cum; if (cur > peak) peak = cur; return parseFloat(((cur - peak) / peak * 100).toFixed(2)) })
    eqColor = '#ef4444'
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '18px 22px' }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Analysis</div>

      {/* TOP STATS */}
      <div className="grid-4" style={{ marginBottom: 14 }}>
        <div className="stat-box blue"><div className="stat-label">TOTAL P&L</div><div className="stat-value" style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtMoney(totalPnl, true)}</div><div className="stat-sub" style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtPct(pct)}</div></div>
        <div className="stat-box"><div className="stat-label">WIN RATE</div><div className="stat-value">{s.totalTrades ? s.winRate + '%' : '—'}</div><div className="stat-sub">{s.wins}W / {s.losses}L</div></div>
        <div className="stat-box amber"><div className="stat-label">PROFIT FACTOR</div><div className="stat-value" style={{ color: 'var(--amber)' }}>{s.profitFactor || '—'}</div><div className="stat-sub">Gross P / Gross L</div></div>
        <div className="stat-box blue"><div className="stat-label">EXPECTANCY</div><div className="stat-value" style={{ color: s.expectancy >= 0 ? 'var(--blue3)' : 'var(--red)' }}>{fmtMoney(s.expectancy || 0, true)}</div><div className="stat-sub">Avg profit per trade</div></div>
      </div>

      {/* TABS */}
      <div className="tab-bar" style={{ marginBottom: 14 }}>
        {TABS.map(t => <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === 'Performance' && (
        <div>
          <div className="grid-2" style={{ marginBottom: 12 }}>
            {/* Equity / Drawdown */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">📈 Equity Curve</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[['equity', 'Equity'], ['drawdown', 'Drawdown']].map(([m, l]) => (
                    <button key={m} className="btn btn-sm btn-outline" onClick={() => setEqMode(m)} style={{ background: eqMode === m ? (m === 'equity' ? 'var(--blue)' : 'var(--red)') : '', borderColor: eqMode === m ? (m === 'equity' ? 'var(--blue)' : 'var(--red)') : '', color: eqMode === m ? '#fff' : '' }}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="card-body" style={{ height: 200 }}>
                {eqLabels.length ? (
                  <Line data={{ labels: eqLabels, datasets: [{ data: eqData, borderColor: eqColor, backgroundColor: eqColor + '20', fill: true, tension: 0.35, pointRadius: eqData.length > 30 ? 0 : 3, borderWidth: 2 }] }} options={{ ...CO, plugins: { ...CO.plugins, tooltip: { callbacks: { label: c => eqMode === 'equity' ? '$' + c.raw.toFixed(2) : c.raw + '%' } } } }} />
                ) : <div className="empty"><div className="empty-icon">📈</div><div className="empty-text">Complete trades to see equity curve</div></div>}
              </div>
            </div>

            {/* Long vs Short */}
            <div className="card">
              <div className="card-header"><div className="card-title">↕ Long vs Short</div></div>
              <div className="card-body">
                {[['Long ↑', s.byPair ? null : null, s.totalTrades, s.wins, s.grossWin], ['Short ↓', null, s.totalTrades, s.losses, s.grossLoss]].map((_, i) => {
                  const dir = i === 0 ? 'LONG' : 'SHORT'
                  // approximate from all trades
                  const dirLabel = dir === 'LONG' ? 'Long' : 'Short'
                  return null
                })}
                {/* Quick Win/Loss doughnut */}
                <div style={{ height: 160 }}>
                  <Doughnut data={{ labels: ['Wins', 'Losses'], datasets: [{ data: [s.wins || 0, s.losses || 0], backgroundColor: ['rgba(34,197,94,.35)', 'rgba(239,68,68,.35)'], borderColor: ['#22c55e', '#ef4444'], borderWidth: 2 }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: '58%', plugins: { legend: { labels: { color: '#6b7280', font: { size: 10 }, boxWidth: 10 } } } }} />
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Metrics + Stats Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
            <div className="card">
              <div className="card-header"><div className="card-title">Portfolio Metrics</div></div>
              <div className="card-body">
                {[
                  ['Total P&L', fmtMoney(totalPnl, true), totalPnl >= 0 ? 'tg' : 'tr'],
                  ['Account Value', fmtMoney(s.accountValue || bal), 'tw'],
                  ['P&L %', fmtPct(pct), totalPnl >= 0 ? 'tg' : 'tr'],
                  ['Profit Factor', s.profitFactor || '—', parseFloat(s.profitFactor) >= 1.5 ? 'tg' : 'tr'],
                  ['Avg Winner', fmtMoney(s.avgWin || 0, true), 'tg'],
                  ['Avg Loser', '-' + fmtMoney(s.avgLoss || 0), 'tr'],
                  ['Max Drawdown', (s.maxDrawdownPct || 0).toFixed(2) + '%', 'tr'],
                  ['Trading Days', s.tradingDays || 0, ''],
                  ['Win Days', s.winDays || 0, 'tg'],
                  ['Loss Days', s.lossDays || 0, 'tr'],
                ].map(([l, v, c]) => (
                  <div className="perf-row" key={l}>
                    <span className="perf-label">{l}</span>
                    <span className={`perf-value ${c === 'tg' ? 'text-green' : c === 'tr' ? 'text-red' : c === 'tw' ? '' : ''}`} style={{ color: c === 'tg' ? 'var(--green)' : c === 'tr' ? 'var(--red)' : c === 'tw' ? '#fff' : '' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Full stats table - 2 columns */}
            <div className="card">
              <div className="card-header"><div className="card-title">Your Stats</div></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {[
                    ['Total P&L', fmtMoney(totalPnl, true), totalPnl >= 0 ? 'var(--green)' : 'var(--red)'],
                    ['Account Value', fmtMoney(s.accountValue || bal), '#fff'],
                    ['Total Trades', s.totalTrades || 0, ''],
                    ['Winning Trades', s.wins || 0, 'var(--green)'],
                    ['Losing Trades', s.losses || 0, 'var(--red)'],
                    ['Win Rate', s.totalTrades ? s.winRate + '%' : '—', ''],
                    ['Avg Winner', fmtMoney(s.avgWin || 0, true), 'var(--green)'],
                    ['Avg Loser', '-$' + (s.avgLoss || 0).toFixed(2), 'var(--red)'],
                    ['Best Trade', fmtMoney(s.bestTrade || 0, true), 'var(--green)'],
                    ['Worst Trade', fmtMoney(s.worstTrade || 0), 'var(--red)'],
                    ['Profit Factor', s.profitFactor || '—', parseFloat(s.profitFactor) >= 1.5 ? 'var(--green)' : 'var(--red)'],
                    ['Trade Expectancy', fmtMoney(s.expectancy || 0, true), (s.expectancy || 0) >= 0 ? 'var(--green)' : 'var(--red)'],
                    ['Max Drawdown', (s.maxDrawdownPct || 0).toFixed(2) + '%', 'var(--red)'],
                    ['Max Drawdown $', fmtMoney(s.maxDrawdown || 0), 'var(--red)'],
                    ['Trading Days', s.tradingDays || 0, ''],
                    ['Win Days', s.winDays || 0, 'var(--green)'],
                    ['Loss Days', s.lossDays || 0, 'var(--red)'],
                    ['Total Pips', (s.totalPips || 0) > 0 ? '+' + s.totalPips : s.totalPips || 0, ''],
                  ].map(([l, v, c]) => (
                    <div className="perf-row" key={l} style={{ padding: '6px 0' }}>
                      <span className="perf-label">{l}</span>
                      <span className="perf-value" style={{ color: c || 'var(--text3)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-header"><div className="card-title">Calendar Heatmap</div></div>
            <div className="card-body">
              <div className="heatmap">
                {Object.entries(s.calendarData || {}).sort(([a], [b]) => a.localeCompare(b)).map(([date, data]) => {
                  const maxAbs = Math.max(...Object.values(s.calendarData || {}).map(d => Math.abs(d.pnl))) || 1
                  const intensity = Math.abs(data.pnl) / maxAbs
                  const col = data.pnl > 0 ? `rgba(34,197,94,${0.1 + intensity * 0.7})` : data.pnl < 0 ? `rgba(239,68,68,${0.1 + intensity * 0.7})` : '#1f2937'
                  return <div key={date} className="hm-cell" style={{ background: col }} data-tip={`${date}: ${fmtMoney(data.pnl, true)}`} />
                })}
              </div>
            </div>
          </div>
          <ProfitCalendar calendarData={s.calendarData || {}} />
        </div>
      )}

      {tab === 'Emotions' && renderGroup(s.byEmotion, 'EMOTION')}
      {tab === 'Strategy' && renderGroup(s.byStrategy, 'STRATEGY')}
      {tab === 'Mistakes' && renderGroup(s.byMistake && Object.fromEntries(Object.entries(s.byMistake).filter(([k]) => k && k !== 'None')), 'MISTAKE')}
      {tab === 'Sessions' && renderGroup(s.bySession, 'SESSION')}
      {tab === 'Weekly' && <div className="empty"><div className="empty-icon">📅</div><div className="empty-text">Log more trades to see weekly breakdown</div></div>}
      {tab === 'Monthly' && <div className="empty"><div className="empty-icon">📅</div><div className="empty-text">Log more trades to see monthly breakdown</div></div>}
    </div>
  )
}
