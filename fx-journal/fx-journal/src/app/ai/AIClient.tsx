'use client'
import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { Trade } from '@/types'
import { computeStats, getPnLBySymbol, getPnLBySession, getPnLByEmotion } from '@/lib/utils'

interface Insight {
  icon: string
  title: string
  category: string
  content: string
  tags: { text: string; type: 'green' | 'red' | 'purple' | 'neutral' }[]
}

function generateInsights(trades: Trade[]): Insight[] {
  if (!trades.length) return [{
    icon: '💡', title: 'Start Logging Trades', category: 'Getting Started',
    content: 'Your journal is empty. Begin logging your trades to unlock personalized AI-powered insights about your performance patterns, psychological tendencies, and areas for improvement.',
    tags: [{ text: 'Get Started', type: 'green' }]
  }]

  const st = computeStats(trades)
  const insights: Insight[] = []

  // Win rate
  const breakeven = (1 / (1 + st.avgRR) * 100).toFixed(1)
  insights.push({
    icon: '📊', title: `Win Rate: ${st.winRate.toFixed(1)}%`,
    category: 'Performance Analysis',
    content: st.winRate >= 50
      ? `Your win rate of ${st.winRate.toFixed(1)}% is above 50% — excellent trade selection. With your R:R of ${st.avgRR.toFixed(2)}, you need only ${breakeven}% wins to break even, so you have substantial margin. Focus on maintaining consistency.`
      : `Your win rate of ${st.winRate.toFixed(1)}% is below 50%. However, with an R:R of ${st.avgRR.toFixed(2)}, your breakeven win rate is ${breakeven}%. ${st.winRate > parseFloat(breakeven) ? 'You are still profitable.' : 'You need to improve either win rate or R:R.'} Consider being more selective — only take A+ setups.`,
    tags: [
      { text: `WR ${st.winRate.toFixed(1)}%`, type: st.winRate >= 50 ? 'green' : 'red' },
      { text: 'Setup Selection', type: 'neutral' },
    ]
  })

  // R:R
  insights.push({
    icon: '⚡', title: `Reward:Risk at ${st.avgRR.toFixed(2)}:1`,
    category: 'Risk Management',
    content: st.avgRR >= 2
      ? `Excellent R:R of ${st.avgRR.toFixed(2)}:1. At this level, you remain profitable with as low as ${breakeven}% win rate. Your average win ($${st.avgWin.toFixed(2)}) significantly outpaces your average loss ($${st.avgLoss.toFixed(2)}). Keep letting your winners run.`
      : `Your R:R of ${st.avgRR.toFixed(2)}:1 is ${st.avgRR >= 1 ? 'acceptable but can be improved' : 'below 1:1 — this is a significant concern'}. Aim for 2:1 minimum. This means: cut losses faster, or let winners run longer. Never move your stop loss further away from entry.`,
    tags: [
      { text: `R:R ${st.avgRR.toFixed(2)}`, type: st.avgRR >= 2 ? 'green' : st.avgRR >= 1 ? 'neutral' : 'red' },
      { text: 'Position Sizing', type: 'neutral' },
    ]
  })

  // Profit factor
  insights.push({
    icon: '📈', title: `Profit Factor: ${st.profitFactor.toFixed(2)}`,
    category: 'Profitability',
    content: st.profitFactor >= 2
      ? `Outstanding PF of ${st.profitFactor.toFixed(2)} — for every $1 you lose, you make $${st.profitFactor.toFixed(2)}. This is a statistically strong edge. Focus on scaling your strategy without changing what's working.`
      : st.profitFactor >= 1.5
      ? `Good PF of ${st.profitFactor.toFixed(2)}. You have a real edge in the market. Reduce the number of low-quality trades to push this above 2.0.`
      : st.profitFactor >= 1
      ? `PF of ${st.profitFactor.toFixed(2)} means you are marginally profitable. Significant improvement needed. Review your worst 5 trades and find what they have in common.`
      : `PF of ${st.profitFactor.toFixed(2)} means you are losing money. Stop trading immediately and back-test your strategy before continuing.`,
    tags: [
      { text: `PF ${st.profitFactor.toFixed(2)}`, type: st.profitFactor >= 1.5 ? 'green' : st.profitFactor >= 1 ? 'neutral' : 'red' },
      { text: 'Edge', type: 'neutral' },
    ]
  })

  // Best/worst symbol
  const bySymbol = getPnLBySymbol(trades)
  if (bySymbol.length >= 2) {
    const best = bySymbol[0]
    const worst = bySymbol[bySymbol.length - 1]
    insights.push({
      icon: '🎯', title: `Best Pair: ${best.symbol}`,
      category: 'Symbol Analysis',
      content: `Your best performing pair is ${best.symbol} (+$${best.pnl.toFixed(2)} over ${best.count} trades). Your worst is ${worst.symbol} ($${worst.pnl.toFixed(2)}). Consider allocating more focus to ${best.symbol} and cutting ${worst.pnl < -100 ? worst.symbol + ' from your watchlist entirely' : 'position size on ' + worst.symbol} until you identify why it underperforms.`,
      tags: [
        { text: best.symbol, type: 'green' },
        { text: `${worst.symbol} (review)`, type: 'red' },
      ]
    })
  }

  // Emotion analysis
  const byEmotion = getPnLByEmotion(trades)
  const badEmotions = byEmotion.filter(e => e.pnl < 0 && e.emotion !== 'Untagged')
  if (badEmotions.length) {
    insights.push({
      icon: '🧠', title: 'Psychology Patterns Detected',
      category: 'Psychology',
      content: `Trades tagged with "${badEmotions[0].emotion}" have a combined loss of $${Math.abs(badEmotions[0].pnl).toFixed(2)} (${badEmotions[0].winRate}% win rate). This emotional state is costing you money. When you feel "${badEmotions[0].emotion.split(' ').slice(1).join(' ')}", consider sitting out or reducing position size to minimum.`,
      tags: [
        { text: badEmotions[0].emotion, type: 'red' },
        { text: 'Psychology', type: 'purple' },
      ]
    })
  }

  // Max drawdown warning
  if (st.maxDrawdown > 5) {
    insights.push({
      icon: '⚠️', title: `Max Drawdown: ${st.maxDrawdown.toFixed(2)}%`,
      category: 'Risk Warning',
      content: `Your max drawdown of ${st.maxDrawdown.toFixed(2)}% ${st.maxDrawdown > 10 ? 'is dangerously high for a prop firm challenge' : 'is elevated'}. With a 6% max total drawdown rule, you ${st.maxDrawdown > 6 ? 'would have already blown a prop challenge' : 'are getting close to danger zones'}. Consider implementing a hard daily loss limit of 1% and stopping for the day if hit.`,
      tags: [
        { text: `DD ${st.maxDrawdown.toFixed(2)}%`, type: 'red' },
        { text: 'Prop Challenge', type: 'neutral' },
      ]
    })
  }

  return insights
}

