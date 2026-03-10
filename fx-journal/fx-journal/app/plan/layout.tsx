// app/dashboard/layout.tsx  (shared by all inner pages)
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import { computeStats } from '@/types'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth/login')

  // Fetch trades for sidebar stats
  const { data: trades } = await supabase
    .from('trades')
    .select('pnl, pips, exit_time')
    .eq('user_id', session.user.id)

  const stats = computeStats((trades || []) as any)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0e1117' }}>
      <Sidebar
        userEmail={session.user.email}
        stats={stats}
        tradeCount={trades?.length || 0}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-12 min-h-[48px] flex items-center px-5 gap-3 border-b"
          style={{ background: '#151b25', borderColor: '#1e2d42' }}>
          <div className="flex-1 text-[11px] font-semibold uppercase tracking-widest text-tx3">
            {new Date().toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).toUpperCase()}
          </div>
          <a href="/trades" className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all text-tx2 hover:text-tx hover:border-teal"
            style={{ borderColor: '#263650', background: '#1a2232' }}>
            + Add Trade
          </a>
        </header>
        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-5 mesh-bg">
          {children}
        </div>
      </main>
    </div>
  )
}
