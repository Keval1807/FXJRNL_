'use client'
import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase'
import { computeStats } from '@/lib/utils'

const DEFAULT_PLAN = `# My Trading Plan

## Account Rules
- Max daily loss: 3% of account ($3,000 on $100K)
- Max total drawdown: 6%
- Min R:R per trade: 2:1
- Max open positions: 3
- Max lot size: 1.0

## Entry Criteria
- Only take A+ setups with at least 2 confluences
- Must have clear SL level before entering
- Wait for candle close confirmation
- Trade in direction of higher timeframe trend

## Preferred Pairs
- EURUSD (primary)
- GBPUSD (primary)
- XAUUSD (secondary — high volatility)

## Sessions
- London Open: 07:00 - 10:00 GMT
- New York Open: 13:00 - 16:00 GMT
- Avoid Asian session (low liquidity)

## Exit Rules
- Close 50% at 1:1 R:R, move SL to breakeven
- Let remaining 50% run to 2:1 or trail stop
- Hard cut all positions by Friday 18:00 GMT

## Psychology Rules
- Stop trading after 2 consecutive losses
- Take 30 min break after hitting daily target
- No trading Monday first hour (news volatility)
- Review all trades every Sunday

## Weekly Targets
- Profit target: $500/day, $2000/week
- Consistency rule: no single trade > 15% of week gains
`

function PlanContent({ tradeCount, userEmail, initialContent }: { tradeCount: number, userEmail: string, initialContent: string }) {
  const supabase = createClient()
  const { toast } = useToast()
  const [content, setContent] = useState(initialContent || DEFAULT_PLAN)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('plan_notes').upsert({ user_id: user.id, content, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    toast('Trading plan saved', 'g')
    setSaving(false)
  }

  return (
    <AppShell stats={computeStats([])} userEmail={userEmail} tradeCount={tradeCount} pageTitle="My Plan"
      action={
        <button className="btn-primary text-xs py-1.5 px-4" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : '💾 Save Plan'}
        </button>
      }>
      <div className="card p-5 h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="section-title mb-0">Trading Plan</div>
          <span className="text-xs text-tx3">Markdown supported</span>
        </div>
        <textarea
          className="w-full h-[calc(100vh-240px)] bg-bg3 border border-border2 rounded-xl p-4 text-sm text-tx font-mono resize-none focus:outline-none focus:border-green transition-colors leading-relaxed"
          value={content}
          onChange={e => setContent(e.target.value)}
          spellCheck={false}
        />
      </div>
    </AppShell>
  )
}

export default function PlanClient(props: { tradeCount: number, userEmail: string, initialContent: string }) {
  return <ToastProvider><PlanContent {...props} /></ToastProvider>
}
