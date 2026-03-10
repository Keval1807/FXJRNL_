import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')
  const { data: trades } = await supabase.from('trades').select('*').eq('user_id', session.user.id)
  return <AnalyticsClient trades={trades || []} userEmail={session.user.email || ''} />
}
