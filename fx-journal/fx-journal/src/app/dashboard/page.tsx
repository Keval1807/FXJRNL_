import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', session.user.id)
    .order('exit_time', { ascending: false })

  return <DashboardClient trades={trades || []} userEmail={session.user.email || ''} />
}
