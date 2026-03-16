import { useState, useEffect, useRef } from 'react'
import api, { fmtMoney } from '../api.js'
import { useToast } from '../ToastContext.jsx'

const SYMBOLS = [
  { value: 'FX:EURUSD', label: 'EUR/USD' },
  { value: 'FX:GBPUSD', label: 'GBP/USD' },
  { value: 'FX:USDJPY', label: 'USD/JPY' },
  { value: 'FX:GBPJPY', label: 'GBP/JPY' },
  { value: 'FX:AUDUSD', label: 'AUD/USD' },
  { value: 'FX:USDCAD', label: 'USD/CAD' },
  { value: 'FX:USDCHF', label: 'USD/CHF' },
  { value: 'FX:EURGBP', label: 'EUR/GBP' },
  { value: 'OANDA:XAUUSD', label: 'XAU/USD (Gold)' },
  { value: 'TVC:DXY', label: 'DXY Index' },
  { value: 'CAPITALCOM:US30', label: 'US30 / Dow Jones' },
  { value: 'CAPITALCOM:US100', label: 'NAS100 / Nasdaq' },
]

const TIMEFRAMES = [
  { value: '1', label: '1 Minute' }, { value: '5', label: '5 Minutes' },
  { value: '15', label: '15 Minutes' }, { value: '30', label: '30 Minutes' },
  { value: '60', label: '1 Hour' }, { value: '240', label: '4 Hours' },
  { value: 'D', label: 'Daily' }, { value: 'W', label: 'Weekly' },
]

const STYLES = [
  { value: '1', label: 'Candlestick' }, { value: '8', label: 'Heikin Ashi' },
  { value: '2', label: 'OHLC Bars' }, { value: '3', label: 'Line' },
]

