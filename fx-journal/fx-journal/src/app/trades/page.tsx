import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import TradesClient from './TradesClient'

export default async function TradesPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')

  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', session.user.id)
    .order('exit_time', { ascending: false })

  return <TradesClient trades={trades || []} userEmail={session.user.email || ''} />
}
