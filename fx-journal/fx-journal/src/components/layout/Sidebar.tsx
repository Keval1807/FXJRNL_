'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { TradeStats } from '@/types'
import { fmt, fmtPips } from '@/lib/utils'

const NAV = [
  { label: 'Overview', items: [
    { href: '/dashboard', icon: '⬡', label: 'Dashboard' },
    { href: '/trades',    icon: '📋', label: 'Trade Log' },
    { href: '/analytics', icon: '📈', label: 'Analytics' },
  ]},
  { label: 'Performance', items: [
    { href: '/setups',    icon: '🎯', label: 'Setups' },
    { href: '/mistakes',  icon: '⚠️',  label: 'Mistakes' },
    { href: '/weekly',    icon: '📆', label: 'Weekly Review' },
  ]},
  { label: 'Intelligence', items: [
    { href: '/ai',   icon: '✦', label: 'AI Insights', badge: 'AI', badgeClass: 'bg-purple text-white' },
    { href: '/plan', icon: '📝', label: 'My Plan' },
  ]},
]

interface SidebarProps {
  stats: TradeStats
  userEmail: string
  tradeCount: number
}

export default function Sidebar({ stats, userEmail, tradeCount }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-52 min-w-52 bg-bg2 border-r border-border flex flex-col overflow-hidden">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-border flex-shrink-0">
        <div className="text-base font-black tracking-tight">FX JOURNAL</div>
        <div className="text-[9px] font-semibold uppercase tracking-widest text-tx3 mb-2">Terminal Pro</div>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-green/15 border border-green/30 text-green text-[9px] font-bold tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map(group => (
          <div key={group.label} className="mb-4">
            <div className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-tx4">{group.label}</div>
            {group.items.map(item => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-all mb-0.5 relative
                    ${active
                      ? 'text-green bg-green/10'
                      : 'text-tx2 hover:bg-bg3 hover:text-tx'
                    }`}
                >
                  {active && <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-green rounded-r" />}
                  <span className="text-sm w-4 text-center flex-shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.href === '/trades' && (
                    <span className="text-[9px] font-bold bg-green text-black px-1.5 py-0.5 rounded-full">{tradeCount}</span>
                  )}
                  {item.badge && item.href !== '/trades' && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeClass}`}>{item.badge}</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border flex-shrink-0">
        <div className="text-[9px] font-semibold uppercase tracking-wider text-tx4 mb-1">Logged in as</div>
        <div className="text-sm font-black text-green uppercase tracking-wide mb-2">
          {userEmail.split('@')[0]}
        </div>
        <div className="space-y-0.5 text-[10px] font-mono mb-3">
          <div className="flex justify-between">
            <span className="text-tx3 uppercase tracking-wide">Win Rate</span>
            <span className={`font-bold ${stats.winRate >= 50 ? 'text-green' : 'text-red'}`}>{stats.winRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tx3 uppercase tracking-wide">Net Pips</span>
            <span className={`font-bold ${stats.netPips >= 0 ? 'text-green' : 'text-red'}`}>{fmtPips(stats.netPips)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tx3 uppercase tracking-wide">R:R</span>
            <span className="font-bold text-gold">{stats.avgRR.toFixed(2)}:1</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tx3 uppercase tracking-wide">Trades</span>
            <span className="font-bold">{stats.total}</span>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-xs text-tx3 hover:text-red transition-colors"
        >
          <span>⊙</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
