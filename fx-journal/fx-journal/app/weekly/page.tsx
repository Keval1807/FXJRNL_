'use client'
// app/weekly/page.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { computeStats, type Trade } from '@/types'
import { startOfWeek, endOfWeek, format } from 'date-fns'

export default function WeeklyPage() {
  const supabase = createClient()
  const [trades, setTrades] = useState<Trade[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: tr } = await supabase.from('trades').select('*').eq('user_id', user.id)
        .gte('exit_time', weekStart.toISOString()).lte('exit_time', weekEnd.toISOString())
      setTrades((tr || []) as Trade[])
      const { data: wr } = await supabase.from('weekly_reviews').select('notes').eq('user_id', user.id).eq('week_start', weekStartStr).single()
      if (wr) setNotes(wr.notes || '')
    }
    load()
  }, [])

  async function saveNotes() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('weekly_reviews').upsert({ user_id: user.id, week_start: weekStartStr, notes }, { onConflict: 'user_id,week_start' })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const st = computeStats(trades)

  const STATS = [
    ['Trades', st.total, ''],
    ['Win Rate', `${st.winRate.toFixed(1)}%`, st.winRate >= 50 ? '#00d4a0' : '#e64040'],
    ['Net P&L', `${st.netPnl >= 0 ? '+' : ''}$${st.netPnl.toFixed(2)}`, st.netPnl >= 0 ? '#00d4a0' : '#e64040'],
    ['Net Pips', `${st.netPips >= 0 ? '+' : ''}${st.netPips.toFixed(1)}`, st.netPips >= 0 ? '#00d4a0' : '#e64040'],
  ]

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Weekly Review</h1>
        <span className="text-xs text-tx3 font-mono">
          {format(weekStart,'dd MMM')} – {format(weekEnd,'dd MMM yyyy')}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {STATS.map(([l, v, c]) => (
          <div key={l as string} className="rounded-xl border p-4" style={{ background:'#151b25', borderColor:'#1e2d42' }}>
            <div className="text-[9.5px] font-bold uppercase tracking-widest text-tx3 mb-2">{l}</div>
            <div className="text-xl font-bold font-mono" style={{ color: (c as string) || '#c8d8f0' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* This week trades */}
      <div className="rounded-2xl border" style={{ background:'#151b25', borderColor:'#1e2d42' }}>
        <div className="px-4 py-3 border-b text-[11px] font-bold uppercase tracking-widest text-tx3" style={{ borderColor:'#1e2d42' }}>
          This Week&apos;s Trades ({trades.length})
        </div>
        {!trades.length ? (
          <div className="flex items-center justify-center py-8 text-tx3 text-xs italic">No trades this week</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor:'#1e2d42' }}>
                  {['Date','Symbol','Side','P&L','Setup','Emotion'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[9.5px] font-bold uppercase tracking-widest text-tx3"
                      style={{ background:'#1a2232' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t.id} className="table-row border-b" style={{ borderColor:'rgba(30,45,66,.4)' }}>
                    <td className="px-3 py-2 font-mono text-[11px] text-tx3">{t.exit_time?.split('T')[0]}</td>
                    <td className="px-3 py-2 font-bold text-sm">{t.symbol}</td>
                    <td className="px-3 py-2">
                      <span className={`pill ${t.side==='BUY' ? 'bg-teal/10 text-teal border-teal/20 border' : 'bg-rose/10 text-rose border-rose/20 border'}`}>
                        {t.side}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono font-bold text-sm" style={{ color:t.pnl>=0?'#00d4a0':'#e64040' }}>
                      {t.pnl>=0?'+':''}${t.pnl?.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-xs text-tx2">{t.setup_tag || '—'}</td>
                    <td className="px-3 py-2 text-sm">{t.emotion_tag || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-2xl border p-5" style={{ background:'#151b25', borderColor:'#1e2d42' }}>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-tx3 mb-3">Weekly Reflection Notes</h3>
        <textarea
          rows={7}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="What went well this week?&#10;What needs improvement?&#10;Key lessons learned?&#10;Goals for next week?"
          className="input-field w-full rounded-xl px-4 py-3 text-sm border leading-relaxed"
          style={{ background:'#1a2232', borderColor:'#263650', color:'#c8d8f0', resize:'vertical' }}
        />
        <div className="flex justify-end mt-3">
          <button onClick={saveNotes} disabled={saving}
            className="px-5 py-2 rounded-lg font-bold text-sm text-black disabled:opacity-60"
            style={{ background:'linear-gradient(135deg,#00d4a0,#00b4e6)' }}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  )
}
