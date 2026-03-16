import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export default api

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PIP_VALUES = {
  'EUR/USD':10,'GBP/USD':10,'AUD/USD':10,'NZD/USD':10,'USD/CAD':7.3,
  'USD/CHF':11.2,'USD/JPY':6.7,'EUR/JPY':6.7,'GBP/JPY':6.7,'AUD/JPY':6.7,
  'EUR/GBP':12.7,'GBP/AUD':6.8,'EUR/AUD':6.8,'XAU/USD':10,'US30':1,'NAS100':1,'SPX500':1
}

export function pipVal(pair, lots) {
  return (PIP_VALUES[pair] || 10) * (lots || 0.01)
}

export function calcPnl(pair, pips, lots) {
  return parseFloat((pips * pipVal(pair, lots)).toFixed(2))
}

export function fmtMoney(v, showSign = false) {
  const sign = showSign && v > 0 ? '+' : ''
  return sign + '$' + Math.abs(v).toFixed(2)
}

export function fmtPct(v) {
  return (v > 0 ? '+' : '') + v.toFixed(2) + '%'
}

export function clsx(...args) {
  return args.filter(Boolean).join(' ')
}
