// app/analytics/page.tsx
import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { computeStats } from '@/types'
import { buildEquityCurve, groupByMonth, groupByDay } from '@/lib/utils'
import AnalyticsCharts from '@/components/charts/AnalyticsCharts'

export default async function AnalyticsPage() {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', session.user.id)
    .order('exit_time', { ascending: true })

  const all = trades || []
  const st = computeStats(all as any)
  const equity = buildEquityCurve(all as any)
  const monthly = groupByMonth(all as any)
  const dailyMap = groupByDay(all as any)

  const byEmotion: Record<string, { pnl: number; count: number }> = {}
  const bySetup: Record<string, { pnl: number; count: number; wins: number }> = {}
  const byDow: Record<string, { pnl: number; count: number }> = {}
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  all.forEach((t: any) => {
    if (t.emotion_tag) {
      if (!byEmotion[t.emotion_tag]) byEmotion[t.emotion_tag] = { pnl: 0, count: 0 }
      byEmotion[t.emotion_tag].pnl += t.pnl
      byEmotion[t.emotion_tag].count++
    }
    if (t.setup_tag) {
      if (!bySetup[t.setup_tag]) bySetup[t.setup_tag] = { pnl: 0, count: 0, wins: 0 }
      bySetup[t.setup_tag].pnl += t.pnl
      bySetup[t.setup_tag].count++
      if (t.pnl > 0) bySetup[t.setup_tag].wins++
    }
    const d = DAYS[new Date(t.exit_time).getUTCDay()]
    if (!byDow[d]) byDow[d] = { pnl: 0, count: 0 }
    byDow[d].pnl += t.pnl; byDow[d].count++
  })

  const emotionData = Object.entries(byEmotion).map(([k, v]) => ({ name: k, pnl: v.pnl, count: v.count }))
  const setupData = Object.entries(bySetup).map(([k, v]) => ({ name: k, pnl: v.pnl, wr: v.count ? v.wins/v.count*100 : 0 }))
  const dowData = DAYS.map(d => ({ name: d, pnl: byDow[d]?.pnl || 0, count: byDow[d]?.count || 0 }))

  const STATS = [
    ['Total Trades', st.total, ''],
    ['Win Rate', st.winRate.toFixed(1) + '%', st.winRate >= 50 ? 'teal' : 'rose'],
    ['Profit Factor', st.profitFactor.toFixed(2), st.profitFactor >= 1.5 ? 'teal' : st.profitFactor >= 1 ? 'amber' : 'rose'],
    ['Avg R:R', st.avgRR.toFixed(2) + ':1', st.avgRR >= 2 ? 'teal' : 'amber'],
    ['Net P&L', `${st.netPnl >= 0 ? '+' : ''}$${st.netPnl.toFixed(2)}`, st.netPnl >= 0 ? 'teal' : 'rose'],
    ['Avg Win', `$${st.avgWin.toFixed(2)}`, 'teal'],
    ['Avg Loss', `-$${st.avgLoss.toFixed(2)}`, 'rose'],
    ['Max Drawdown', `-${st.maxDrawdown.toFixed(2)}%`, 'rose'],
    ['Expectancy', `${st.expectancy >= 0 ? '+' : ''}$${st.expectancy.toFixed(2)}`, st.expectancy >= 0 ? 'teal' : 'rose'],
    ['Best Trade', `+$${st.best.toFixed(2)}`, 'teal'],
    ['Worst Trade', `$${st.worst.toFixed(2)}`, 'rose'],
    ['Net Pips', `${st.netPips >= 0 ? '+' : ''}${st.netPips.toFixed(1)}`, st.netPips >= 0 ? 'teal' : 'rose'],
  ]

  const COLS: Record<string, string> = { teal:'#00d4a0', rose:'#e64040', amber:'#f5a623', '':'#c8d8f0' }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-6 gap-2.5">
        {STATS.map(([l, v, c]) => (
          <div key={l as string} className="rounded-xl border p-3" style={{ background:'#151b25', borderColor:'#1e2d42' }}>
            <div className="text-[9px] font-bold uppercase tracking-widest text-tx3 mb-1.5">{l}</div>
            <div className="text-lg font-bold font-mono" style={{ color: COLS[c as string] }}>{v}</div>
          </div>
        ))}
      </div>

      <AnalyticsCharts
        equity={equity} monthly={monthly} dailyMap={dailyMap}
        emotionData={emotionData} setupData={setupData} dowData={dowData}
      />
    </div>
  )
}
