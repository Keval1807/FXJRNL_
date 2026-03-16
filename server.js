const express = require('express')
const cors = require('cors')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const { load, save } = require('./db')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Serve frontend build in production
app.use(express.static(path.join(__dirname, '../frontend/dist')))

// ─── PIP VALUE LOOKUP ────────────────────────────────────────────────────────
const PIP_VALUES = {
  'EUR/USD':10,'GBP/USD':10,'AUD/USD':10,'NZD/USD':10,
  'USD/CAD':7.3,'USD/CHF':11.2,'USD/JPY':6.7,
  'EUR/JPY':6.7,'GBP/JPY':6.7,'AUD/JPY':6.7,
  'EUR/GBP':12.7,'GBP/AUD':6.8,'EUR/AUD':6.8,'EUR/CAD':7.3,
  'XAU/USD':10,'US30':1,'NAS100':1,'SPX500':1
}

function calcPnl(pair, pips, lots) {
  const pv = (PIP_VALUES[pair] || 10) * lots
  return parseFloat((pips * pv).toFixed(2))
}

// ─── HEALTH ──────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── SETTINGS ────────────────────────────────────────────────────────────────
app.get('/api/settings', (req, res) => {
  res.json(load().settings)
})

app.put('/api/settings', (req, res) => {
  const data = load()
  data.settings = { ...data.settings, ...req.body }
  save(data)
  res.json({ success: true })
})

// ─── TRADES ──────────────────────────────────────────────────────────────────
app.get('/api/trades', (req, res) => {
  const { pair, result, strategy, session, month } = req.query
  let trades = load().trades

  if (pair)     trades = trades.filter(t => t.pair === pair)
  if (strategy) trades = trades.filter(t => t.strategy === strategy)
  if (session)  trades = trades.filter(t => t.session === session)
  if (month)    trades = trades.filter(t => t.date && t.date.startsWith(month))
  if (result === 'win')  trades = trades.filter(t => t.pips > 0)
  if (result === 'loss') trades = trades.filter(t => t.pips < 0)

  // Sort newest first
  trades = [...trades].sort((a, b) => {
    const da = new Date((a.date || '') + 'T' + (a.time || '00:00'))
    const db = new Date((b.date || '') + 'T' + (b.time || '00:00'))
    return db - da
  })

  res.json(trades)
})

app.post('/api/trades', (req, res) => {
  const { date, time, pair, direction, pips, lots, session, strategy, emotion, mistake, notes } = req.body
  if (!pair || pips == null) return res.status(400).json({ error: 'pair and pips required' })

  const pnl = calcPnl(pair, parseFloat(pips), parseFloat(lots || 0.01))
  const trade = {
    id: uuidv4(),
    date: date || new Date().toISOString().split('T')[0],
    time: time || '00:00',
    pair, direction: direction || 'LONG',
    pips: parseFloat(pips),
    lots: parseFloat(lots || 0.01),
    pnl, session: session || '',
    strategy: strategy || '',
    emotion: emotion || '',
    mistake: mistake || '',
    notes: notes || '',
    created_at: new Date().toISOString()
  }

  const data = load()
  data.trades.push(trade)
  save(data)

  res.json({ id: trade.id, pnl })
})

app.delete('/api/trades/:id', (req, res) => {
  const data = load()
  data.trades = data.trades.filter(t => t.id !== req.params.id)
  save(data)
  res.json({ success: true })
})

