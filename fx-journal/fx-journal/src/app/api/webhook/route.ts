import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * TradingView Webhook Receiver
 *
 * In TradingView, set your alert message to JSON:
 * {
 *   "secret": "your-webhook-secret",
 *   "user_id": "your-supabase-user-id",
 *   "symbol": "{{ticker}}",
 *   "side": "BUY",
 *   "price": {{close}},
 *   "lots": 0.1
 * }
 *
 * Webhook URL: https://your-app.vercel.app/api/webhook
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate webhook secret
    const secret = process.env.WEBHOOK_SECRET
    if (secret && body.secret !== secret) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    const { user_id, symbol, side, price, lots, pips, pnl, session, notes } = body

    if (!user_id || !symbol || !side) {
      return NextResponse.json({ error: 'Missing required fields: user_id, symbol, side' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    const { data, error } = await supabase.from('trades').insert({
      user_id,
      symbol: symbol.replace('FX:', '').replace('=X', ''),
      side: side.toUpperCase() === 'BUY' ? 'BUY' : 'SELL',
      lots: parseFloat(lots) || 0.1,
      entry_price: parseFloat(price) || null,
      exit_time: new Date().toISOString(),
      pips: parseFloat(pips) || 0,
      pnl: parseFloat(pnl) || 0,
      session: session || null,
      notes: notes || 'Auto-logged via TradingView webhook',
    }).select().single()

    if (error) {
      console.error('Webhook DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, trade_id: data.id })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
