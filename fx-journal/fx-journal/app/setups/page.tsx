'use client'
// app/setups/page.tsx
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const DEFAULT_SETUPS = [
  { name:'ICT Order Block', tag:'OB', color:'#00d4a0', description:'Price returns to the last opposing candle before a significant move. Enter on retest with strong confluence.', rating:4 },
  { name:'Fair Value Gap', tag:'FVG', color:'#00b4e6', description:'3-candle imbalance — price leaves an inefficiency. High probability fill on return to the gap.', rating:4 },
  { name:'Liquidity Sweep + Reversal', tag:'LSR', color:'#f5a623', description:'Price sweeps equal highs/lows (stops), then immediately reverses. Best with session open confluence.', rating:5 },
  { name:'Break & Retest', tag:'BR', color:'#9b6dff', description:'Price breaks a key S/R level, retests from the other side as support/resistance, then continues.', rating:3 },
  { name:'Fibonacci Retracement', tag:'FIB', color:'#00d4a0', description:'Pullback to key Fib levels (61.8%, 78.6%) after an impulsive move. Wait for price action confirmation.', rating:3 },
]

export default function SetupsPage() {
  const supabase = createClient()
  const [setups, setSetups] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('setups').select('*').eq('user_id', user.id)
      if (data && data.length) { setSetups(data); return }
      // Seed defaults
      const seeds = DEFAULT_SETUPS.map(s => ({ ...s, user_id: user.id, trade_count: 0 }))
      const { data: inserted } = await supabase.from('setups').insert(seeds).select()
      if (inserted) setSetups(inserted)
    }
    load()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Setups</h1>
        <span className="text-xs text-tx3">{setups.length} setups</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {setups.map((s, i) => (
          <div key={s.id || i} className="card-hover rounded-2xl border p-5" style={{ background:'#151b25', borderColor:'#1e2d42', borderLeft:`3px solid ${s.color}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="font-mono text-xs font-bold" style={{ color: s.color }}>{s.tag}</span>
              </div>
              <div className="text-amber text-sm" title={`${s.rating}/5 stars`}>
                {'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}
              </div>
            </div>
            <h3 className="font-bold text-sm mb-2">{s.name}</h3>
            <p className="text-tx2 text-xs leading-relaxed">{s.description}</p>
            <div className="mt-3 text-[10px] text-tx3 font-mono">Trades: {s.trade_count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
