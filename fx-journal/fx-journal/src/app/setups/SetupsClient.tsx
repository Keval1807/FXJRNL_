'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Setup } from '@/types'
import { computeStats } from '@/lib/utils'

const COLORS = ['#00d4a0', '#00b4e6', '#f5a623', '#9b6dff', '#e64040', '#ff9944']
const DEFAULT_SETUPS: Partial<Setup>[] = [
  { name: 'ICT Order Block', tag: 'OB', color: '#00d4a0', description: 'Price returns to the last opposing candle before a significant move. Enter on retest with confluence.', rating: 4 },
  { name: 'Fair Value Gap', tag: 'FVG', color: '#00b4e6', description: 'Inefficiency in price action — 3-candle imbalance. Price often returns to fill gaps before continuing.', rating: 4 },
  { name: 'Liquidity Sweep + Reversal', tag: 'LSR', color: '#f5a623', description: 'Price sweeps a key level (equal highs/lows) then immediately reverses. High probability with confirmation.', rating: 5 },
  { name: 'Break & Retest', tag: 'BR', color: '#9b6dff', description: 'Price breaks a key S/R level, retests it from the other side, then continues in breakout direction.', rating: 3 },
]

function SetupsContent({ setups: initial, tradeCount, userEmail, tradeTags }: { setups: Setup[], tradeCount: number, userEmail: string, tradeTags: string[] }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [setups, setSetups] = useState(initial)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', tag: '', description: '', color: '#00d4a0', rating: 3 })

  async function addSetup(setup: Partial<Setup>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from('setups').insert({ ...setup, user_id: user.id }).select().single()
    if (error) { toast(error.message, 'r'); return }
    setSetups(s => [...s, data])
    toast('Setup added', 'g')
    setAdding(false)
  }

  async function deleteSetup(id: string) {
    await supabase.from('setups').delete().eq('id', id)
    setSetups(s => s.filter(x => x.id !== id))
    toast('Setup removed', 'r')
  }

  async function seedDefaults() {
    for (const s of DEFAULT_SETUPS) await addSetup(s)
  }

  return (
    <AppShell stats={computeStats([])} userEmail={userEmail} tradeCount={tradeCount} pageTitle="Setups"
      action={<button className="btn-primary text-xs py-1.5 px-4" onClick={() => setAdding(true)}>+ Add Setup</button>}>

      {setups.length === 0 && (
        <div className="card p-8 text-center mb-4">
          <div className="text-4xl mb-3 opacity-30">🎯</div>
          <p className="text-tx3 text-sm mb-4">No setups yet. Add your trading setups to track performance by strategy.</p>
          <button className="btn-primary text-xs py-1.5 px-4" onClick={seedDefaults}>Load Default Setups</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {setups.map(s => {
          const count = tradeTags.filter(t => t === s.name).length
          return (
            <div key={s.id} className="card p-5 hover:-translate-y-px transition-transform" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="font-mono text-xs font-bold" style={{ color: s.color }}>{s.tag}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: '#f5a623' }}>{'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}</span>
                  <button onClick={() => deleteSetup(s.id)} className="text-tx4 hover:text-red text-xs transition-colors">✕</button>
                </div>
              </div>
              <h3 className="font-bold text-sm mb-2">{s.name}</h3>
              <p className="text-xs text-tx2 leading-relaxed mb-3">{s.description}</p>
              <div className="text-[10px] text-tx3 font-mono">Trades recorded: <span className="text-tx">{count}</span></div>
            </div>
          )
        })}

        {/* Add form */}
        {adding && (
          <div className="card p-5 border-dashed">
            <h3 className="font-bold text-sm mb-4">New Setup</h3>
            <div className="space-y-3">
              <div><label className="label">Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Fair Value Gap" /></div>
              <div><label className="label">Tag (short code)</label><input className="input" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder="e.g. FVG" /></div>
              <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the setup…" /></div>
              <div className="flex items-center gap-3">
                <div className="flex-1"><label className="label">Color</label>
                  <div className="flex gap-2">
                    {COLORS.map(c => <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-6 h-6 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white scale-110' : ''}`} style={{ background: c }} />)}
                  </div>
                </div>
                <div><label className="label">Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(n => <button key={n} onClick={() => setForm(f => ({ ...f, rating: n }))} className="text-base transition-colors" style={{ color: n <= form.rating ? '#f5a623' : '#2a3f55' }}>★</button>)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost flex-1 text-xs" onClick={() => setAdding(false)}>Cancel</button>
                <button className="btn-primary flex-1 text-xs" onClick={() => addSetup(form)}>Save Setup</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default function SetupsClient(props: { setups: Setup[], tradeCount: number, userEmail: string, tradeTags: string[] }) {
  return <ToastProvider><SetupsContent {...props} /></ToastProvider>
}