export default function AIClient({ trades, userEmail }: { trades: Trade[], userEmail: string }) {
  const stats = computeStats(trades)
  const insights = generateInsights(trades)
  const TAG_COLORS = { green: 'bg-green/10 border-green/30 text-green', red: 'bg-red/10 border-red/30 text-red', purple: 'bg-purple/10 border-purple/30 text-purple', neutral: 'bg-bg4 border-border2 text-tx3' }

  return (
    <ToastProvider>
      <AppShell stats={stats} userEmail={userEmail} tradeCount={trades.length} pageTitle="AI Insights">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-bold">AI Insights</h2>
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-purple/15 border border-purple/30 text-purple tracking-wide">
            POWERED BY AI
          </span>
          <span className="ml-auto text-xs text-tx3">{trades.length} trades analysed</span>
        </div>

        <div className="space-y-4">
          {insights.map((ins, i) => (
            <div key={i} className="card p-5 relative overflow-hidden">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple to-transparent" />
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-purple/15 border border-purple/25 flex items-center justify-center text-lg flex-shrink-0">
                  {ins.icon}
                </div>
                <div>
                  <div className="font-bold text-sm">{ins.title}</div>
                  <div className="text-[10px] text-tx3 mt-0.5">{ins.category}</div>
                </div>
              </div>
              <p className="text-[12.5px] text-tx2 leading-relaxed mb-3">{ins.content}</p>
              <div className="flex flex-wrap gap-2">
                {ins.tags.map((t, j) => (
                  <span key={j} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${TAG_COLORS[t.type]}`}>
                    {t.text}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AppShell>
    </ToastProvider>
  )
}
