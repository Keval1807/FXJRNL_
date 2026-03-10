import { Trade, TradeStats } from '@/types'

export function computeStats(trades: Trade[]): TradeStats {
  if (!trades.length) {
    return { total: 0, wins: 0, losses: 0, winRate: 0, netPnl: 0, netPips: 0, avgWin: 0, avgLoss: 0, profitFactor: 0, avgRR: 0, maxDrawdown: 0, best: 0, worst: 0 }
  }
  const wins = trades.filter(t => t.pnl > 0)
  const losses = trades.filter(t => t.pnl <= 0)
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0))
  const winRate = (wins.length / trades.length) * 100
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0
  const avgWin = wins.length ? grossProfit / wins.length : 0
  const avgLoss = losses.length ? grossLoss / losses.length : 0
  const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0)
  const netPips = trades.reduce((s, t) => s + t.pips, 0)

  // Max drawdown
  let peak = 100000, equity = 100000, maxDrawdown = 0
  const sorted = [...trades].sort((a, b) =>
    new Date(a.exit_time || a.created_at).getTime() - new Date(b.exit_time || b.created_at).getTime()
  )
  for (const t of sorted) {
    equity += t.pnl
    if (equity > peak) peak = equity
    const dd = ((peak - equity) / peak) * 100
    if (dd > maxDrawdown) maxDrawdown = dd
  }

  return {
    total: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    netPnl,
    netPips,
    avgWin,
    avgLoss,
    profitFactor,
    avgRR,
    maxDrawdown,
    best: wins.length ? Math.max(...wins.map(t => t.pnl)) : 0,
    worst: losses.length ? Math.min(...losses.map(t => t.pnl)) : 0,
  }
}

export function getEquityCurve(trades: Trade[], startBalance = 100000) {
  const sorted = [...trades].sort((a, b) =>
    new Date(a.exit_time || a.created_at).getTime() - new Date(b.exit_time || b.created_at).getTime()
  )
  let equity = startBalance
  const points = [{ date: 'Start', equity }]
  for (const t of sorted) {
    equity += t.pnl
    points.push({
      date: (t.exit_time || t.created_at).split('T')[0],
      equity: Math.round(equity * 100) / 100,
    })
  }
  return points
}

export function getMonthlyPnL(trades: Trade[]) {
  const byMonth: Record<string, number> = {}
  for (const t of trades) {
    const d = new Date(t.exit_time || t.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    byMonth[key] = (byMonth[key] || 0) + t.pnl
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, pnl]) => ({ month, pnl: Math.round(pnl * 100) / 100 }))
}

export function getDailyPnL(trades: Trade[]) {
  const byDay: Record<string, number> = {}
  for (const t of trades) {
    const key = (t.exit_time || t.created_at).split('T')[0]
    byDay[key] = (byDay[key] || 0) + t.pnl
  }
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => ({ date, pnl: Math.round(pnl * 100) / 100 }))
}

export function getPnLBySymbol(trades: Trade[]) {
  const bySymbol: Record<string, { pnl: number; count: number }> = {}
  for (const t of trades) {
    if (!bySymbol[t.symbol]) bySymbol[t.symbol] = { pnl: 0, count: 0 }
    bySymbol[t.symbol].pnl += t.pnl
    bySymbol[t.symbol].count++
  }
  return Object.entries(bySymbol)
    .sort(([, a], [, b]) => b.pnl - a.pnl)
    .map(([symbol, { pnl, count }]) => ({ symbol, pnl: Math.round(pnl * 100) / 100, count }))
}

export function getPnLBySession(trades: Trade[]) {
  const bySession: Record<string, number> = {}
  for (const t of trades) {
    const s = t.session || 'Unknown'
    bySession[s] = (bySession[s] || 0) + t.pnl
  }
  return Object.entries(bySession).map(([session, pnl]) => ({ session, pnl: Math.round(pnl * 100) / 100 }))
}

export function getPnLByEmotion(trades: Trade[]) {
  const byEmotion: Record<string, { pnl: number; wins: number; count: number }> = {}
  for (const t of trades) {
    const e = t.emotion_tag || 'Untagged'
    if (!byEmotion[e]) byEmotion[e] = { pnl: 0, wins: 0, count: 0 }
    byEmotion[e].pnl += t.pnl
    byEmotion[e].count++
    if (t.pnl > 0) byEmotion[e].wins++
  }
  return Object.entries(byEmotion).map(([emotion, { pnl, wins, count }]) => ({
    emotion,
    pnl: Math.round(pnl * 100) / 100,
    winRate: count ? Math.round((wins / count) * 100) : 0,
    count,
  }))
}

export function fmt(v: number, prefix = '$'): string {
  return `${v >= 0 ? '' : '-'}${prefix}${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtPips(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}`
}

export function fmtPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

export function getCurrentWeekStart(): Date {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - d.getUTCDay())
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export function parseCsvTrades(csv: string): Partial<Trade>[] {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s"]/g, ''))
  const trades: Partial<Trade>[] = []

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = vals[idx] || '' })

    // Smart column mapping
    const get = (...keys: string[]) => {
      for (const k of keys) {
        if (row[k]) return row[k]
      }
      return undefined
    }

    trades.push({
      symbol: get('symbol', 'pair', 'instrument') || 'EURUSD',
      side: (get('side', 'direction', 'type') || 'BUY').toUpperCase().includes('BUY') ? 'BUY' : 'SELL',
      lots: parseFloat(get('lots', 'size', 'volume', 'qty') || '0.1') || 0.1,
      entry_price: parseFloat(get('entry', 'entryprice', 'open') || '0') || null,
      exit_price: parseFloat(get('exit', 'exitprice', 'close') || '0') || null,
      pnl: parseFloat(get('pnl', 'profit', 'p&l', 'result') || '0') || 0,
      pips: parseFloat(get('pips', 'points') || '0') || 0,
      exit_time: get('date', 'exittime', 'closetime', 'exitdate') || new Date().toISOString(),
      notes: get('notes', 'comment', 'remarks') || null,
    })
  }
  return trades
}
