import { useState, useEffect } from 'react'
import api, { fmtMoney, calcPnl } from '../api.js'
import { useToast } from '../ToastContext.jsx'
import ShareCard from '../components/ShareCard.jsx'

export default function Journal() {
  const [trades, setTrades] = useState([])
  const [filters, setFilters] = useState({ pair: '', result: '', strategy: '', session: '', month: '' })
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      const res = await api.get('/trades', { params })
      setTrades(res.data)
    } catch { toast('Failed to load trades', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filters])

  const del = async (id) => {
    if (!confirm('Delete this trade?')) return
    await api.delete('/trades/' + id)
    toast('Trade deleted')
    load()
    if (selected?.id === id) setSelected(null)
  }

  const selTrade = trades.find(t => t.id === selected?.id)

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '18px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Trade Journal</div>
        <span style={{ fontSize: 11, color: 'var(--text4)' }}>Click any row to auto-generate share card →</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text4)' }}>{trades.length} trades</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
        {/* TABLE */}
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
            {[
              ['pair', ['', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'GBP/JPY', 'US30', 'NAS100'], 'All Pairs'],
              ['result', ['', 'win', 'loss'], 'All Results'],
              ['session', ['', 'London', 'New York', 'Asian', 'London-NY Overlap'], 'All Sessions'],
            ].map(([key, opts, placeholder]) => (
              <select key={key} className="select" style={{ width: 'auto', fontSize: 10, padding: '5px 8px' }}
                value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}>
                {opts.map(o => <option key={o} value={o}>{o || placeholder}</option>)}
              </select>
            ))}
            <input type="month" className="input" style={{ width: 'auto', fontSize: 10, padding: '5px 8px' }}
              value={filters.month} onChange={e => setFilters(f => ({ ...f, month: e.target.value }))} />
            <button className="btn btn-sm btn-outline" onClick={() => setFilters({ pair: '', result: '', strategy: '', session: '', month: '' })}>Clear</button>
          </div>

          <div className="card">
            <div className="card-body-0">
              <div className="table-wrap">
                {loading ? <div className="loading"><div className="spinner" /></div> :
                  trades.length === 0 ? <div className="empty"><div className="empty-icon">📋</div><div className="empty-text">No trades found</div></div> : (
                    <table>
                      <thead><tr>
                        <th>#</th><th>DATE</th><th>PAIR</th><th>DIR</th><th>PIPS</th>
                        <th>P&L ($)</th><th>LOTS</th><th>STRATEGY</th><th>SESSION</th><th>RESULT</th><th></th>
                      </tr></thead>
                      <tbody>
                        {trades.map((t, i) => {
                          const pnl = t.pnl ?? calcPnl(t.pair, t.pips, t.lots)
                          const isSel = selected?.id === t.id
                          return (
                            <tr key={t.id} className={`clickable ${isSel ? 'selected' : ''}`} onClick={() => setSelected(isSel ? null : t)}>
                              <td style={{ color: 'var(--text4)', fontSize: 10 }}>{i + 1}</td>
                              <td><div style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{t.date}</div><div style={{ fontSize: 9, color: 'var(--text4)', fontFamily: 'var(--mono)' }}>{t.time}</div></td>
                              <td style={{ color: 'var(--blue3)', fontWeight: 500, fontFamily: 'var(--mono)' }}>{t.pair}</td>
                              <td><span className={`chip ${t.direction === 'LONG' ? 'chip-long' : 'chip-short'}`}>{t.direction}</span></td>
                              <td style={{ color: t.pips > 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{t.pips > 0 ? '+' : ''}{t.pips}</td>
                              <td style={{ color: pnl >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)', fontWeight: 700 }}>{fmtMoney(pnl, true)}</td>
                              <td style={{ color: 'var(--text4)', fontFamily: 'var(--mono)' }}>{t.lots}</td>
                              <td style={{ color: 'var(--text3)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.strategy}>{t.strategy}</td>
                              <td><span style={{ fontSize: 9, padding: '2px 6px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--text4)' }}>{t.session}</span></td>
                              <td><span className={`chip ${pnl >= 0 ? 'chip-win' : 'chip-loss'}`}>{pnl >= 0 ? 'WIN' : 'LOSS'}</span></td>
                              <td><button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); del(t.id) }} style={{ padding: '2px 7px', fontSize: 10 }}>×</button></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* SHARE CARD */}
        <div style={{ position: 'sticky', top: 10 }}>
          <ShareCard trade={selTrade} />
        </div>
      </div>
    </div>
  )
}
