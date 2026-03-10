'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import AddTradeModal from '@/components/trades/AddTradeModal'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Trade } from '@/types'
import { computeStats, fmt, fmtPips } from '@/lib/utils'

function TradesContent({ trades, userEmail }: { trades: Trade[], userEmail: string }) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTrade, setEditTrade] = useState<Trade | null>(null)
  const [filter, setFilter] = useState<'all' | 'BUY' | 'SELL' | 'win' | 'loss'>('all')
  const [search, setSearch] = useState('')
  const stats = computeStats(trades)

  const filtered = useMemo(() => {
    let t = [...trades]
    if (filter === 'BUY') t = t.filter(x => x.side === 'BUY')
    else if (filter === 'SELL') t = t.filter(x => x.side === 'SELL')
    else if (filter === 'win') t = t.filter(x => x.pnl > 0)
    else if (filter === 'loss') t = t.filter(x => x.pnl <= 0)
    if (search) t = t.filter(x => (x.symbol + x.setup_tag + x.notes + x.emotion_tag).toLowerCase().includes(search.toLowerCase()))
    return t
  }, [trades, filter, search])

  async function deleteTrade(id: string) {
    if (!confirm('Delete this trade?')) return
    await supabase.from('trades').delete().eq('id', id)
    toast('Trade deleted', 'r')
    router.refresh()
  }

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'BUY', label: 'Long' },
    { key: 'SELL', label: 'Short' },
    { key: 'win', label: 'Wins' },
    { key: 'loss', label: 'Losses' },
  ] as const

  return (
    <AppShell stats={stats} userEmail={userEmail} tradeCount={trades.length} pageTitle="Trade Log"
      action={<button className="btn-primary text-xs py-1.5 px-4" onClick={() => { setEditTrade(null); setModalOpen(true) }}>+ Log Trade</button>}>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1.5">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                ${filter === f.key ? 'bg-green/15 border-green text-green' : 'bg-bg3 border-border2 text-tx2 hover:border-border3'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="input max-w-44 py-1.5 text-xs"
          placeholder="Search symbol, setup…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="ml-auto text-xs text-tx3 font-mono">{filtered.length} trades</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-bg3">
                {['Date', 'Symbol', 'Side', 'Lots', 'Entry', 'Exit', 'Pips', 'P&L', 'Setup', 'Session', 'Emotion', 'Notes', ''].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-bold uppercase tracking-wide text-[9.5px] text-tx3 border-b border-border whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-12 text-center text-tx3">
                    No trades found. <button onClick={() => setModalOpen(true)} className="text-green hover:underline">Log your first trade →</button>
                  </td>
                </tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-bg3 transition-colors cursor-pointer" onClick={() => { setEditTrade(t); setModalOpen(true) }}>
                  <td className="px-3 py-2 font-mono text-tx3">{t.exit_time?.split('T')[0] || '—'}</td>
                  <td className="px-3 py-2 font-bold">{t.symbol}</td>
                  <td className="px-3 py-2"><span className={t.side === 'BUY' ? 'pill-buy' : 'pill-sell'}>{t.side}</span></td>
                  <td className="px-3 py-2 font-mono">{t.lots?.toFixed(2)}</td>
                  <td className="px-3 py-2 font-mono text-tx2">{t.entry_price || '—'}</td>
                  <td className="px-3 py-2 font-mono text-tx2">{t.exit_price || '—'}</td>
                  <td className={`px-3 py-2 font-mono font-bold ${t.pips >= 0 ? 'text-green' : 'text-red'}`}>{fmtPips(t.pips)}</td>
                  <td className={`px-3 py-2 font-mono font-bold ${t.pnl >= 0 ? 'text-green' : 'text-red'}`}>{t.pnl >= 0 ? '+' : ''}${t.pnl?.toFixed(2)}</td>
                  <td className="px-3 py-2 text-tx2">{t.setup_tag || '—'}</td>
                  <td className="px-3 py-2 text-tx2">{t.session || '—'}</td>
                  <td className="px-3 py-2">{t.emotion_tag || '—'}</td>
                  <td className="px-3 py-2 text-tx3 max-w-32 truncate">{t.notes || '—'}</td>
                  <td className="px-3 py-2">
                    <button onClick={e => { e.stopPropagation(); deleteTrade(t.id) }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-red/10 border border-red/20 text-red hover:bg-red hover:text-white transition-all">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddTradeModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTrade(null) }}
        onSaved={() => router.refresh()} editTrade={editTrade} />
    </AppShell>
  )
}

export default function TradesClient(props: { trades: Trade[], userEmail: string }) {
  return <ToastProvider><TradesContent {...props} /></ToastProvider>
}
