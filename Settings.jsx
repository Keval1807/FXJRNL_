import { useState, useEffect } from 'react'
import api from '../api.js'
import { useToast } from '../ToastContext.jsx'

export default function Settings() {
  const [form, setForm] = useState({ balance: '5000', account_name: 'Prop Firm Challenge', pip_value: '10', risk_percent: '0.5' })
  const [saved, setSaved] = useState(false)
  const toast = useToast()

  useEffect(() => {
    api.get('/settings').then(r => {
      setForm({
        balance: r.data.balance || '5000',
        account_name: r.data.account_name || 'Prop Firm Challenge',
        pip_value: r.data.pip_value || '10',
        risk_percent: r.data.risk_percent || '0.5',
      })
    })
  }, [])

  const save = async () => {
    try {
      await api.put('/settings', form)
      setSaved(true)
      toast('Settings saved!')
      setTimeout(() => setSaved(false), 2000)
    } catch { toast('Failed to save settings', 'error') }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '18px 22px' }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Settings</div>

      <div style={{ maxWidth: 640 }}>
        {/* Account Settings */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div className="card-title">⚙️ Account Configuration</div></div>
          <div className="card-body">
            <div className="grid-2" style={{ marginBottom: 14 }}>
              <div className="field">
                <label className="label">STARTING BALANCE ($)</label>
                <input className="input" type="number" step="100" value={form.balance} onChange={e => set('balance', e.target.value)} />
                <span style={{ fontSize: 9, color: 'var(--text4)', marginTop: 3 }}>Used to calculate account value and P&L %</span>
              </div>
              <div className="field">
                <label className="label">ACCOUNT NAME</label>
                <input className="input" type="text" value={form.account_name} onChange={e => set('account_name', e.target.value)} placeholder="e.g. The Funded Room - Phase 1" />
              </div>
              <div className="field">
                <label className="label">DEFAULT PIP VALUE (per standard lot)</label>
                <input className="input" type="number" step="0.1" value={form.pip_value} onChange={e => set('pip_value', e.target.value)} />
                <span style={{ fontSize: 9, color: 'var(--text4)', marginTop: 3 }}>Used when pair not in lookup table</span>
              </div>
              <div className="field">
                <label className="label">RISK PER TRADE (%)</label>
                <input className="input" type="number" step="0.1" value={form.risk_percent} onChange={e => set('risk_percent', e.target.value)} placeholder="0.5" />
              </div>
            </div>
            <button className="btn btn-primary" onClick={save}>{saved ? '✓ Saved!' : 'Save Settings'}</button>
          </div>
        </div>

        {/* Pip Value Reference */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div className="card-title">📊 Pip Value Reference</div></div>
          <div className="card-body">
            <div className="table-wrap">
              <table>
                <thead><tr><th>PAIR</th><th>PIP VALUE (per 0.01 lot)</th><th>PIP VALUE (per 1 lot)</th></tr></thead>
                <tbody>
                  {[
                    ['EUR/USD, GBP/USD, AUD/USD', '$0.10', '$10.00'],
                    ['USD/JPY, EUR/JPY, GBP/JPY', '$0.067', '$6.70'],
                    ['USD/CHF', '$0.112', '$11.20'],
                    ['USD/CAD', '$0.073', '$7.30'],
                    ['EUR/GBP', '$0.127', '$12.70'],
                    ['XAU/USD (Gold)', '$0.10', '$10.00'],
                    ['US30 / NAS100 (per point)', '$0.01', '$1.00'],
                  ].map(([pair, mini, std]) => (
                    <tr key={pair}>
                      <td style={{ color: 'var(--blue3)', fontFamily: 'var(--mono)' }}>{pair}</td>
                      <td style={{ fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{mini}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: '#fff' }}>{std}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ border: '1px solid rgba(239,68,68,.3)' }}>
          <div className="card-header" style={{ borderBottomColor: 'rgba(239,68,68,.2)' }}>
            <div className="card-title" style={{ color: 'var(--red)' }}>⚠️ Danger Zone</div>
          </div>
          <div className="card-body">
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.7 }}>
              Deleting all data is <strong style={{ color: '#fff' }}>permanent and cannot be undone</strong>. All trades, backtests, and settings will be removed from the database.
            </div>
            <button
              className="btn btn-danger"
              onClick={async () => {
                if (!confirm('Are you absolutely sure? This will delete ALL your trade data permanently.')) return
                if (!confirm('Last warning — this CANNOT be undone. Delete everything?')) return
                try {
                  // Delete all trades
                  const trades = await api.get('/trades')
                  for (const t of trades.data) await api.delete('/trades/' + t.id)
                  const bts = await api.get('/backtests')
                  for (const b of bts.data) await api.delete('/backtests/' + b.id)
                  toast('All data deleted')
                } catch { toast('Failed to delete all data', 'error') }
              }}
            >
              Delete All Trade Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
