import { fmtMoney } from '../api.js'

export default function ConsistencyMeter({ stats: s }) {
  const cons = s?.consistency || 0
  const isOk = cons <= 15
  const color = cons <= 10 ? 'var(--green)' : cons <= 15 ? 'var(--amber)' : 'var(--red)'

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-header">
        <div className="card-title">⚖️ Prop Firm Consistency Rule</div>
        <span style={{ fontSize: 9, color: 'var(--text4)' }}>Largest day must be ≤ 30% of total profit (many firms use 15%)</span>
      </div>
      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 14 }}>
          {[
            ['MONTH P&L', fmtMoney(s?.totalPnl || 0, true), (s?.totalPnl || 0) >= 0 ? 'var(--green)' : 'var(--red)'],
            ['WIN DAYS', s?.winDays || 0, 'var(--green)'],
            ['LOSS DAYS', s?.lossDays || 0, 'var(--red)'],
            ['WIN RATE', s?.totalTrades ? s.winRate + '%' : '—', ''],
            ['CONSISTENCY', cons.toFixed(1) + '%', color],
          ].map(([label, val, col]) => (
            <div key={label}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text4)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)', color: col || '#fff' }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text4)' }}>Largest profit day: <strong style={{ color: 'var(--green)' }}>{fmtMoney(s?.largestProfitDay || 0, true)}</strong></span>
          <span style={{ fontSize: 10, color, fontWeight: 700 }}>{cons.toFixed(1)}% of total profit</span>
        </div>

        <div className="cons-meter">
          <div className="cons-fill" style={{ width: Math.min(cons, 100) + '%', background: color }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: 'var(--text4)' }}>
          <span>0%</span>
          <span style={{ color: 'var(--green)' }}>✓ Safe ≤15%</span>
          <span style={{ color: 'var(--amber)' }}>⚠ Warning 15%</span>
          <span style={{ color: 'var(--red)' }}>✗ Violation 30%</span>
          <span>100%</span>
        </div>

        {!isOk && s?.profitNeeded > 0 && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 4, fontSize: 11, color: 'var(--red)' }}>
            ⚠️ Consistency rule at risk. You need <strong>{fmtMoney(s.profitNeeded, true)}</strong> more total profit to bring the ratio below 15%.
          </div>
        )}
        {isOk && s?.totalTrades > 0 && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(34,197,94,.06)', border: '1px solid rgba(34,197,94,.15)', borderRadius: 4, fontSize: 11, color: 'var(--green)' }}>
            ✓ Consistency rule satisfied. No single day dominates more than 15% of total profit.
          </div>
        )}
      </div>
    </div>
  )
}
