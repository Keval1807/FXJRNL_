// app/dashboard/page.tsx
import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { computeStats } from '@/types'
import { buildEquityCurve, groupByMonth, fmtPnl, fmtPct } from '@/lib/utils'
import DashboardCharts from '@/components/charts/DashboardCharts'

export default async function DashboardPage() {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', session.user.id)
    .order('exit_time', { ascending: false })

  const all = trades || []
  const st = computeStats(all as any)
  const equity = buildEquityCurve(all as any)
  const monthly = groupByMonth(all as any)

  const bySym: Record<string, number> = {}
  const bySess: Record<string, number> = {}
  all.forEach((t: any) => {
    bySym[t.symbol] = (bySym[t.symbol] || 0) + t.pnl
    if (t.session) bySess[t.session] = (bySess[t.session] || 0) + t.pnl
  })

  const symData = Object.entries(bySym).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ name: k, pnl: v }))
  const sessData = Object.entries(bySess).map(([k, v]) => ({ name: k, pnl: v }))

  const GAUGES = [
    { label: 'WIN RATE',      val: `${st.winRate.toFixed(1)}%`,   sub: 'WR',   detail: `${st.wins}W ${st.losses}L`,           pct: st.winRate,                       color: '#00d4a0' },
    { label: 'PROFIT FACTOR', val: st.profitFactor.toFixed(2),    sub: 'PF',   detail: 'Profit Factor',                       pct: Math.min(st.profitFactor/3*100,100), color: '#00b4e6' },
    { label: 'REWARD:RISK',   val: `${st.avgRR.toFixed(2)}:1`,    sub: 'R:R',  detail: `Avg Win $${st.avgWin.toFixed(0)} / Loss $${st.avgLoss.toFixed(0)}`, pct: Math.min(st.avgRR/3*100,100), color: '#f5a623' },
    { label: 'TOTAL P&L',     val: `${st.netPips >= 0 ? '+' : ''}${st.netPips.toFixed(1)}`, sub: 'PIPS', detail: `${st.total} trades`, pct: st.winRate, color: '#00d4a0' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Stat Gauges */}
      <div className="grid grid-cols-4 gap-3">
        {GAUGES.map((g, i) => (
          <div key={i} className="card-hover rounded-2xl border p-5 flex flex-col items-center relative overflow-hidden"
            style={{ background: '#151b25', borderColor: '#1e2d42' }}>
            {/* Glow bg */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
              style={{ background: `radial-gradient(circle at 50% 0%, ${g.color}12, transparent 60%)` }} />
            {/* Gauge SVG */}
            <div className="relative w-[100px] h-[80px] mb-2">
              <svg className="gauge-svg" width="100" height="80" viewBox="0 0 100 80" style={{ transform: 'rotate(-180deg)' }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1f2a3c" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2*Math.PI*42*.75} ${2*Math.PI*42}`}
                  strokeDashoffset={`${-2*Math.PI*42*.125}`} />
                <circle cx="50" cy="50" r="42" fill="none" stroke={g.color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2*Math.PI*42*.75*Math.min(100,Math.max(0,g.pct))/100} ${2*Math.PI*42}`}
                  strokeDashoffset={`${-2*Math.PI*42*.125}`}
                  className="gauge-fill" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <span className="text-xl font-extrabold font-mono tracking-tight leading-none" style={{ color: g.color }}>{g.val}</span>
                <span className="text-[9px] font-bold tracking-widest uppercase opacity-60" style={{ color: g.color }}>{g.sub}</span>
              </div>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-tx3">{g.label}</div>
            <div className="text-[11px] text-tx3 mt-0.5">{g.detail}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts equity={equity} monthly={monthly} symData={symData} sessData={sessData} trades={all as any} />

      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          ['Net P&L', fmtPnl(st.netPnl), st.netPnl >= 0 ? '#00d4a0' : '#e64040'],
          ['Expectancy', fmtPnl(st.expectancy) + '/trade', st.expectancy >= 0 ? '#00d4a0' : '#e64040'],
          ['Max Drawdown', `-${st.maxDrawdown.toFixed(2)}%`, '#e64040'],
          ['Best Trade', fmtPnl(st.best), '#00d4a0'],
        ].map(([l, v, c]) => (
          <div key={l} className="rounded-xl border p-4" style={{ background: '#151b25', borderColor: '#1e2d42' }}>
            <div className="text-[9.5px] font-bold uppercase tracking-widest text-tx3 mb-1.5">{l}</div>
            <div className="text-xl font-bold font-mono" style={{ color: c as string }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
