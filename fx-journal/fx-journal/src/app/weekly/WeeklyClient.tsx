'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Trade, WeeklyReview } from '@/types'
import { computeStats, fmt, fmtPips } from '@/lib/utils'

function WeeklyContent({ trades, userEmail, weekStart, review: initReview }: { trades: Trade[], userEmail: string, weekStart: string, review: WeeklyReview | null }) {
  const supabase = createClient()
  const { toast } = useToast()
  const allStats = computeStats(trades)
  const weekTrades = trades.filter(t => (t.exit_time || t.created_at) >= weekStart)
  const weekStats = computeStats(weekTrades)
  const [notes, setNotes] = useState(initReview?.notes || '')
  const [sleep, setSleep] = useState(initReview?.sleep_quality || 3)
  const [stress, setStress] = useState(initReview?.stress_level || 3)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('weekly_reviews').upsert({ user_id: user.id, week_start: weekStart, notes, sleep_quality: sleep, stress_level: stress }, { onConflict: 'user_id,week_start' })
    toast('Weekly review saved', 'g')
    setSaving(false)
  }

  const weekLabel = new Date(weekStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const RATING = (val: number, set: (n: number) => void, label: string, color: string) => (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2">
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => set(n)}
            className="w-8 h-8 rounded-lg border text-xs font-bold transition-all"
            style={val >= n ? { background: color + '25', borderColor: color, color } : { background: 'var(--bg3)', borderColor: 'var(--border2)', color: 'var(--tx4)' }}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <AppShell stats={allStats} userEmail={userEmail} tradeCount={trades.length} pageTitle="Weekly Review"
      action={<button className="btn-primary text-xs py-1.5 px-4" onClick={save} disabled={saving}>{saving ? 'Saving…' : '💾 Save Review'}</button>}>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Weekly Review</h2>
        <span className="text-xs text-tx3 font-mono">Week of {weekLabel}</span>
      </div>

      {/* This week stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          ['Trades', weekStats.total, ''],
          ['Win Rate', `${weekStats.winRate.toFixed(1)}%`, weekStats.winRate >= 50 ? 'text-green' : 'text-red'],
          ['Net P&L', fmt(weekStats.netPnl), weekStats.netPnl >= 0 ? 'text-green' : 'text-red'],
          ['Net Pips', fmtPips(weekStats.netPips), weekStats.netPips >= 0 ? 'text-green' : 'text-red'],
        ].map(([l, v, c]) => (
          <div key={String(l)} className="stat-card">
            <div className="stat-label">{l}</div>
            <div className={`stat-value ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* This week's trades */}
        <div className="card p-4">
          <div className="section-title">This Week's Trades</div>
          {weekTrades.length ? (
            <div className="overflow-auto max-h-48">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-bg3">
                    {['Date','Symbol','Side','P&L'].map(h => <th key={h} className="px-2 py-1.5 text-left text-[9px] font-bold uppercase text-tx3">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {weekTrades.map(t => (
                    <tr key={t.id} className="border-b border-border/40 hover:bg-bg3">
                      <td className="px-2 py-1.5 font-mono text-tx3">{t.exit_time?.split('T')[0]}</td>
                      <td className="px-2 py-1.5 font-bold">{t.symbol}</td>
                      <td className="px-2 py-1.5"><span className={t.side === 'BUY' ? 'pill-buy' : 'pill-sell'}>{t.side}</span></td>
                      <td className={`px-2 py-1.5 font-mono font-bold ${t.pnl >= 0 ? 'text-green' : 'text-red'}`}>{t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-tx3 text-xs py-6 text-center">No trades this week</p>}
        </div>

        {/* Ratings */}
        <div className="card p-4 space-y-4">
          <div className="section-title">Day Ratings</div>
          {RATING(sleep, setSleep, 'Sleep Quality', '#00d4a0')}
          {RATING(stress, setStress, 'Stress Level (1=low)', '#e64040')}
        </div>
      </div>

      {/* Notes */}
      <div className="card p-4">
        <div className="section-title">Weekly Notes</div>
        <textarea
          className="w-full h-48 bg-bg3 border border-border2 rounded-xl p-4 text-sm text-tx font-mono resize-none focus:outline-none focus:border-green transition-colors leading-relaxed"
          placeholder={`What went well this week?\nWhat needs improvement?\nKey lessons learned?\nWhat will you do differently next week?`}
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>
    </AppShell>
  )
}

export default function WeeklyClient(props: { trades: Trade[], userEmail: string, weekStart: string, review: WeeklyReview | null }) {
  return <ToastProvider><WeeklyContent {...props} /></ToastProvider>
}
