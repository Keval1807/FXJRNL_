import { useRef } from 'react'
import { fmtMoney, calcPnl } from '../api.js'
import { useToast } from '../ToastContext.jsx'

export default function ShareCard({ trade }) {
  const toast = useToast()
  const cardRef = useRef()

  const pnl = trade ? (trade.pnl ?? calcPnl(trade.pair, trade.pips, trade.lots)) : null
  const isPos = pnl >= 0
  const color = isPos ? '#22c55e' : '#ef4444'

  const copyText = () => {
    if (!trade) return
    const txt = `📊 Trade P&L\n${trade.direction} | ${trade.lots} Lots | ${trade.pair}\n${fmtMoney(pnl, true)} USD\nStrategy: ${trade.strategy}\nSession: ${trade.session}\nTrader: Keval Kabariya`
    navigator.clipboard.writeText(txt).then(() => toast('Copied!')).catch(() => toast('Copy failed', 'error'))
  }

  const download = async () => {
    if (!trade) return
    try {
      const html2canvas = (await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js')).default
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#06060f', scale: 2 })
      const a = document.createElement('a')
      a.download = `keval-trade-${trade.date}.png`
      a.href = canvas.toDataURL()
      a.click()
    } catch { toast('Could not export image', 'error') }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>Share Card</span>
        <span style={{ fontSize: 9, color: 'var(--text4)' }}>Auto-generated</span>
      </div>

      {/* THE CARD */}
      <div ref={cardRef} className="share-card" style={{ minHeight: 260 }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`, pointerEvents: 'none' }} />

        {!trade ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, color: 'var(--text4)' }}>
            <div style={{ fontSize: '2rem', opacity: .2, marginBottom: 10 }}>📊</div>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: .5 }}>SELECT A TRADE ROW<br />TO GENERATE CARD</div>
          </div>
        ) : (
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, background: 'var(--blue)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff' }}>KK</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: .5 }}>KEVAL KABARIYA</div>
                  <div style={{ fontSize: 9, color: 'var(--text4)' }}>Trade P&L</div>
                </div>
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 3, background: trade.direction === 'LONG' ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)', color: trade.direction === 'LONG' ? '#22c55e' : '#ef4444', border: `1px solid ${trade.direction === 'LONG' ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}` }}>
                {trade.direction}
              </div>
            </div>

            {/* Pair + details */}
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontFamily: 'var(--mono)' }}>
              {trade.direction.toLowerCase()} | {trade.lots} Lots | {trade.pair}
            </div>

            {/* BIG P&L */}
            <div style={{ fontSize: '2.8rem', fontWeight: 700, fontFamily: 'var(--mono)', color, lineHeight: 1, marginBottom: 4 }}>
              {fmtMoney(pnl, true)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text4)', fontFamily: 'var(--mono)', marginBottom: 16 }}>
              {trade.pips > 0 ? '+' : ''}{trade.pips} pips
            </div>

            <div style={{ height: 1, background: 'var(--border)', marginBottom: 14 }} />

            {/* Meta grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[['STRATEGY', trade.strategy], ['SESSION', trade.session], ['LOTS', trade.lots + ' lots'], ['DATE', trade.date]].map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 8, fontWeight: 600, color: 'var(--text4)', letterSpacing: .5 }}>{l}</div><div style={{ fontSize: 11, color: '#fff', marginTop: 2, fontFamily: 'var(--mono)' }}>{v}</div></div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--blue2)' }}>KEVAL KABARIYA</span>
              <span style={{ fontSize: 9, color: 'var(--text4)', fontFamily: 'var(--mono)' }}>{trade.date} {trade.time}</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
        <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={copyText} disabled={!trade}>Copy Text</button>
        <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={download} disabled={!trade}>Save PNG</button>
      </div>
    </div>
  )
}
