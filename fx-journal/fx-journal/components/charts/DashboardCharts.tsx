'use client'
// components/charts/DashboardCharts.tsx
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts'
import type { Trade } from '@/types'

const TOOLTIP_STYLE = {
  background: '#1a2232', border: '1px solid #263650', borderRadius: 8,
  color: '#c8d8f0', fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)',
}

interface Props {
  equity: { date: string; value: number }[]
  monthly: { month: string; pnl: number }[]
  symData: { name: string; pnl: number }[]
  sessData: { name: string; pnl: number }[]
  trades: Trade[]
}

export default function DashboardCharts({ equity, monthly, symData, sessData, trades }: Props) {
  const SESS_COLS = ['#00d4a0','#00b4e6','#f5a623','#9b6dff']
  const emptyMsg = (
    <div className="flex items-center justify-center h-full text-tx3 text-xs italic">
      Log trades to see charts
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Equity + Monthly */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 rounded-2xl border p-4" style={{ background: '#151b25', borderColor: '#1e2d42' }}>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-tx3 mb-3">Equity Curve</h3>
          <div style={{ height: 200 }}>
            {equity.length < 2 ? emptyMsg : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equity}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4a0" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4a0" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" />
                  <XAxis dataKey="date" tick={{ fill: '#4a607a', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#4a607a', fontSize: 9 }} tickLine={false} axisLine={false}
                    tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`$${v.toFixed(2)}`, 'Equity']} />
                  <Line type="monotone" dataKey="value" stroke="#00d4a0" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border p-4" style={{ background: '#151b25', borderColor: '#1e2d42' }}>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-tx3 mb-3">Monthly P&L</h3>
          <div style={{ height: 200 }}>
            {!monthly.length ? emptyMsg : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#4a607a', fontSize: 8 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#4a607a', fontSize: 8 }} tickLine={false} axisLine={false}
                    tickFormatter={v => `$${v}`} width={45} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v >= 0 ? '+' : ''}$${v.toFixed(2)}`, 'P&L']} />
                  <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                    {monthly.map((d, i) => (
                      <Cell key={i} fill={d.pnl >= 0 ? 'rgba(0,212,160,.75)' : 'rgba(230,64,64,.75)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Symbol + Session + Distribution */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border p-4" style={{ background: '#151b25', borderColor: '#1e2d42' }}>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-tx3 mb-3">By Symbol</h3>
          <div style={{ height: 180 }}>
            {!symData.length ? emptyMsg : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" tick={{ fill: '#4a607a', fontSize: 8 }} tickLine={false} axisLine={false}
                    tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#7a90b0', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }}
                    tickLine={false} axisLine={false} width={55} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v >= 0 ? '+' : ''}$${v.toFixed(2)}`, 'P&L']} />
                  <Bar dataKey="pnl" radius={[0, 3, 3, 0]}>
                    {symData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? 'rgba(0,212,160,.7)' : 'rgba(230,64,64,.7)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border p-4" style={{ background: '#151b25', borderColor: '#1e2d42' }}>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-tx3 mb-3">By Session</h3>
          <div style={{ height: 180 }}>
            {!sessData.length ? emptyMsg : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sessData} dataKey="pnl" nameKey="name" cx="50%" cy="45%" innerRadius={42} outerRadius={65}>
                    {sessData.map((_, i) => <Cell key={i} fill={SESS_COLS[i % SESS_COLS.length] + 'cc'} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v >= 0 ? '+' : ''}$${v.toFixed(2)}`]} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 9, color: '#7a90b0' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border p-4" style={{ background: '#151b25', borderColor: '#1e2d42' }}>
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-tx3 mb-3">Win/Loss Dist</h3>
          <div style={{ height: 180 }}>
            {!trades.length ? emptyMsg : (() => {
              const pnls = trades.map(t => t.pnl)
              const mn = Math.min(...pnls), mx = Math.max(...pnls)
              const N = 12, step = (mx - mn) / N || 1
              const ct = Array(N).fill(0)
              pnls.forEach(p => ct[Math.min(N-1, Math.max(0, Math.floor((p-mn)/step)))]++)
              const data = ct.map((c, i) => ({ mid: mn + (i+.5)*step, count: c }))
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ left: -20, right: 0 }}>
                    <XAxis dataKey="mid" tick={{ fill: '#4a607a', fontSize: 8 }} tickFormatter={v => `$${v.toFixed(0)}`} tickLine={false} axisLine={false} interval={2} />
                    <YAxis tick={{ fill: '#4a607a', fontSize: 8 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [v, 'Trades']} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {data.map((d, i) => <Cell key={i} fill={d.mid >= 0 ? 'rgba(0,212,160,.7)' : 'rgba(230,64,64,.7)'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
