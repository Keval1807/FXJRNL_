export interface Trade {
  id: string
  user_id: string
  symbol: string
  side: 'BUY' | 'SELL'
  lots: number
  entry_price: number | null
  exit_price: number | null
  entry_time: string | null
  exit_time: string | null
  pips: number
  pnl: number
  r_multiple: number | null
  stop_loss: number | null
  take_profit: number | null
  risk_percent: number | null
  session: Session | null
  setup_tag: string | null
  emotion_tag: string | null
  notes: string | null
  post_analysis: string | null
  image_url: string | null
  plan_id: string | null
  created_at: string
  updated_at: string
}

export type Session = 'London' | 'New York' | 'Asian' | 'London/NY Overlap'

export interface TradeStats {
  total: number
  wins: number
  losses: number
  winRate: number
  netPnl: number
  netPips: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  avgRR: number
  maxDrawdown: number
  best: number
  worst: number
}

export interface Setup {
  id: string
  user_id: string
  name: string
  tag: string | null
  description: string | null
  color: string
  rating: number
  created_at: string
}

export interface Mistake {
  id: string
  user_id: string
  name: string
  category: string | null
  description: string | null
  color: string
  occurrence_count: number
  created_at: string
}

export interface TradingPlan {
  id: string
  user_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  rules?: PlanRule[]
}

export interface PlanRule {
  id: string
  plan_id: string
  user_id: string
  rule_text: string
  sort_order: number
}

export interface WeeklyReview {
  id: string
  user_id: string
  week_start: string
  notes: string | null
  sleep_quality: number | null
  stress_level: number | null
  created_at: string
}

export type EmotionTag =
  | '😊 Confident'
  | '😰 Anxious'
  | '😤 FOMO'
  | '🧘 Neutral'
  | '💪 Patient'
  | '😡 Revenge'

export const SYMBOLS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD',
  'GBPJPY', 'AUDUSD', 'USDCAD', 'USDCHF',
  'NZDUSD', 'EURJPY', 'EURGBP', 'GBPAUD',
]

export const SESSIONS: Session[] = [
  'London', 'New York', 'Asian', 'London/NY Overlap',
]

export const SETUP_TAGS = [
  'Break & Retest',
  'Order Block',
  'Fair Value Gap',
  'Liquidity Sweep',
  'ICT Concept',
  'Support/Resistance',
  'Trend Continuation',
  'Reversal',
  'Scalp',
  'News Trade',
]

export const EMOTION_TAGS: EmotionTag[] = [
  '😊 Confident',
  '😰 Anxious',
  '😤 FOMO',
  '🧘 Neutral',
  '💪 Patient',
  '😡 Revenge',
]

export const JPY_PAIRS = ['USDJPY', 'GBPJPY', 'EURJPY', 'CADJPY', 'AUDJPY']
export const XAU_PAIRS = ['XAUUSD', 'XAGUSD']

export function getPipSize(symbol: string): number {
  if (JPY_PAIRS.some(s => symbol.includes(s.replace('USD','').replace('EUR','').replace('GBP','').replace('AUD','').replace('CAD',''))) || symbol.includes('JPY')) return 0.01
  if (XAU_PAIRS.includes(symbol)) return 0.01
  return 0.0001
}
