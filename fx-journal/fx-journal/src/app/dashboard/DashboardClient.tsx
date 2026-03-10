'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import AppShell from '@/components/layout/AppShell'
import Gauge from '@/components/ui/Gauge'
import AddTradeModal from '@/components/trades/AddTradeModal'
import { ToastProvider } from '@/components/ui/Toast'
import { Trade } from '@/types'
import { computeStats, getEquityCurve, getMonthlyPnL, getPnLBySymbol, getPnLBySession, fmt } from '@/lib/utils'

const COLORS = ['#00d4a0', '#00b4e6', '#f5a623', '#9b6dff', '#e64040', '#ff9944']
const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg3 border border-border2 rounded-lg px-3 py-2 text-xs">
      <p className="text-tx3 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || p.fill }} className="font-mono font-bold">
          {typeof p.value === 'number'
            ? p.name?.includes('equity') ? fmt(p.value)
            : `${p.value >= 0 ? '+' : ''}$${Math.abs(p.value).toFixed(2)}`
            : p.value}
        </p>
      ))}
    </div>
  )
}

export default function DashboardClient({ trades, userEmail }: { trades: Trade[], userEmail: string }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const stats = computeStats(trades)
  const equityCurve = getEquityCurve(trades)
  const monthlyPnL = getMonthlyPnL(trades)
  const bySymbol = getPnLBySymbol(trades).slice(0, 6)
  const bySession = getPnLBySession(trades)

  const GAUGES = [
    { label: 'WIN RATE',      value: `${stats.winRate.toFixed(1)}%`, sub: 'WR',   bottom: `${stats.wins}W ${stats.losses}L`, pct: stats.winRate,              color: '#00d4a0' },
    { label: 'PROFIT FACTOR', value: stats.profitFactor.toFixed(2), sub: 'PF',   bottom: 'Profit Factor',                  pct: Math.min(stats.profitFactor/3*100,100), color: '#00b4e6' },
    { label: 'REWARD:RISK',   value: `${stats.avgRR.toFixed(2)}:1`, sub: 'R:R',  bottom: `$${stats.avgWin.toFixed(0)}W / $${stats.avgLoss.toFixed(0)}L`, pct: Math.min(stats.avgRR/3*100,100), color: '#f5a623' },
    { label: 'TOTAL P&L',     value: `${stats.netPips >= 0 ? '+' : ''}${stats.netPips.toFixed(1)}`, sub: 'PIPS', bottom: `${stats.total} trades`, pct: stats.winRate, color: '#00d4a0' },
  ]

  return (
    <ToastProvider>
      <AppShell stats={stats} userEmail={userEmail} tradeCount={trades.length} pageTitle="Dashboard"
        action={<button className="btn-primary text-xs py-1.5 px-4" onClick={() => setModalOpen(true)}>+ Log Trade</button>}>

        {/* Gauges */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {GAUGES.map(g => <Gauge key={g.label} {...g} />)}
        </div>

        {/* Equity + Monthly */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="card p-4 col-span-3">
            <div className="section-title flex justify-between items-center">
              <span>Equity Curve</span>
              <span className="text-tx4 font-normal normal-case tracking-normal">{equityCurve.length - 1} trades</span>
            </div>
            {equityCurve.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={equityCurve}>
                  <defs>
                    <linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4a0" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4a0" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" />
                  <XAxis dataKey="date" tick={{ fill: '#4a607a', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#4a607a', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} tickFormatter={v => '$' + Math.round(v / 1000) + 'K'} />
                  <Tooltip content={<TT />} />
                  <Line type="monotone" dataKey="equity" stroke="#00d4a0" strokeWidth={2} dot={false} name="equity" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-tx3 text-sm">Add trades to see your equity curve</div>
            )}
          </div>
          <div className="card p-4 col-span-2">
            <div className="section-title">Monthly P&L</div>
            {monthlyPnL.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyPnL}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" />
                  <XAxis dataKey="month" tick={{ fill: '#4a607a', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#4a607a', fontSize: 9, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} tickFormatter={v => '$' + v.toFixed(0)} />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="pnl" radius={[3,3,0,0]} name="pnl">
                    {monthlyPnL.map((e, i) => <Cell key={i} fill={e.pnl >= 0 ? 'rgba(0,212,160,.7)' : 'rgba(230,64,64,.7)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-tx3 text-sm">No data yet</div>
            )}
          </div>
        </div>

        {/* By Symbol + Session + Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {/* Symbol breakdown */}
          <div className="card p-4">
            <div className="section-title">By Symbol</div>
            {bySymbol.length ? (
              <div className="space-y-2">
                {bySymbol.map(s => {
                  const max = Math.max(...bySymbol.map(x => Math.abs(x.pnl)), 1)
                  const w = (Math.abs(s.pnl) / max * 100).toFixed(1)
                  return (
                    <div key={s.symbol} className="flex items-center gap-2">
                      <span className="font-mono text-xs text-tx2 w-14 text-right flex-shrink-0">{s.symbol}</span>
                      <div className="flex-1 h-3 bg-bg3 rounded-sm overflow-hidden">
                        <div className="h-full rounded-sm transition-all" style={{ width: `${w}%`, background: s.pnl >= 0 ? 'rgba(0,212,160,.7)' : 'rgba(230,64,64,.7)' }} />
                      </div>
                      <span className={`font-mono text-xs font-bold w-16 text-right flex-shrink-0 ${s.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                        {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(0)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : <div className="h-20 flex items-center justify-center text-tx3 text-xs">No data</div>}
          </div>

          {/* Session breakdown */}
          <div className="card p-4">
            <div className="section-title">By Session</div>
            {bySession.filter(s => s.pnl !== 0).length ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={bySession.filter(s => s.pnl !== 0)} dataKey="pnl" nameKey="session" cx="50%" cy="50%" outerRadius={60} innerRadius={35} paddingAngle={3}>
                    {bySession.filter(s => s.pnl !== 0).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<TT />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-36 flex items-center justify-center text-tx3 text-xs">No data</div>}
          </div>

          {/* Quick stats grid */}
          <div className="card p-4">
            <div className="section-title">Performance</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Net P&L', fmt(stats.netPnl), stats.netPnl >= 0 ? 'text-green' : 'text-red'],
                ['Max DD', `-${stats.maxDrawdown.toFixed(2)}%`, 'text-red'],
                ['Best', `+$${stats.best.toFixed(2)}`, 'text-green'],
                ['Worst', `$${stats.worst.toFixed(2)}`, 'text-red'],
                ['Avg Win', `+$${stats.avgWin.toFixed(2)}`, 'text-green'],
                ['Avg Loss', `-$${stats.avgLoss.toFixed(2)}`, 'text-red'],
              ].map(([l, v, c]) => (
                <div key={String(l)} className="bg-bg3 border border-border rounded-lg p-2">
                  <div className="text-[9px] font-bold uppercase tracking-wide text-tx4 mb-1">{l}</div>
                  <div className={`font-mono text-xs font-bold ${c}`}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AddTradeModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={() => router.refresh()} />
      </AppShell>
    </ToastProvider>
  )
}
