import { useState } from 'react'
import { fmtMoney } from '../api.js'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT']

export default function ProfitCalendar({ calendarData = {} }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(null)

  const nav = (d) => {
    let m = month + d, y = year
    if (m > 11) { m = 0; y++ }
    if (m < 0) { m = 11; y-- }
    setMonth(m); setYear(y)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = now

  // Month stats
  const monthEntries = Object.entries(calendarData).filter(([d]) => d.startsWith(`${year}-${String(month+1).padStart(2,'0')}`))
  const monthPnl = monthEntries.reduce((s, [, v]) => s + v.pnl, 0)
  const winDays = monthEntries.filter(([, v]) => v.pnl > 0).length
  const lossDays = monthEntries.filter(([, v]) => v.pnl < 0).length
  const totalTrades = monthEntries.reduce((s, [, v]) => s + v.trades, 0)
  const allDays = winDays + lossDays
  const consistency = allDays ? (winDays / allDays * 100).toFixed(0) : '—'

  const selectedData = selected ? calendarData[selected] : null

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-header">
        <div>
          <div className="card-title">📅 Profit Calendar</div>
          <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 2 }}>Daily P&L heatmap — click a day to see details</div>
        </div>
      </div>
      <div className="card-body">
        {/* Month stats + nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              ['Month P&L', fmtMoney(monthPnl, true), monthPnl >= 0 ? 'var(--green)' : 'var(--red)'],
              ['Win Days', winDays, 'var(--green)'],
              ['Loss Days', lossDays, 'var(--red)'],
              ['Win Rate', allDays ? winDays / allDays * 100 + '%' : '—', ''],
              ['Trades', totalTrades, ''],
              ['Consistency', consistency === '—' ? '—' : consistency + '%', parseFloat(consistency) >= 50 ? 'var(--green)' : 'var(--red)'],
            ].map(([l, v, c]) => (
              <div key={l}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text4)', marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: c || '#fff' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-sm btn-outline" onClick={() => nav(-1)}>‹</button>
            <span style={{ fontSize: 14, fontWeight: 700, minWidth: 120, textAlign: 'center' }}>{MONTHS[month]} {year}</span>
            <button className="btn btn-sm btn-outline" onClick={() => nav(1)}>›</button>
          </div>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, background: 'var(--border)', marginBottom: 1 }}>
          {DAYS.map(d => (
            <div key={d} style={{ background: 'var(--bg2)', padding: '5px', textAlign: 'center', fontSize: 9, fontWeight: 600, color: 'var(--text4)', letterSpacing: .5 }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="cal-grid">
          {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} className="cal-day empty" />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const data = calendarData[dateStr]
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
            const cls = ['cal-day', isToday ? 'today' : '', data ? (data.pnl >= 0 ? 'profit' : 'loss') : ''].join(' ')
            return (
              <div key={day} className={cls} onClick={() => setSelected(selected === dateStr ? null : dateStr)}
                style={{ outline: selected === dateStr ? '1px solid var(--blue)' : '' }}>
                <div className="cal-day-num">{day}</div>
                {data && <>
                  <div className="cal-day-pnl" style={{ color: data.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtMoney(data.pnl, true)}</div>
                  <div className="cal-day-cnt">{data.trades} trade{data.trades !== 1 ? 's' : ''}</div>
                  <div className={`cal-day-bar ${data.pnl >= 0 ? 'pos' : 'neg'}`} />
                </>}
              </div>
            )
          })}
        </div>

        {/* Selected day detail */}
        {selected && selectedData && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--card2)', border: '1px solid var(--border2)', borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: 12 }}>📅 {selected}</div>
              <button className="btn btn-sm btn-outline" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
              <div><div style={{ fontSize: 9, color: 'var(--text4)' }}>P&L</div><div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)', color: selectedData.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtMoney(selectedData.pnl, true)}</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text4)' }}>TRADES</div><div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)' }}>{selectedData.trades}</div></div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 9, color: 'var(--text4)' }}>
          <span>● <span style={{ color: 'var(--green)' }}>Profitable Day</span></span>
          <span>● <span style={{ color: 'var(--red)' }}>Losing Day</span></span>
          <span>● No Trades</span>
        </div>
      </div>
    </div>
  )
}
