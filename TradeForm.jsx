import { useState, useEffect } from 'react'
import api, { calcPnl, fmtMoney, pipVal } from '../api.js'
import { useToast } from '../ToastContext.jsx'

const PAIRS = ['EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','NZD/USD','USD/CAD','EUR/GBP','EUR/JPY','GBP/JPY','XAU/USD','US30','NAS100','SPX500','GBP/AUD','EUR/AUD','AUD/JPY']
const STRATEGIES = ['Break of Structure','Liquidity Sweep','Fair Value Gap','Order Block','Supply & Demand','Fibonacci 0.618','Fibonacci 0.705','Fibonacci 0.79','Fibonacci 0.50','Fibonacci Extension','Fib + BOS','Support & Resistance','ICT Concepts','Smart Money Concept','Price Action','News Trade','Trend Follow','Scalp']
const EMOTIONS = ['Calm & Focused','Confident','Anxious','FOMO','Revenge Mindset','Overconfident','Distracted','Patient','Bored','Disciplined']
const MISTAKES = ['','Moved Stop Loss','Early Exit','FOMO Entry','Revenge Trade','Oversize Position','Ignored Levels','No Trade Plan','Chased Entry','Over-traded','Deviated from Strategy']
const SESSIONS = ['London','New York','Asian','London-NY Overlap','Pre-Market']

function now() {
  const d = new Date()
  return { date: d.toISOString().split('T')[0], time: d.toTimeString().slice(0, 5) }
}

export default function TradeForm({ onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({ pair: 'XAU/USD', direction: 'LONG', pips: '', lots: '0.01', session: 'London', strategy: 'Break of Structure', emotion: 'Calm & Focused', mistake: '', date: now().date, time: now().time, notes: '' })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const livePnl = form.pips !== '' ? calcPnl(form.pair, parseFloat(form.pips), parseFloat(form.lots) || 0.01) : null
  const livePipVal = pipVal(form.pair, parseFloat(form.lots) || 0.01)

  const save = async () => {
    if (!form.pips) { toast('Enter pips!', 'error'); return }
    setSaving(true)
    try {
      const res = await api.post('/trades', {
        ...form, pips: parseFloat(form.pips), lots: parseFloat(form.lots) || 0.01
      })
      toast((res.data.pnl > 0 ? '+' : '') + fmtMoney(res.data.pnl, true) + ' — ' + form.pair + ' logged!')
      const n = now()
      setForm(f => ({ ...f, pips: '', notes: '', date: n.date, time: n.time }))
      onSaved?.()
    } catch { toast('Failed to save trade', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="card-header">
        <div className="card-title">+ Log Trade</div>
        <span className="card-sub">Profit calculated automatically from pips × lot size</span>
      </div>
      <div className="card-body">
        <div className="grid-auto" style={{ marginBottom: 10 }}>
          {/* Pair */}
          <div className="field">
            <label className="label">PAIR</label>
            <select className="select" value={form.pair} onChange={e => set('pair', e.target.value)}>
              {PAIRS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          {/* Direction */}
          <div className="field">
            <label className="label">DIRECTION</label>
            <select className="select" value={form.direction} onChange={e => set('direction', e.target.value)}>
              <option>LONG</option><option>SHORT</option>
            </select>
          </div>
          {/* Pips */}
          <div className="field">
            <label className="label">PIPS (+/-)</label>
            <div style={{ position: 'relative' }}>
              <input className="input" type="number" step="0.1" placeholder="+35 or -15" value={form.pips} onChange={e => set('pips', e.target.value)} style={{ paddingRight: 44 }} />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 8, color: 'var(--text4)', fontFamily: 'var(--mono)' }}>PIPS</span>
            </div>
          </div>
          {/* Lots */}
          <div className="field">
            <label className="label">LOT SIZE</label>
            <input className="input" type="number" step="0.01" min="0.001" value={form.lots} onChange={e => set('lots', e.target.value)} />
          </div>
          {/* Session */}
          <div className="field">
            <label className="label">SESSION</label>
            <select className="select" value={form.session} onChange={e => set('session', e.target.value)}>
              {SESSIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {/* Strategy */}
          <div className="field">
            <label className="label">STRATEGY</label>
            <select className="select" value={form.strategy} onChange={e => set('strategy', e.target.value)}>
              {STRATEGIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {/* Emotion */}
          <div className="field">
            <label className="label">EMOTION</label>
            <select className="select" value={form.emotion} onChange={e => set('emotion', e.target.value)}>
              {EMOTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {/* Mistake */}
          <div className="field">
            <label className="label">MISTAKE</label>
            <select className="select" value={form.mistake} onChange={e => set('mistake', e.target.value)}>
              {MISTAKES.map(s => <option key={s} value={s}>{s || 'None'}</option>)}
            </select>
          </div>
          {/* Date */}
          <div className="field">
            <label className="label">DATE</label>
            <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          {/* Time */}
          <div className="field">
            <label className="label">TIME</label>
            <input className="input" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
          {/* Notes */}
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="label">NOTES</label>
            <textarea className="textarea" placeholder="Setup rationale, confluences, observations..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        {/* LIVE CALCULATOR */}
        <div style={{ display: 'flex', gap: 16, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 5, border: '1px solid var(--border)', marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--text4)', marginBottom: 2 }}>PROFIT / LOSS</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)', color: livePnl == null ? 'var(--text4)' : livePnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {livePnl == null ? '$0.00' : fmtMoney(livePnl, true)}
            </div>
          </div>
          <div style={{ width: 1, background: 'var(--border)', height: 32 }} />
          <div>
            <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--text4)', marginBottom: 2 }}>PIP VALUE</div>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>${livePipVal.toFixed(2)}/pip</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)', height: 32 }} />
          <div>
            <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--text4)', marginBottom: 2 }}>PIPS</div>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{form.pips ? (parseFloat(form.pips) > 0 ? '+' : '') + parseFloat(form.pips).toFixed(1) : '0.0'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Log Trade'}</button>
          <button className="btn btn-outline" onClick={() => { const n = now(); setForm({ pair: 'XAU/USD', direction: 'LONG', pips: '', lots: '0.01', session: 'London', strategy: 'Break of Structure', emotion: 'Calm & Focused', mistake: '', date: n.date, time: n.time, notes: '' }) }}>Clear</button>
        </div>
      </div>
    </div>
  )
}
