'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Mistake } from '@/types'
import { computeStats } from '@/lib/utils'

const DEFAULT_MISTAKES: Partial<Mistake>[] = [
  { name: 'Entering Too Early', category: 'Patience', color: '#e64040', description: 'Taking a trade before the setup fully forms. Wait for candle close and confirmation at key level.' },
  { name: 'Moving Stop Loss', category: 'Discipline', color: '#f5a623', description: 'Moving SL further away when price approaches it. Let your stops do their job — respect the plan.' },
  { name: 'Revenge Trading', category: 'Psychology', color: '#9b6dff', description: 'Taking impulsive trades after a loss to recover. Stick to the plan. One loss does not define the session.' },
  { name: 'Overtrading', category: 'Discipline', color: '#e64040', description: 'Taking too many setups in a session. Quality over quantity. Max 2-3 trades per day.' },
  { name: 'Ignoring Higher TF', category: 'Analysis', color: '#f5a623', description: 'Trading against the higher timeframe trend. Always check HTF context before lower TF entries.' },
  { name: 'FOMO Entry', category: 'Psychology', color: '#9b6dff', description: 'Entering a trade after the move has already happened. If you missed it, wait for the next setup.' },
]

function MistakesContent({ mistakes: initial, tradeCount, userEmail }: { mistakes: Mistake[], tradeCount: number, userEmail: string }) {
  const supabase = createClient()
  const { toast } = useToast()
  const [mistakes, setMistakes] = useState(initial)

  async function logOccurrence(id: string) {
    const m = mistakes.find(x => x.id === id)!
    await supabase.from('mistakes').update({ occurrence_count: m.occurrence_count + 1 }).eq('id', id)
    setMistakes(ms => ms.map(x => x.id === id ? { ...x, occurrence_count: x.occurrence_count + 1 } : x))
    toast(`Logged: ${m.name}`, 'r')
  }

  async function seedDefaults() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('mistakes').insert(DEFAULT_MISTAKES.map(m => ({ ...m, user_id: user.id, occurrence_count: 0 }))).select()
    if (data) setMistakes(data)
    toast('Default mistakes loaded', 'g')
  }

  async function resetCount(id: string) {
    await supabase.from('mistakes').update({ occurrence_count: 0 }).eq('id', id)
    setMistakes(ms => ms.map(x => x.id === id ? { ...x, occurrence_count: 0 } : x))
  }

  const maxCount = Math.max(...mistakes.map(m => m.occurrence_count), 1)

  return (
    <AppShell stats={computeStats([])} userEmail={userEmail} tradeCount={tradeCount} pageTitle="Mistakes">
      {mistakes.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3 opacity-30">⚠️</div>
          <p className="text-tx3 text-sm mb-4">Track your recurring mistakes to identify patterns and eliminate bad habits.</p>
          <button className="btn-primary text-xs py-1.5 px-4" onClick={seedDefaults}>Load Default Mistakes</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {mistakes.map(m => (
            <div key={m.id} className="card p-5" style={{ borderLeft: `3px solid ${m.color}` }}>
              <div className="flex items-start justify-between mb-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide border"
                  style={{ background: m.color + '18', color: m.color, borderColor: m.color + '44' }}>
                  {m.category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-tx3">
                    Occurred: <strong style={{ color: m.color }}>{m.occurrence_count}</strong>
                  </span>
                  <button onClick={() => resetCount(m.id)} className="text-[10px] text-tx4 hover:text-tx3">↺</button>
                </div>
              </div>
              <h3 className="font-bold text-sm mb-2">{m.name}</h3>
              <p className="text-xs text-tx2 leading-relaxed mb-3">{m.description}</p>
              {/* Frequency bar */}
              <div className="mb-3">
                <div className="h-1.5 bg-bg3 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(m.occurrence_count / maxCount) * 100}%`, background: m.color }} />
                </div>
              </div>
              <button onClick={() => logOccurrence(m.id)} className="w-full py-1.5 rounded-lg text-[11px] font-bold border transition-all"
                style={{ background: m.color + '18', borderColor: m.color + '44', color: m.color }}>
                + Log Occurrence
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}

export default function MistakesClient(props: { mistakes: Mistake[], tradeCount: number, userEmail: string }) {
  return <ToastProvider><MistakesContent {...props} /></ToastProvider>
}