export default function Backtest() {
  const [sym, setSym] = useState('FX:EURUSD')
  const [tf, setTf] = useState('60')
  const [style, setStyle] = useState('1')
  const [chartLoaded, setChartLoaded] = useState(false)
  const [backtests, setBacktests] = useState([])
  const [form, setForm] = useState({ strategy: '', pair: '', timeframe: '', trades: '', win_rate: '', net_pips: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const containerRef = useRef()
  const toast = useToast()

  useEffect(() => { loadBTs() }, [])

  const loadBTs = async () => {
    try { const r = await api.get('/backtests'); setBacktests(r.data) } catch {}
  }

  const loadChart = () => {
    const c = containerRef.current
    if (!c) return
    c.innerHTML = ''

    // Build widget config
    const config = {
      autosize: true,
      symbol: sym,
      interval: tf,
      timezone: 'Europe/London',
      theme: 'dark',
      style: style,
      locale: 'en',
      toolbar_bg: '#111827',
      enable_publishing: false,
      allow_symbol_change: true,
      hide_side_toolbar: false,
      withdateranges: true,
      save_image: true,
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',
      container_id: 'kk_tv_widget',
    }

    // Create container div
    const wrapper = document.createElement('div')
    wrapper.className = 'tradingview-widget-container'
    wrapper.style.cssText = 'height:100%;width:100%'

    const chartDiv = document.createElement('div')
    chartDiv.id = 'kk_tv_widget'
    chartDiv.style.cssText = 'height:calc(100% - 32px);width:100%'
    wrapper.appendChild(chartDiv)

    const footer = document.createElement('div')
    footer.className = 'tradingview-widget-copyright'
    footer.style.cssText = 'font-size:9px;color:#6b7280;padding:4px 8px;text-align:right'
    footer.innerHTML = '<a href="https://www.tradingview.com" target="_blank" style="color:#2563eb">TradingView</a>'
    wrapper.appendChild(footer)

    c.appendChild(wrapper)

    // Load script
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify(config)
    wrapper.appendChild(script)

    setChartLoaded(true)
  }

  const openTVFull = () => {
    window.open(`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(sym)}&interval=${tf}`, '_blank')
  }

  const saveBT = async () => {
    if (!form.strategy) { toast('Enter strategy name', 'error'); return }
    setSaving(true)
    try {
      await api.post('/backtests', { ...form, trades: parseInt(form.trades) || 0, win_rate: parseFloat(form.win_rate) || 0, net_pips: parseFloat(form.net_pips) || 0 })
      toast('Backtest saved!')
      setForm({ strategy: '', pair: '', timeframe: '', trades: '', win_rate: '', net_pips: '', notes: '' })
      loadBTs()
    } catch { toast('Failed to save', 'error') }
    finally { setSaving(false) }
  }

  const delBT = async (id) => {
    if (!confirm('Delete backtest?')) return
    await api.delete('/backtests/' + id)
    toast('Deleted')
    loadBTs()
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '18px 22px' }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Backtest</div>
      <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 16 }}>Full TradingView chart with bar-by-bar replay mode</div>

      {/* CONTROLS */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-header">
          <div className="card-title">⚙️ Chart Controls</div>
          <span className="card-sub">Select symbol & timeframe, then load chart</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field" style={{ minWidth: 160 }}>
              <label className="label">SYMBOL</label>
              <select className="select" value={sym} onChange={e => setSym(e.target.value)}>
                {SYMBOLS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="field" style={{ minWidth: 130 }}>
              <label className="label">TIMEFRAME</label>
              <select className="select" value={tf} onChange={e => setTf(e.target.value)}>
                {TIMEFRAMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="field" style={{ minWidth: 140 }}>
              <label className="label">CHART TYPE</label>
              <select className="select" value={style} onChange={e => setStyle(e.target.value)}>
                {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={loadChart} style={{ padding: '8px 24px' }}>
              📊 Load Chart
            </button>
            <button className="btn btn-outline" onClick={openTVFull}>
              ↗ Open Full Screen
            </button>
          </div>
        </div>
      </div>

      {/* REPLAY INSTRUCTIONS */}
      {chartLoaded && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: 'rgba(37,99,235,.07)', border: '1px solid rgba(37,99,235,.2)', borderRadius: 6, marginBottom: 12 }}>
          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>⏪</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue2)', marginBottom: 4 }}>
              How to use Replay Mode (Bar-by-Bar Backtesting)
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.8 }}>
              <strong style={{ color: '#fff' }}>1.</strong> Look at the <strong style={{ color: '#fff' }}>bottom toolbar</strong> of the chart below &nbsp;→&nbsp;
              <strong style={{ color: '#fff' }}>2.</strong> Click the <strong style={{ color: 'var(--blue2)' }}>clock/replay icon ⏪</strong> &nbsp;→&nbsp;
              <strong style={{ color: '#fff' }}>3.</strong> Select a start date on the chart &nbsp;→&nbsp;
              <strong style={{ color: '#fff' }}>4.</strong> Use <strong style={{ color: '#fff' }}>▶ Play</strong> or <strong style={{ color: '#fff' }}>→ Step</strong> to advance bar by bar &nbsp;→&nbsp;
              <strong style={{ color: '#fff' }}>5.</strong> Draw your trades using the drawing tools &nbsp;→&nbsp;
              <strong style={{ color: '#fff' }}>6.</strong> Record results in the form below
            </div>
          </div>
          <span style={{ flexShrink: 0, fontSize: 9, padding: '3px 8px', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 3, color: 'var(--green)' }}>FREE feature</span>
        </div>
      )}

      {/* CHART */}
      <div
        ref={containerRef}
        style={{
          width: '100%', height: 580,
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6,
          overflow: 'hidden', marginBottom: 14,
        }}
      >
        {!chartLoaded && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, color: 'var(--text4)' }}>
            <div style={{ fontSize: '3rem', opacity: .2 }}>📊</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)' }}>TradingView Chart</div>
            <div style={{ fontSize: 11, color: 'var(--text4)', textAlign: 'center', maxWidth: 380, lineHeight: 1.7 }}>
              Select your symbol and timeframe above, then click <strong style={{ color: 'var(--blue2)' }}>Load Chart</strong>.<br />
              The full chart includes drawing tools, indicators, and replay mode.
            </div>
            <button className="btn btn-primary" onClick={loadChart} style={{ marginTop: 6 }}>
              📊 Load Chart Now
            </button>
          </div>
        )}
      </div>

      {/* BACKTEST NOTES */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-header">
          <div className="card-title">📝 Record Backtest Results</div>
          <span className="card-sub">Log your findings after each replay session</span>
        </div>
        <div className="card-body">
          <div className="grid-auto" style={{ marginBottom: 10 }}>
            <div className="field">
              <label className="label">STRATEGY NAME</label>
              <input className="input" placeholder="e.g. FVG + BOS" value={form.strategy} onChange={e => setForm(f => ({ ...f, strategy: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">PAIR TESTED</label>
              <input className="input" placeholder="EUR/USD" value={form.pair} onChange={e => setForm(f => ({ ...f, pair: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">TIMEFRAME</label>
              <input className="input" placeholder="4H" value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">TOTAL TRADES</label>
              <input className="input" type="number" placeholder="0" value={form.trades} onChange={e => setForm(f => ({ ...f, trades: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">WIN RATE %</label>
              <input className="input" type="number" placeholder="0" max="100" value={form.win_rate} onChange={e => setForm(f => ({ ...f, win_rate: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">NET PIPS</label>
              <input className="input" type="number" placeholder="0" step="0.1" value={form.net_pips} onChange={e => setForm(f => ({ ...f, net_pips: e.target.value }))} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="label">NOTES & OBSERVATIONS</label>
              <textarea className="textarea" placeholder="What worked, what didn't, confluences that matter, rules to refine..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={saveBT} disabled={saving}>{saving ? 'Saving...' : 'Save Backtest'}</button>
            <button className="btn btn-outline" onClick={() => setForm({ strategy: '', pair: '', timeframe: '', trades: '', win_rate: '', net_pips: '', notes: '' })}>Clear</button>
          </div>
        </div>
      </div>

      {/* SAVED BACKTESTS */}
      {backtests.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">📚 Saved Backtests</div>
            <span className="card-sub">{backtests.length} records</span>
          </div>
          <div className="card-body-0">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>DATE</th><th>STRATEGY</th><th>PAIR</th><th>TF</th>
                    <th>TRADES</th><th>WIN RATE</th><th>PIPS</th><th>NOTES</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {backtests.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{b.date}</td>
                      <td style={{ color: 'var(--amber)', fontWeight: 600 }}>{b.strategy}</td>
                      <td style={{ color: 'var(--blue3)', fontFamily: 'var(--mono)' }}>{b.pair}</td>
                      <td style={{ color: 'var(--text4)' }}>{b.timeframe}</td>
                      <td>{b.trades}</td>
                      <td style={{ color: b.win_rate >= 50 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{b.win_rate}%</td>
                      <td style={{ color: b.net_pips >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{b.net_pips > 0 ? '+' : ''}{b.net_pips}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10, color: 'var(--text4)' }} title={b.notes}>{b.notes || '—'}</td>
                      <td><button className="btn btn-sm btn-danger" onClick={() => delBT(b.id)} style={{ padding: '2px 7px' }}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
