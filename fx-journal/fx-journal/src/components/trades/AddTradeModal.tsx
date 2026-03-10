'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { SYMBOLS, SESSIONS, SETUP_TAGS, EMOTION_TAGS, getPipSize, type Trade } from '@/types'
import { useToast } from '@/components/ui/Toast'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editTrade?: Trade | null
}

const EMPTY = {
  symbol: 'EURUSD', side: 'BUY' as 'BUY'|'SELL',
  lots: '0.10', entry_price: '', exit_price: '',
  entry_time: '', exit_time: new Date().toISOString().split('T')[0],
  pips: '', pnl: '', stop_loss: '', take_profit: '', risk_percent: '',
  session: 'London', setup_tag: '', emotion_tag: '', notes: '', post_analysis: '',
}

export default function AddTradeModal({ open, onClose, onSaved, editTrade }: Props) {
  const supabase = createClient()
  const { toast } = useToast()
  const [f, setF] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editTrade) {
      setF({
        symbol: editTrade.symbol,
        side: editTrade.side,
        lots: String(editTrade.lots),
        entry_price: String(editTrade.entry_price || ''),
        exit_price: String(editTrade.exit_price || ''),
        entry_time: editTrade.entry_time?.split('T')[0] || '',
        exit_time: editTrade.exit_time?.split('T')[0] || new Date().toISOString().split('T')[0],
        pips: String(editTrade.pips || ''),
        pnl: String(editTrade.pnl || ''),
        stop_loss: String(editTrade.stop_loss || ''),
        take_profit: String(editTrade.take_profit || ''),
        risk_percent: String(editTrade.risk_percent || ''),
        session: editTrade.session || 'London',
        setup_tag: editTrade.setup_tag || '',
        emotion_tag: editTrade.emotion_tag || '',
        notes: editTrade.notes || '',
        post_analysis: editTrade.post_analysis || '',
      })
    } else {
      setF({ ...EMPTY, exit_time: new Date().toISOString().split('T')[0] })
    }
  }, [editTrade, open])

  // Auto-calc pips
  useEffect(() => {
    const entry = parseFloat(f.entry_price)
    const exit = parseFloat(f.exit_price)
    if (!entry || !exit) return
    const pip = getPipSize(f.symbol)
    const diff = (f.side === 'BUY' ? exit - entry : entry - exit) / pip
    setF(p => ({ ...p, pips: diff.toFixed(1) }))
  }, [f.entry_price, f.exit_price, f.symbol, f.side])

  const upd = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast('Not authenticated', 'r'); setSaving(false); return }

    const payload = {
      user_id: user.id,
      symbol: f.symbol,
      side: f.side,
      lots: parseFloat(f.lots) || 0.1,
      entry_price: parseFloat(f.entry_price) || null,
      exit_price: parseFloat(f.exit_price) || null,
      entry_time: f.entry_time ? new Date(f.entry_time).toISOString() : null,
      exit_time: f.exit_time ? new Date(f.exit_time).toISOString() : new Date().toISOString(),
      pips: parseFloat(f.pips) || 0,
      pnl: parseFloat(f.pnl) || 0,
      stop_loss: parseFloat(f.stop_loss) || null,
      take_profit: parseFloat(f.take_profit) || null,
      risk_percent: parseFloat(f.risk_percent) || null,
      session: f.session || null,
      setup_tag: f.setup_tag || null,
      emotion_tag: f.emotion_tag || null,
      notes: f.notes || null,
      post_analysis: f.post_analysis || null,
    }

    let error
    if (editTrade) {
      ({ error } = await supabase.from('trades').update(payload).eq('id', editTrade.id))
    } else {
      ({ error } = await supabase.from('trades').insert(payload))
    }

    if (error) { toast(error.message, 'r'); setSaving(false); return }
    toast(`Trade ${editTrade ? 'updated' : 'saved'}: ${f.side} ${f.symbol} ${parseFloat(f.pnl) >= 0 ? '+' : ''}$${parseFloat(f.pnl).toFixed(2)}`, 'g')
    onSaved()
    onClose()
    setSaving(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-bg2 border border-border2 rounded-2xl p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <h2 className="text-base font-bold mb-1">{editTrade ? 'Edit Trade' : 'Log Trade'}</h2>
        <p className="text-xs text-tx3 mb-5">Record every detail for better insights</p>

        {/* Direction */}
        <div className="mb-4">
          <label className="label">Direction</label>
          <div className="grid grid-cols-2 gap-2">
            {(['BUY','SELL'] as const).map(s => (
              <button key={s} onClick={() => upd('side', s)}
                className={`py-2 rounded-lg text-sm font-bold border transition-all
                  ${f.side === s
                    ? s === 'BUY' ? 'bg-green/15 border-green text-green' : 'bg-red/12 border-red text-red'
                    : 'bg-bg3 border-border2 text-tx3 hover:border-border3'}`}>
                {s === 'BUY' ? '▲ BUY / LONG' : '▼ SELL / SHORT'}
              </button>
            ))}
          </div>
        </div>

        {/* Symbol + Lots */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Symbol</label>
            <select className="input" value={f.symbol} onChange={e => upd('symbol', e.target.value)}>
              {SYMBOLS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Lots</label>
            <input className="input" type="number" placeholder="0.10" step="0.01" value={f.lots} onChange={e => upd('lots', e.target.value)} />
          </div>
        </div>

        {/* Entry / Exit / Pips */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="label">Entry Price</label>
            <input className="input" type="number" step="0.00001" placeholder="1.08500" value={f.entry_price} onChange={e => upd('entry_price', e.target.value)} />
          </div>
          <div>
            <label className="label">Exit Price</label>
            <input className="input" type="number" step="0.00001" placeholder="1.08800" value={f.exit_price} onChange={e => upd('exit_price', e.target.value)} />
          </div>
          <div>
            <label className="label">Pips</label>
            <input className="input" readOnly value={f.pips} style={{ cursor: 'default', color: 'var(--tx3)' }} />
          </div>
        </div>

        {/* P&L + Date */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">P&L ($)</label>
            <input className="input" type="number" step="0.01" placeholder="e.g. 120.50" value={f.pnl} onChange={e => upd('pnl', e.target.value)} />
          </div>
          <div>
            <label className="label">Exit Date</label>
            <input className="input" type="date" value={f.exit_time} onChange={e => upd('exit_time', e.target.value)} />
          </div>
        </div>

        {/* SL / TP / Risk */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="label">Stop Loss</label>
            <input className="input" type="number" step="0.00001" placeholder="Price" value={f.stop_loss} onChange={e => upd('stop_loss', e.target.value)} />
          </div>
          <div>
            <label className="label">Take Profit</label>
            <input className="input" type="number" step="0.00001" placeholder="Price" value={f.take_profit} onChange={e => upd('take_profit', e.target.value)} />
          </div>
          <div>
            <label className="label">Risk %</label>
            <input className="input" type="number" step="0.1" placeholder="1.0" value={f.risk_percent} onChange={e => upd('risk_percent', e.target.value)} />
          </div>
        </div>

        {/* Setup + Session */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Setup</label>
            <select className="input" value={f.setup_tag} onChange={e => upd('setup_tag', e.target.value)}>
              <option value="">None</option>
              {SETUP_TAGS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Session</label>
            <select className="input" value={f.session} onChange={e => upd('session', e.target.value)}>
              {SESSIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Emotion */}
        <div className="mb-3">
          <label className="label">Emotion</label>
          <div className="flex flex-wrap gap-2">
            {EMOTION_TAGS.map(e => (
              <button key={e} onClick={() => upd('emotion_tag', f.emotion_tag === e ? '' : e)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all
                  ${f.emotion_tag === e ? 'bg-green/15 border-green text-green' : 'bg-bg3 border-border2 text-tx3 hover:border-border3'}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-3">
          <label className="label">Pre-Trade Notes</label>
          <textarea className="input resize-none" rows={2} placeholder="Why did you take this trade? What did you see?" value={f.notes} onChange={e => upd('notes', e.target.value)} />
        </div>
        <div className="mb-5">
          <label className="label">Post-Trade Analysis</label>
          <textarea className="input resize-none" rows={2} placeholder="What happened? What did you learn?" value={f.post_analysis} onChange={e => upd('post_analysis', e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : editTrade ? 'Update Trade' : 'Save Trade'}
          </button>
        </div>
      </div>
    </div>
  )
}
