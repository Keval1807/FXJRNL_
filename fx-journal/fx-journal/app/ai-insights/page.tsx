// app/ai-insights/page.tsx
import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { computeStats, type Trade } from '@/types'

function generateInsights(trades: Trade[], st: ReturnType<typeof computeStats>) {
  if (!trades.length) return [{
    ico: '💡', title: 'Start Logging Trades', cat: 'Getting Started',
    content: 'Your journal is empty. Begin by logging your trades to unlock AI insights about your performance patterns, strengths, and areas for improvement.',
    tags: [{ t: 'Get Started', c: 'teal' }],
  }]

  const insights = []

  // Win rate
  const breakeven = 1 / (1 + st.avgRR) * 100
  if (st.winRate < 50) {
    insights.push({
      ico: '📊', title: `Win Rate ${st.winRate.toFixed(1)}% — Focus on Setup Quality`, cat: 'Performance',
      content: `Your current win rate is ${st.winRate.toFixed(1)}%. With your R:R of ${st.avgRR.toFixed(2)}, you need at least ${breakeven.toFixed(1)}% wins to break even. You are ${st.winRate < breakeven ? 'below' : 'above'} this threshold. Consider being more selective — only take A+ setups that fully meet your criteria before entering.`,
      tags: [{ t: 'Win Rate', c: st.winRate < breakeven ? 'rose' : 'teal' }, { t: 'Setup Selection', c: '' }, { t: 'Patience', c: '' }],
    })
  } else {
    insights.push({
      ico: '✅', title: `Strong Win Rate at ${st.winRate.toFixed(1)}%`, cat: 'Performance',
      content: `Your win rate of ${st.winRate.toFixed(1)}% is above 50%. Combined with an R:R of ${st.avgRR.toFixed(2)}:1, your edge in the market is statistically significant. Focus on maintaining consistency and avoid overtrading — quality over quantity.`,
      tags: [{ t: 'Win Rate', c: 'teal' }, { t: 'Consistency', c: '' }, { t: 'Edge', c: 'teal' }],
    })
  }

  // Best/worst symbol
  const bySym: Record<string, number> = {}
  trades.forEach(t => { bySym[t.symbol] = (bySym[t.symbol] || 0) + t.pnl })
  const sorted = Object.entries(bySym).sort((a, b) => b[1] - a[1])
  if (sorted.length >= 2) {
    const [best, worst] = [sorted[0], sorted[sorted.length - 1]]
    insights.push({
      ico: '🎯', title: `Best Pair: ${best[0]} — Worst: ${worst[0]}`, cat: 'Symbol Analysis',
      content: `You perform best on ${best[0]} (+$${best[1].toFixed(2)}) and worst on ${worst[0]} ($${worst[1].toFixed(2)}). Consider focusing capital on ${best[0]} and reviewing your approach to ${worst[0]}. Sometimes a pair simply doesn't suit your strategy style — it is better to remove it from your watchlist.`,
      tags: [{ t: best[0], c: 'teal' }, { t: worst[0] + ' (review)', c: 'rose' }, { t: 'Focus', c: '' }],
    })
  }

  // R:R coaching
  insights.push({
    ico: '⚡', title: `R:R ${st.avgRR.toFixed(2)}:1 — ${st.avgRR >= 2 ? 'Excellent' : st.avgRR >= 1 ? 'Needs Improvement' : 'Critical'}`, cat: 'Risk Management',
    content: st.avgRR >= 2
      ? `Excellent R:R of ${st.avgRR.toFixed(2)}:1. At this ratio you can be profitable with a win rate as low as ${(1/(1+st.avgRR)*100).toFixed(1)}%. Keep letting winners run and cutting losers early. Your avg win ($${st.avgWin.toFixed(2)}) vs avg loss ($${st.avgLoss.toFixed(2)}) shows solid discipline.`
      : `Your R:R of ${st.avgRR.toFixed(2)}:1 needs improvement. Aim for at least 2:1. This means your average winner should be 2× your average loser. Current avg win: $${st.avgWin.toFixed(2)} vs avg loss: $${st.avgLoss.toFixed(2)}. Try moving TP further or tightening your stop loss.`,
    tags: [{ t: `R:R ${st.avgRR.toFixed(2)}`, c: st.avgRR >= 2 ? 'teal' : 'rose' }, { t: 'Risk', c: '' }, { t: 'Position Sizing', c: '' }],
  })

  // Profit factor
  insights.push({
    ico: '📈', title: `Profit Factor ${st.profitFactor.toFixed(2)}`, cat: 'Profitability',
    content: st.profitFactor >= 2
      ? `Outstanding profit factor of ${st.profitFactor.toFixed(2)} — for every $1 lost you make $${st.profitFactor.toFixed(2)}. This is an institutional-grade edge. Protect it by staying disciplined and not overtrading.`
      : st.profitFactor >= 1.5
      ? `Good profit factor of ${st.profitFactor.toFixed(2)}. You have a solid edge. Consistently above 1.5 indicates a reliable strategy. Focus on position sizing to grow your account safely.`
      : st.profitFactor >= 1
      ? `Profit factor of ${st.profitFactor.toFixed(2)} — you are profitable but the edge is thin. Review your entries to find what separates winning vs losing trades. Aim to improve this to 1.5+.`
      : `Profit factor below 1 (${st.profitFactor.toFixed(2)}) means you are losing money overall. Stop trading live and review your last 20 trades. Identify the pattern in your losers and eliminate those setups.`,
    tags: [{ t: `PF ${st.profitFactor.toFixed(2)}`, c: st.profitFactor >= 1.5 ? 'teal' : 'rose' }, { t: 'Strategy', c: '' }],
  })

  // Emotion analysis if data available
  const byEmo: Record<string, { wins: number; count: number }> = {}
  trades.forEach(t => {
    if (!t.emotion_tag) return
    if (!byEmo[t.emotion_tag]) byEmo[t.emotion_tag] = { wins: 0, count: 0 }
    byEmo[t.emotion_tag].count++
    if (t.pnl > 0) byEmo[t.emotion_tag].wins++
  })
  const emoEntries = Object.entries(byEmo).filter(([, v]) => v.count >= 2)
  if (emoEntries.length) {
    const best = emoEntries.sort((a, b) => b[1].wins/b[1].count - a[1].wins/a[1].count)[0]
    const worst = emoEntries.sort((a, b) => a[1].wins/a[1].count - b[1].wins/b[1].count)[0]
    insights.push({
      ico: '🧠', title: 'Psychology Pattern Detected', cat: 'Psychology',
      content: `Your best emotional state is ${best[0]} with ${(best[1].wins/best[1].count*100).toFixed(0)}% win rate (${best[1].count} trades). Your worst is ${worst[0]} with ${(worst[1].wins/worst[1].count*100).toFixed(0)}% win rate. Avoid trading when you feel ${worst[0].replace(/[^\w ]/g,'').trim()} — consider stepping away and waiting for a better mental state before entering trades.`,
      tags: [{ t: best[0], c: 'teal' }, { t: worst[0] + ' (avoid)', c: 'rose' }, { t: 'Psychology', c: 'purple' }],
    })
  }

  // Drawdown warning
  if (st.maxDrawdown > 10) {
    insights.push({
      ico: '⚠️', title: `Max Drawdown ${st.maxDrawdown.toFixed(1)}% — Risk Alert`, cat: 'Risk Management',
      content: `Your maximum drawdown of ${st.maxDrawdown.toFixed(1)}% is significant. For a prop firm challenge, this could be dangerous. Consider reducing lot sizes until you recover. Never risk more than 0.5–1% per trade during a drawdown period. The goal is survival first, then growth.`,
      tags: [{ t: 'Drawdown', c: 'rose' }, { t: 'Risk Control', c: '' }, { t: 'Prop Firm', c: '' }],
    })
  }

  return insights
}

