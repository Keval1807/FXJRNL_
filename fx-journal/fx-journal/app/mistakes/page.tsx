'use client'
// app/mistakes/page.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const DEFAULT_MISTAKES = [
  { name:'Entering Too Early', category:'Patience', color:'#e64040', description:'Taking a trade before the setup fully forms. Solution: always wait for candle close confirmation at the key level.' },
  { name:'Moving Stop Loss', category:'Discipline', color:'#f5a623', description:'Moving SL further away when price approaches it. Your SL is your risk — honour it every time without exception.' },
  { name:'Revenge Trading', category:'Psychology', color:'#9b6dff', description:'Entering impulsive trades after a loss to "get it back". Stick to your plan — emotion-based trades destroy accounts.' },
  { name:'Overtrading', category:'Discipline', color:'#e64040', description:'Taking too many trades in a session. Quality over quantity — max 2-3 setups per day. Sit on your hands.' },
  { name:'Ignoring the Plan', category:'Discipline', color:'#f5a623', description:'Entering a trade that does not meet all your checklist criteria. No plan = no trade.' },
  { name:'Wrong Position Size', category:'Risk', color:'#e64040', description:'Sizing too large relative to account. Never risk more than 1% per trade during challenge. Consistency is key.' },
]

export default function MistakesPage() {
  const supabase = createClient()
  const [mistakes, setMistakes] = useState<any[]>([])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('mistakes').select('*').eq('user_id', user.id)
    if (data && data.length) { setMistakes(data); return }
    const seeds = DEFAULT_MISTAKES.map(m => ({ ...m, user_id: user.id, count: 0 }))
    const { data: inserted } = await supabase.from('mistakes').insert(seeds).select()
    if (inserted) setMistakes(inserted)
  }

  useEffect(() => { load() }, [])

  async function logMistake(id: string) {
    const m = mistakes.find(x => x.id === id)
    if (!m) return
    const newCount = m.count + 1
    await supabase.from('mistakes').update({ count: newCount }).eq('id', id)
    setMistakes(prev => prev.map(x => x.id === id ? { ...x, count: newCount } : x))
  }

  const CAT_COLS: Record<string, string> = { Patience:'#00b4e6', Discipline:'#f5a623', Psychology:'#9b6dff', Risk:'#e64040' }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mistake Tracker</h1>
        <div className="text-xs text-tx3">Total logged: {mistakes.reduce((s,m) => s+m.count,0)}</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {mistakes.map((m, i) => (
          <div key={m.id || i} className="card-hover rounded-2xl border p-5" style={{ background:'#151b25', borderColor:'#1e2d42', borderLeft:`3px solid ${m.color}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="pill border text-[10px]" style={{ background:`${CAT_COLS[m.category] || m.color}18`, borderColor:`${CAT_COLS[m.category] || m.color}40`, color: CAT_COLS[m.category] || m.color }}>
                {m.category}
              </span>
              <span className="font-mono text-xs text-tx3">
                Logged: <strong style={{ color: m.count > 3 ? '#e64040' : '#c8d8f0' }}>{m.count}</strong>
              </span>
            </div>
            <h3 className="font-bold text-sm mb-2">{m.name}</h3>
            <p className="text-tx2 text-xs leading-relaxed mb-4">{m.description}</p>
            <button onClick={() => logMistake(m.id)}
              className="w-full py-1.5 rounded-lg border text-[11px] font-semibold transition-all text-tx2 hover:text-rose hover:border-rose/40"
              style={{ borderColor:'#1e2d42', background:'#1a2232' }}>
              + Log Occurrence
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