// ─── STATS ───────────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const data = load()
  const settings = data.settings
  const startBalance = parseFloat(settings.balance || 5000)
  const trades = [...data.trades].sort((a, b) => {
    const da = new Date((a.date||'') + 'T' + (a.time||'00:00'))
    const db = new Date((b.date||'') + 'T' + (b.time||'00:00'))
    return da - db
  })

  const empty = {
    totalTrades:0, wins:0, losses:0, winRate:0, totalPnl:0, totalPips:0,
    grossWin:0, grossLoss:0, profitFactor:0, avgWin:0, avgLoss:0, expectancy:0,
    bestTrade:0, worstTrade:0, accountValue:startBalance, startBalance,
    maxDrawdown:0, maxDrawdownPct:0, consistency:0, largestProfitDay:0, profitNeeded:0,
    equityCurve:[], dailyPnl:[], calendarData:{}, byPair:{}, byStrategy:{},
    bySession:{}, byEmotion:{}, byMistake:{},
    streak:{ current:0, type:null, bestWin:0, worstLoss:0 },
    tradingDays:0, winDays:0, lossDays:0
  }

  if (!trades.length) return res.json(empty)

  const wins = trades.filter(t => t.pips > 0)
  const losses = trades.filter(t => t.pips < 0)
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0)
  const totalPips = trades.reduce((s, t) => s + t.pips, 0)
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0))
  const pf = grossLoss ? grossWin / grossLoss : grossWin > 0 ? 999 : 0
  const avgWin = wins.length ? grossWin / wins.length : 0
  const avgLoss = losses.length ? grossLoss / losses.length : 0
  const expectancy = totalPnl / trades.length
  const pnlArr = trades.map(t => t.pnl)
  const bestTrade = Math.max(...pnlArr)
  const worstTrade = Math.min(...pnlArr)

  // Equity curve + max drawdown
  let cum = startBalance, peak = startBalance, maxDD = 0, maxDDPct = 0
  const equityCurve = trades.map(t => {
    cum += t.pnl
    if (cum > peak) peak = cum
    const dd = peak - cum
    const ddPct = (dd / peak) * 100
    if (dd > maxDD) { maxDD = dd; maxDDPct = ddPct }
    return { date: t.date, time: t.time, value: parseFloat(cum.toFixed(2)), pnl: parseFloat(t.pnl.toFixed(2)) }
  })

  // Daily P&L map
  const dailyMap = {}
  trades.forEach(t => { dailyMap[t.date] = (dailyMap[t.date] || 0) + t.pnl })
  const dailyPnl = Object.entries(dailyMap).map(([date, pnl]) => ({ date, pnl: parseFloat(pnl.toFixed(2)) }))

  // Prop-firm consistency
  const positiveDays = Object.values(dailyMap).filter(v => v > 0)
  const totalPositive = positiveDays.reduce((s, v) => s + v, 0)
  const largestDay = Math.max(...positiveDays, 0)
  const consistency = totalPositive > 0 ? (largestDay / totalPositive) * 100 : 0
  const target = largestDay / 0.15
  const profitNeeded = consistency > 15 && totalPositive < target ? target - totalPositive : 0

  // Calendar data
  const calendarData = {}
  trades.forEach(t => {
    if (!calendarData[t.date]) calendarData[t.date] = { pnl: 0, trades: 0 }
    calendarData[t.date].pnl += t.pnl
    calendarData[t.date].trades++
  })

  // Group by field helper
  function groupBy(field) {
    const g = {}
    trades.forEach(t => {
      const k = t[field] || 'None'
      if (!g[k]) g[k] = { trades: 0, wins: 0, pnl: 0, pips: 0, best: -Infinity }
      g[k].trades++
      if (t.pips > 0) g[k].wins++
      g[k].pnl = parseFloat((g[k].pnl + t.pnl).toFixed(2))
      g[k].pips = parseFloat((g[k].pips + t.pips).toFixed(1))
      if (t.pnl > g[k].best) g[k].best = t.pnl
    })
    return g
  }

  // Streaks
  let bw = 0, bl = 0, cw = 0, cl = 0
  trades.forEach(t => {
    if (t.pips > 0) { cw++; cl = 0; if (cw > bw) bw = cw }
    else { cl++; cw = 0; if (cl > bl) bl = cl }
  })
  const last = trades[trades.length - 1]
  let cur = 0, type = last.pips > 0 ? 'win' : 'loss'
  for (let i = trades.length - 1; i >= 0; i--) {
    const ok = (type === 'win' && trades[i].pips > 0) || (type === 'loss' && trades[i].pips < 0)
    if (ok) cur++; else break
  }

  // Trading days
  const allDayKeys = Object.keys(dailyMap)
  const winDays = Object.values(dailyMap).filter(v => v > 0).length
  const lossDays = Object.values(dailyMap).filter(v => v < 0).length

  res.json({
    totalTrades: trades.length, wins: wins.length, losses: losses.length,
    winRate: parseFloat((wins.length / trades.length * 100).toFixed(1)),
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    totalPips: parseFloat(totalPips.toFixed(1)),
    grossWin: parseFloat(grossWin.toFixed(2)),
    grossLoss: parseFloat(grossLoss.toFixed(2)),
    profitFactor: parseFloat(pf.toFixed(2)),
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    expectancy: parseFloat(expectancy.toFixed(2)),
    bestTrade: parseFloat(bestTrade.toFixed(2)),
    worstTrade: parseFloat(worstTrade.toFixed(2)),
    accountValue: parseFloat((startBalance + totalPnl).toFixed(2)),
    startBalance,
    maxDrawdown: parseFloat(maxDD.toFixed(2)),
    maxDrawdownPct: parseFloat(maxDDPct.toFixed(2)),
    consistency: parseFloat(consistency.toFixed(1)),
    largestProfitDay: parseFloat(largestDay.toFixed(2)),
    profitNeeded: parseFloat(profitNeeded.toFixed(2)),
    equityCurve, dailyPnl, calendarData,
    byPair: groupBy('pair'), byStrategy: groupBy('strategy'),
    bySession: groupBy('session'), byEmotion: groupBy('emotion'),
    byMistake: groupBy('mistake'),
    streak: { current: cur, type, bestWin: bw, worstLoss: bl },
    tradingDays: allDayKeys.length, winDays, lossDays
  })
})

// ─── BACKTESTS ────────────────────────────────────────────────────────────────
app.get('/api/backtests', (req, res) => {
  const data = load()
  const sorted = [...data.backtests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  res.json(sorted)
})

app.post('/api/backtests', (req, res) => {
  const bt = {
    id: uuidv4(),
    date: new Date().toISOString().split('T')[0],
    strategy: req.body.strategy || '',
    pair: req.body.pair || '',
    timeframe: req.body.timeframe || '',
    trades: parseInt(req.body.trades) || 0,
    win_rate: parseFloat(req.body.win_rate) || 0,
    net_pips: parseFloat(req.body.net_pips) || 0,
    notes: req.body.notes || '',
    created_at: new Date().toISOString()
  }
  const data = load()
  data.backtests.push(bt)
  save(data)
  res.json({ id: bt.id })
})

app.delete('/api/backtests/:id', (req, res) => {
  const data = load()
  data.backtests = data.backtests.filter(b => b.id !== req.params.id)
  save(data)
  res.json({ success: true })
})

// ─── CATCH-ALL (SPA) ─────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/dist/index.html')
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.json({ message: 'Backend running. Start frontend with: cd frontend && npm run dev' })
  }
})

// ─── START ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════╗')
  console.log('║  KK TRADING JOURNAL — KEVAL KABARIYA  ║')
  console.log('╚═══════════════════════════════════════╝')
  console.log(`\n✅ Backend:  http://localhost:${PORT}`)
  console.log('✅ API:      http://localhost:' + PORT + '/api/health')
  console.log('\n📋 Start frontend in another terminal:')
  console.log('   cd frontend && npm run dev')
  console.log('   Then open: http://localhost:3000\n')
})