const TAG_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  teal:   { bg: 'rgba(0,212,160,.12)',  border: 'rgba(0,212,160,.3)',  text: '#00d4a0' },
  rose:   { bg: 'rgba(230,64,64,.12)',  border: 'rgba(230,64,64,.3)',  text: '#e64040' },
  purple: { bg: 'rgba(155,109,255,.12)',border: 'rgba(155,109,255,.3)',text: '#9b6dff' },
  '':     { bg: '#1f2a3c',              border: '#263650',             text: '#7a90b0' },
}

export default async function AIInsightsPage() {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  const { data: trades } = await supabase
    .from('trades').select('*').eq('user_id', session.user.id)

  const all = (trades || []) as Trade[]
  const st = computeStats(all)
  const insights = generateInsights(all, st)

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-bold">AI Insights</h1>
        <span className="text-[9px] font-bold px-2.5 py-1 rounded-full border"
          style={{ background:'rgba(155,109,255,.12)', borderColor:'rgba(155,109,255,.3)', color:'#9b6dff', letterSpacing:'.5px' }}>
          ✦ POWERED BY AI
        </span>
        <span className="text-xs text-tx3">{all.length} trades analysed</span>
      </div>

      {insights.map((ins, i) => (
        <div key={i} className="rounded-2xl border p-5 relative overflow-hidden fade-up" style={{ background:'#151b25', borderColor:'#1e2d42', animationDelay:`${i*0.08}s` }}>
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background:'linear-gradient(90deg, transparent, #9b6dff, transparent)' }} />
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
              style={{ background:'rgba(155,109,255,.12)', border:'1px solid rgba(155,109,255,.25)' }}>
              {ins.ico}
            </div>
            <div>
              <div className="font-bold text-sm">{ins.title}</div>
              <div className="text-xs text-tx3 mt-0.5">{ins.cat}</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-tx2 mb-3">{ins.content}</p>
          <div className="flex flex-wrap gap-1.5">
            {ins.tags.map((tag, j) => {
              const col = TAG_COLORS[tag.c] || TAG_COLORS['']
              return (
                <span key={j} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
                  style={{ background:col.bg, borderColor:col.border, color:col.text }}>
                  {tag.t}
                </span>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
