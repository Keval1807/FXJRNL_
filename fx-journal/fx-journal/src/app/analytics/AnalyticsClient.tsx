'use client'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, ScatterChart, Scatter,
} from 'recharts'
import AppShell from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { Trade } from '@/types'
import {
  computeStats, getEquityCurve, getMonthlyPnL, getDailyPnL,
  getPnLBySymbol, getPnLBySession, getPnLByEmotion, fmt,
} from '@/lib/utils'

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg3 border border-border2 rounded-lg px-3 py-2 text-xs font-mono">
      <p className="text-tx3 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color || '#00d4a0' }}>
          {typeof p.value === 'number' ? `${p.value >= 0 ? '+' : ''}$${Math.abs(p.value).toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  )
}

export default function AnalyticsClient({ trades, userEmail }: { trades: Trade[], userEmail: string }) {
  const stats = computeStats(trades)
  const equityCurve = getEquityCurve(trades)
  const monthly = getMonthlyPnL(trades)
  const daily = getDailyPnL(trades)
  const bySymbol = getPnLBySymbol(trades)
  const bySession = getPnLBySession(trades)
  const byEmotion = getPnLByEmotion(trades)

  // Day-of-week breakdown
  const byDow: Record<string, { pnl: number; count: number }> = {}
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  trades.forEach(t => {
    const d = DAYS[new Date(t.exit_time || t.created_at).getUTCDay()]
    if (!byDow[d]) byDow[d] = { pnl: 0, count: 0 }
    byDow[d].pnl += t.pnl
    byDow[d].count++
  })
  const dowData = DAYS.map(d => ({ day: d, pnl: byDow[d]?.pnl || 0, count: byDow[d]?.count || 0 }))

  // P&L scatter (entry vs exit)
  const scatterData = trades.map(t => ({ x: t.entry_price || 0, y: t.pnl, pnl: t.pnl }))

  const KEY_STATS = [
    ['Total Trades', stats.total, ''],
    ['Win Rate', `${stats.winRate.toFixed(1)}%`, stats.winRate >= 50 ? 'text-green' : 'text-red'],
    ['Profit Factor', stats.profitFactor.toFixed(2), stats.profitFactor >= 1.5 ? 'text-green' : stats.profitFactor >= 1 ? 'text-gold' : 'text-red'],
    ['Avg R:R', `${stats.avgRR.toFixed(2)}:1`, stats.avgRR >= 2 ? 'text-green' : stats.avgRR >= 1 ? 'text-gold' : 'text-red'],
    ['Net P&L', fmt(stats.netPnl), stats.netPnl >= 0 ? 'text-green' : 'text-red'],
    ['Avg Win', `+$${stats.avgWin.toFixed(2)}`, 'text-green'],
    ['Avg Loss', `-$${stats.avgLoss.toFixed(2)}`, 'text-red'],
    ['Max Drawdown', `-${stats.maxDrawdown.toFixed(2)}%`, 'text-red'],
  ] as [string, string | number, string][]

  return (
    <ToastProvider>
      <AppShell stats={stats} userEmail={userEmail} tradeCount={trades.length} pageTitle="Analytics">
        {/* Key stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {KEY_STATS.map(([l, v, c]) => (
            <div key={String(l)} className="stat-card">
              <div className="stat-label">{l}</div>
              <div className={`stat-value ${c}`}>{v}</div>
            </div>
          ))}
        </div>

        {/* Equity + Monthly */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card p-4">
            <div className="section-title">Equity Curve</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" />
                <XAxis dataKey="date" tick={{ fill: '#4a607a', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a607a', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => '$' + Math.round(v / 1000) + 'K'} />
                <Tooltip content={<TT />} />
                <Line type="monotone" dataKey="equity" stroke="#00d4a0" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-4">
            <div className="section-title">Monthly P&L</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" />
                <XAxis dataKey="month" tick={{ fill: '#4a607a', fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a607a', fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<TT />} />
                <Bar dataKey="pnl" radius={[3,3,0,0]}>
                  {monthly.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? 'rgba(0,212,160,.7)' : 'rgba(230,64,64,.7)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day of week + Emotion */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card p-4">
            <div className="section-title">P&L by Day of Week</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" />
                <XAxis dataKey="day" tick={{ fill: '#4a607a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#4a607a', fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<TT />} />
                <Bar dataKey="pnl" radius={[3,3,0,0]}>
                  {dowData.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? 'rgba(0,212,160,.7)' : 'rgba(230,64,64,.7)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-4">
            <div className="section-title">P&L by Emotion</div>
            {byEmotion.length ? (
              <div className="space-y-2 pt-1">
                {byEmotion.map(e => (
                  <div key={e.emotion} className="flex items-center gap-2 text-xs">
                    <span className="text-tx2 w-32 truncate">{e.emotion}</span>
                    <div className="flex-1 h-3 bg-bg3 rounded-sm overflow-hidden">
                      <div className="h-full rounded-sm" style={{
                        width: `${Math.min(100, Math.abs(e.pnl) / Math.max(...byEmotion.map(x => Math.abs(x.pnl)), 1) * 100)}%`,
                        background: e.pnl >= 0 ? 'rgba(0,212,160,.7)' : 'rgba(230,64,64,.7)'
                      }} />
                    </div>
                    <span className={`font-mono font-bold w-16 text-right flex-shrink-0 ${e.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                      {e.pnl >= 0 ? '+' : ''}${e.pnl.toFixed(0)}
                    </span>
                    <span className="font-mono text-tx3 w-12 text-right">{e.winRate}% WR</span>
                  </div>
                ))}
              </div>
            ) : <div className="h-20 flex items-center justify-center text-tx3 text-xs">Tag your trades with emotions</div>}
          </div>
        </div>

        {/* Daily heatmap */}
        <div className="card p-4">
          <div className="section-title">Daily P&L Heatmap</div>
          {daily.length ? (
            <div className="flex flex-col gap-1.5">
              {(() => {
                const byMonth: Record<string, typeof daily> = {}
                daily.forEach(d => {
                  const m = d.date.slice(0, 7)
                  if (!byMonth[m]) byMonth[m] = []
                  byMonth[m].push(d)
                })
                const max = Math.max(...daily.map(d => Math.abs(d.pnl)), 1)
                const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                return Object.entries(byMonth).sort().map(([m, days]) => (
                  <div key={m} className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-tx3 w-8">{MN[parseInt(m.split('-')[1]) - 1]}</span>
                    <div className="flex gap-1 flex-wrap">
                      {days.map(d => {
                        const it = Math.min(1, Math.abs(d.pnl) / max)
                        const bg = d.pnl >= 0
                          ? `rgba(0,212,160,${0.15 + it * 0.7})`
                          : `rgba(230,64,64,${0.15 + it * 0.7})`
                        return (
                          <div key={d.date} title={`${d.date}: ${d.pnl >= 0 ? '+' : ''}$${d.pnl.toFixed(2)}`}
                            className="w-4 h-4 rounded-sm cursor-default hover:scale-125 transition-transform"
                            style={{ background: bg }} />
                        )
                      })}
                    </div>
                  </div>
                ))
              })()}
            </div>
          ) : <div className="h-20 flex items-center justify-center text-tx3 text-xs">No data yet</div>}
        </div>
      </AppShell>
    </ToastProvider>
  )
}
