'use client'
// components/Sidebar.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Stats } from '@/types'

const NAV = [
  { group: 'OVERVIEW', items: [
    { href: '/dashboard',    label: 'Dashboard',      icon: '⬡' },
    { href: '/trades',       label: 'Trade Log',      icon: '📋', badge: true },
    { href: '/analytics',    label: 'Analytics',      icon: '📈' },
  ]},
  { group: 'PERFORMANCE', items: [
    { href: '/setups',       label: 'Setups',         icon: '🎯' },
    { href: '/mistakes',     label: 'Mistakes',       icon: '⚠️' },
    { href: '/weekly',       label: 'Weekly Review',  icon: '📆' },
  ]},
  { group: 'INTELLIGENCE', items: [
    { href: '/ai-insights',  label: 'AI Insights',    icon: '✦', ai: true },
    { href: '/plan',         label: 'My Plan',        icon: '📝' },
  ]},
]

interface Props {
  userEmail?: string
  stats: Stats
  tradeCount: number
}

export default function Sidebar({ userEmail, stats, tradeCount }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const username = userEmail?.split('@')[0]?.toUpperCase() || 'USER'

  return (
    <aside className="w-[210px] min-w-[210px] flex flex-col border-r overflow-hidden"
      style={{ background: '#151b25', borderColor: '#1e2d42' }}>

      {/* Brand */}
      <div className="p-4 pb-3 border-b" style={{ borderColor: '#1e2d42' }}>
        <div className="text-base font-extrabold tracking-tighter">FX JOURNAL</div>
        <div className="text-[9px] font-semibold tracking-[1.5px] uppercase text-tx3 mt-0.5">Terminal Pro</div>
        <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase"
          style={{ background: 'rgba(0,212,160,.15)', border: '1px solid rgba(0,212,160,.3)', color: '#00d4a0' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00d4a0' }} />
          LIVE
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 py-3 flex flex-col gap-4">
        {NAV.map(({ group, items }) => (
          <div key={group}>
            <div className="text-[9px] font-bold tracking-[1px] uppercase px-2 mb-1.5" style={{ color: '#2a3f55' }}>{group}</div>
            {items.map(({ href, label, icon, badge, ai }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href}
                  className={cn(
                    'relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-all',
                    active ? 'nav-active text-teal' : 'text-tx2 hover:bg-bg-3 hover:text-tx'
                  )}
                  style={active ? { background: 'linear-gradient(90deg, rgba(0,212,160,.12), transparent)' } : {}}>
                  <span className="w-[18px] text-center text-sm leading-none">{icon}</span>
                  <span className="flex-1">{label}</span>
                  {badge && tradeCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-black"
                      style={{ background: '#00d4a0' }}>{tradeCount}</span>
                  )}
                  {ai && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #9b6dff, #00b4e6)' }}>AI</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t" style={{ borderColor: '#1e2d42' }}>
        <div className="text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#4a607a' }}>Logged in as</div>
        <div className="font-extrabold tracking-widest text-sm mb-2" style={{ color: '#00d4a0' }}>{username}</div>
        <div className="flex flex-col gap-0.5 text-[10px] font-mono mb-3">
          <div className="flex justify-between">
            <span style={{ color: '#4a607a' }}>WIN RATE</span>
            <span className="font-bold" style={{ color: '#00d4a0' }}>{stats.winRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#4a607a' }}>NET PIPS</span>
            <span className="font-bold" style={{ color: stats.netPips >= 0 ? '#00d4a0' : '#e64040' }}>
              {stats.netPips >= 0 ? '+' : ''}{stats.netPips.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#4a607a' }}>R:R</span>
            <span className="font-bold" style={{ color: '#f5a623' }}>{stats.avgRR.toFixed(2)}:1</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#4a607a' }}>TRADES</span>
            <span className="font-bold">{stats.total}</span>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-1.5 text-[11px] transition-colors hover:text-rose"
          style={{ color: '#4a607a' }}>
          <span>⊙</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
