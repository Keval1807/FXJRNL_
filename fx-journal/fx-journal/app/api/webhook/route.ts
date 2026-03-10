// app/api/webhook/route.ts
// TradingView sends: POST /api/webhook?secret=YOUR_SECRET
// Alert message format (JSON): {"symbol":"EURUSD","side":"BUY","price":1.085,"lots":0.1,"user_id":"..."}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Validate webhook secret
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    // TradingView sometimes sends plain text
    const text = await req.text()
    try { body = JSON.parse(text) } catch { body = { raw: text } }
  }

  // Required fields
  const { symbol, side, price, lots, user_id, pips, pnl, notes } = body

  if (!symbol || !side || !user_id) {
    return NextResponse.json({ error: 'Missing required fields: symbol, side, user_id' }, { status: 400 })
  }

  // Validate side
  if (!['BUY','SELL'].includes(side.toUpperCase())) {
    return NextResponse.json({ error: 'side must be BUY or SELL' }, { status: 400 })
  }

  const now = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('trades')
    .insert({
      user_id,
      symbol: symbol.toUpperCase(),
      side: side.toUpperCase(),
      lots: parseFloat(lots) || 0.1,
      entry_price: parseFloat(price) || 0,
      exit_price: parseFloat(body.exit_price) || parseFloat(price) || 0,
      entry_time: body.entry_time || now,
      exit_time: now,
      pips: parseFloat(pips) || 0,
      pnl: parseFloat(pnl) || 0,
      notes: notes || `TradingView webhook: ${symbol} ${side}`,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, trade: data })
}
