'use client'
// app/plan/page.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const DEFAULT_PLAN = `# My Trading Plan

## Account Rules
- Max daily loss: 3% of account
- Max total drawdown: 6%
- Min R:R per trade: 2:1
- Max open positions: 3
- Max trades per day: 3

## Entry Criteria
- Only trade A+ setups with confluence
- Must have a clear SL level before entering
- Wait for candle close confirmation
- Must align with HTF bias

## Preferred Pairs
- EURUSD (primary)
- GBPUSD (primary)
- XAUUSD (secondary)

## Sessions
- London Open: 07:00 – 10:00 GMT
- NY Open: 13:00 – 16:00 GMT
- Avoid Asian session (low volume)

## Risk Management
- Risk 0.5% per trade (prop firm)
- Scale out: 40% at 1R, 30% at 2R, 20% at 3R, 10% runner
- Move SL to breakeven at 1R

## Mental Rules
- No revenge trading after 2 losses in a row
- Take a 15 min break after any losing trade
- Review each trade immediately after close
- Sunday: full weekly review
- No trading when tired, sick, or emotional`

export default function PlanPage() {
  const supabase = createClient()
  const [plan, setPlan] = useState(DEFAULT_PLAN)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('plan_text').eq('id', user.id).single()
      if (data?.plan_text) setPlan(data.plan_text)
    }
    load()
  }, [])

  async function savePlan() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').upsert({ id: user.id, plan_text: plan, updated_at: new Date().toISOString() })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Trading Plan</h1>
        <button onClick={savePlan} disabled={saving}
          className="px-5 py-2 rounded-lg font-bold text-sm text-black disabled:opacity-60"
          style={{ background:'linear-gradient(135deg,#00d4a0,#00b4e6)', boxShadow:'0 4px 14px rgba(0,212,160,.3)' }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Plan'}
        </button>
      </div>
      <div className="rounded-2xl border p-5" style={{ background:'#151b25', borderColor:'#1e2d42' }}>
        <p className="text-xs text-tx3 mb-3">Write your trading rules in Markdown. This is your reference document — read it every morning before trading.</p>
        <textarea
          value={plan}
          onChange={e => setPlan(e.target.value)}
          className="input-field w-full rounded-xl px-4 py-3 text-sm border leading-relaxed font-mono"
          style={{ background:'#1a2232', borderColor:'#263650', color:'#c8d8f0', resize:'vertical', minHeight:520 }}
        />
      </div>
    </div>
  )
}
