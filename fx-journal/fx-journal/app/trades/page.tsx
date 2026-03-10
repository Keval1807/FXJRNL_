'use client'
// app/trades/page.tsx
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { calcPips, SYMBOLS, SESSIONS, SETUP_TAGS, EMOTION_TAGS, MISTAKE_TAGS, type Trade, type Side } from '@/types'
import { fmtDate, cn } from '@/lib/utils'

export default function TradesPage() {
  const supabase = createClient()
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Trade> & { side: Side }>({
    side: 'BUY', symbol: 'EURUSD', lots: 0.1, session: 'London',
    exit_time: new Date().toISOString().slice(0,16),
    entry_time: new Date().toISOString().slice(0,16),
  })

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('trades').select('*').eq('user_id', user.id).order('exit_time', { ascending: false })
    setTrades((data || []) as Trade[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  // Auto-calc pips when prices change
  useEffect(() => {
    if (form.entry_price && form.exit_price && form.symbol) {
      const p = calcPips(form.symbol, form.side, form.entry_price, form.exit_price)
      setForm(f => ({ ...f, pips: p }))
    }
  }, [form.entry_price, form.exit_price, form.symbol, form.side])

  async function saveTrade() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const row = {
      user_id: user.id,
      symbol: form.symbol, side: form.side, lots: form.lots || 0.1,
      entry_price: form.entry_price || 0, exit_price: form.exit_price || 0,
      entry_time: form.entry_time || new Date().toISOString(),
      exit_time: form.exit_time || new Date().toISOString(),
      pips: form.pips || 0, pnl: form.pnl || 0,
      stop_loss: form.stop_loss || null, take_profit: form.take_profit || null,
      risk_percent: form.risk_percent || null, r_multiple: form.r_multiple || null,
      setup_tag: form.setup_tag || null, emotion_tag: form.emotion_tag || null,
      mistake_tags: form.mistake_tags || [], session: form.session || null,
      notes: form.notes || null, post_analysis: form.post_analysis || null,
    }
    await supabase.from('trades').insert(row)
    setShowModal(false); setSaving(false)
    setForm({ side:'BUY', symbol:'EURUSD', lots:0.1, session:'London',
      exit_time: new Date().toISOString().slice(0,16), entry_time: new Date().toISOString().slice(0,16) })
    load()
  }

  async function deleteTrade(id: string) {
    if (!confirm('Delete this trade?')) return
    await supabase.from('trades').delete().eq('id', id)
    setTrades(t => t.filter(x => x.id !== id))
  }

  const filtered = trades.filter(t => {
    if (filter === 'BUY') return t.side === 'BUY'
    if (filter === 'SELL') return t.side === 'SELL'
    if (filter === 'win') return t.pnl > 0
    if (filter === 'loss') return t.pnl <= 0
    return true
  }).filter(t => !search || (t.symbol + t.setup_tag + t.notes).toLowerCase().includes(search.toLowerCase()))

  const inp = 'w-full rounded-lg px-3 py-2 text-sm border input-field'
  const INP_ST = { background:'#1a2232', borderColor:'#263650', color:'#c8d8f0' }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'number' ? parseFloat(e.target.value) || undefined : e.target.value }))

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1.5">
          {['all','BUY','SELL','win','loss'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all',
                filter === f ? 'text-teal border-teal/40 bg-teal/10' : 'text-tx2 border-bd hover:text-tx')}
              style={filter !== f ? { borderColor:'#1e2d42', background:'#1a2232' } : {}}>
              {f === 'all' ? 'All' : f === 'BUY' ? 'Long' : f === 'SELL' ? 'Short' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <input placeholder="Search symbol, setup…" value={search} onChange={e => setSearch(e.target.value)}
          className="input-field rounded-lg px-3 py-1.5 text-sm border flex-1 max-w-[200px]"
          style={{ background:'#1a2232', borderColor:'#263650', color:'#c8d8f0' }} />
        <div className="ml-auto">
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg font-bold text-sm text-black"
            style={{ background:'linear-gradient(135deg,#00d4a0,#00b4e6)', boxShadow:'0 4px 14px rgba(0,212,160,.3)' }}>
            + Log Trade
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background:'#151b25', borderColor:'#1e2d42' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-tx3 text-sm">Loading…</div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-tx3">
            <span className="text-4xl opacity-30">📋</span>
            <p className="text-sm italic">No trades found. Click &quot;Log Trade&quot; to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor:'#1e2d42' }}>
                  {['Date','Symbol','Side','Lots','Entry','Exit','Pips','P&L','Setup','Emotion',''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[9.5px] font-bold uppercase tracking-widest text-tx3 whitespace-nowrap"
                      style={{ background:'#1a2232' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="table-row border-b transition-colors" style={{ borderColor:'rgba(30,45,66,.4)' }}>
                    <td className="px-3 py-2 font-mono text-[11px] text-tx3">{fmtDate(t.exit_time)}</td>
                    <td className="px-3 py-2 font-bold text-sm">{t.symbol}</td>
                    <td className="px-3 py-2">
                      <span className={cn('pill', t.side==='BUY' ? 'bg-teal/10 text-teal border border-teal/20' : 'bg-rose/10 text-rose border border-rose/20')}>
                        {t.side}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-sm">{t.lots.toFixed(2)}</td>
                    <td className="px-3 py-2 font-mono text-sm">{t.entry_price}</td>
                    <td className="px-3 py-2 font-mono text-sm">{t.exit_price}</td>
                    <td className="px-3 py-2 font-mono text-sm font-bold" style={{ color: t.pips>=0?'#00d4a0':'#e64040' }}>
                      {t.pips>=0?'+':''}{t.pips?.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 font-mono text-sm font-bold" style={{ color: t.pnl>=0?'#00d4a0':'#e64040' }}>
                      {t.pnl>=0?'+':''}${t.pnl?.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-tx2">{t.setup_tag || '—'}</td>
                    <td className="px-3 py-2 text-sm">{t.emotion_tag || ''}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => deleteTrade(t.id)}
                        className="text-tx3 hover:text-rose transition-colors text-xs px-2 py-1 rounded border"
                        style={{ borderColor:'#1e2d42' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD TRADE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="rounded-2xl border w-full max-w-xl max-h-[90vh] overflow-y-auto p-7"
            style={{ background:'#151b25', borderColor:'#263650', boxShadow:'0 24px 80px rgba(0,0,0,.6)' }}>
            <h2 className="text-lg font-bold mb-1">Log Trade</h2>
            <p className="text-tx3 text-xs mb-5">Record a new trade in your journal</p>

            {/* Direction */}
            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-2">Direction</label>
              <div className="grid grid-cols-2 gap-2">
                {(['BUY','SELL'] as Side[]).map(s => (
                  <button key={s} onClick={() => setForm(f => ({ ...f, side: s }))}
                    className={cn('py-2 rounded-lg border font-bold text-sm transition-all',
                      form.side === s
                        ? s === 'BUY' ? 'bg-teal/15 border-teal/40 text-teal' : 'bg-rose/15 border-rose/40 text-rose'
                        : 'text-tx3 border-bd hover:border-bd3')}>
                    {s === 'BUY' ? '▲ BUY / LONG' : '▼ SELL / SHORT'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-1.5">Symbol</label>
                <select className={inp} style={INP_ST} value={form.symbol} onChange={set('symbol')}>
                  {SYMBOLS.map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-1.5">Lots</label>
                <input type="number" className={inp} style={INP_ST} step="0.01" min="0.01" placeholder="0.10"
                  value={form.lots || ''} onChange={set('lots')} /></div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div><label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-1.5">Entry Price</label>
                <input type="number" className={inp} style={INP_ST} step="0.00001" placeholder="1.08500"
                  value={form.entry_price || ''} onChange={set('entry_price')} /></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-1.5">Exit Price</label>
                <input type="number" className={inp} style={INP_ST} step="0.00001" placeholder="1.08800"
                  value={form.exit_price || ''} onChange={set('exit_price')} /></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-1.5">Pips (auto)</label>
                <input type="number" readOnly className={inp} style={{ ...INP_ST, cursor:'default', color:'#4a607a' }}
                  value={form.pips?.toFixed(1) || ''} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-1.5">P&L ($)</label>
                <input type="number" className={inp} style={INP_ST} placeholder="e.g. 120.50" step="0.01"
                  value={form.pnl || ''} onChange={set('pnl')} /></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-1.5">Exit Date/Time</label>
                <input type="datetime-local" className={inp} style={INP_ST}
                  value={form.exit_time || ''} onChange={set('exit_time')} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-1.5">Setup</label>
                <select className={inp} style={INP_ST} value={form.setup_tag || ''} onChange={set('setup_tag')}>
                  <option value="">None</option>
                  {SETUP_TAGS.map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-1.5">Session</label>
                <select className={inp} style={INP_ST} value={form.session || ''} onChange={set('session')}>
                  {SESSIONS.map(s => <option key={s}>{s}</option>)}</select></div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-1.5">Stop Loss</label>
                <input type="number" className={inp} style={INP_ST} step="0.00001" placeholder="Price"
                  value={form.stop_loss || ''} onChange={set('stop_loss')} /></div>
              <div><label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-1.5">Take Profit</label>
                <input type="number" className={inp} style={INP_ST} step="0.00001" placeholder="Price"
                  value={form.take_profit || ''} onChange={set('take_profit')} /></div>
            </div>

            <div className="mb-3">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-2">Emotion</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOTION_TAGS.map(e => (
                  <button key={e} onClick={() => setForm(f => ({ ...f, emotion_tag: f.emotion_tag === e ? undefined : e }))}
                    className={cn('px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all',
                      form.emotion_tag === e ? 'text-teal border-teal/40 bg-teal/10' : 'text-tx2 border-bd hover:text-tx')}
                    style={form.emotion_tag !== e ? { borderColor:'#1e2d42', background:'#1a2232' } : {}}>{e}</button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-1.5">Trade Notes</label>
              <textarea rows={2} className={inp} style={{ ...INP_ST, resize:'vertical' as const }}
                placeholder="Why did you take this trade? What did you see?"
                value={form.notes || ''} onChange={set('notes')} />
            </div>
            <div className="mb-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-tx3 mb-1.5">Post-Trade Analysis</label>
              <textarea rows={2} className={inp} style={{ ...INP_ST, resize:'vertical' as const }}
                placeholder="What did you learn? What would you do differently?"
                value={form.post_analysis || ''} onChange={set('post_analysis')} />
            </div>

            <div className="flex gap-2.5 justify-end border-t pt-4" style={{ borderColor:'#1e2d42' }}>
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border text-sm font-semibold text-tx2 hover:text-tx"
                style={{ borderColor:'#263650', background:'#1a2232' }}>Cancel</button>
              <button onClick={saveTrade} disabled={saving}
                className="px-5 py-2 rounded-lg font-bold text-sm text-black disabled:opacity-60"
                style={{ background:'linear-gradient(135deg,#00d4a0,#00b4e6)', boxShadow:'0 4px 14px rgba(0,212,160,.3)' }}>
                {saving ? 'Saving…' : 'Save Trade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
