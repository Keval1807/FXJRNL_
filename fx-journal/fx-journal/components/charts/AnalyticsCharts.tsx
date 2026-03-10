'use client'
// components/charts/AnalyticsCharts.tsx
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns'

const TS = { background:'#1a2232', border:'1px solid #263650', borderRadius:8, color:'#c8d8f0', fontSize:11, fontFamily:'monospace' }

interface Props {
  equity: { date: string; value: number }[]
  monthly: { month: string; pnl: number }[]
  dailyMap: Record<string, number>
  emotionData: { name: string; pnl: number; count: number }[]
  setupData: { name: string; pnl: number; wr: number }[]
  dowData: { name: string; pnl: number; count: number }[]
}

export default function AnalyticsCharts({ equity, monthly, dailyMap, emotionData, setupData, dowData }: Props) {
  const empty = <div className="flex items-center justify-center h-full text-tx3 text-xs italic">No data yet</div>

  // Heatmap — last 3 months
  const today = new Date()
  const start3m = startOfMonth(subMonths(today, 2))
  const heatDays = eachDayOfInterval({ start: start3m, end: today })
  const heatMax = Math.max(1, ...Object.values(dailyMap).map(Math.abs))

  const box = (title: string, children: React.ReactNode, cols = 1) => (
    <div className={`rounded-2xl border p-4 ${cols === 2 ? 'col-span-2' : ''}`}
      style={{ background:'#151b25', borderColor:'#1e2d42' }}>
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-tx3 mb-3">{title}</h3>
      {children}
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {box('Equity Curve',
          <div style={{ height:180 }}>
            {equity.length < 2 ? empty : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" />
                  <XAxis dataKey="date" tick={{ fill:'#4a607a', fontSize:8 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill:'#4a607a', fontSize:8 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`$${v.toFixed(2)}`, 'Equity']} />
                  <Line type="monotone" dataKey="value" stroke="#00d4a0" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>, 2
        )}
        {box('P&L by Day of Week',
          <div style={{ height:180 }}>
            {!dowData.some(d => d.count > 0) ? empty : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d42" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill:'#4a607a', fontSize:9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill:'#4a607a', fontSize:9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`${v >= 0 ? '+' : ''}$${v.toFixed(2)}`, 'P&L']} />
                  <Bar dataKey="pnl" radius={[3,3,0,0]}>
                    {dowData.map((d,i) => <Cell key={i} fill={d.pnl >= 0 ? 'rgba(0,212,160,.75)' : 'rgba(230,64,64,.75)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {box('P&L by Emotion Tag',
          <div style={{ height:180 }}>
            {!emotionData.length ? empty : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emotionData} layout="vertical">
                  <XAxis type="number" tick={{ fill:'#4a607a', fontSize:8 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill:'#7a90b0', fontSize:10 }} tickLine={false} axisLine={false} width={100} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`${v >= 0 ? '+' : ''}$${v.toFixed(2)}`, 'P&L']} />
                  <Bar dataKey="pnl" radius={[0,3,3,0]}>
                    {emotionData.map((d,i) => <Cell key={i} fill={d.pnl >= 0 ? 'rgba(0,212,160,.7)' : 'rgba(230,64,64,.7)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
        {box('P&L by Setup Tag',
          <div style={{ height:180 }}>
            {!setupData.length ? empty : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setupData} layout="vertical">
                  <XAxis type="number" tick={{ fill:'#4a607a', fontSize:8 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill:'#7a90b0', fontSize:9 }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`${v >= 0 ? '+' : ''}$${v.toFixed(2)}`, 'P&L']} />
                  <Bar dataKey="pnl" radius={[0,3,3,0]}>
                    {setupData.map((d,i) => <Cell key={i} fill={d.pnl >= 0 ? 'rgba(0,212,160,.7)' : 'rgba(230,64,64,.7)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div className="rounded-2xl border p-4" style={{ background:'#151b25', borderColor:'#1e2d42' }}>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-tx3 mb-3">Daily P&L Heatmap — Last 3 Months</h3>
        {!Object.keys(dailyMap).length ? (
          <p className="text-tx3 text-xs italic">No trade data yet</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {heatDays.map(day => {
              const k = format(day, 'yyyy-MM-dd')
              const v = dailyMap[k]
              const it = v !== undefined ? Math.min(1, Math.abs(v) / heatMax) : 0
              const bg = v === undefined ? '#1f2a3c' : v >= 0 ? `rgba(0,212,160,${0.15 + it * 0.7})` : `rgba(230,64,64,${0.15 + it * 0.7})`
              const isWeekend = [0,6].includes(day.getDay())
              return (
                <div key={k}
                  title={v !== undefined ? `${k}: ${v >= 0 ? '+' : ''}$${v.toFixed(2)}` : k}
                  className="rounded transition-transform hover:scale-125"
                  style={{ width:16, height:16, background: isWeekend ? 'transparent' : bg, cursor:'default' }}
                />
              )
            })}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] text-tx3">Loss</span>
          {[0.9,0.6,0.3,0.15].map(o => <div key={o} className="w-3 h-3 rounded-sm" style={{ background:`rgba(230,64,64,${o})` }} />)}
          <div className="w-3 h-3 rounded-sm" style={{ background:'#1f2a3c' }} />
          {[0.15,0.3,0.6,0.9].map(o => <div key={o} className="w-3 h-3 rounded-sm" style={{ background:`rgba(0,212,160,${o})` }} />)}
          <span className="text-[9px] text-tx3">Win</span>
        </div>
      </div>
    </div>
  )
}
