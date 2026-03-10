import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import AIClient from './AIClient'

export default async function AIPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')
  const { data: trades } = await supabase.from('trades').select('*').eq('user_id', session.user.id)
  return <AIClient trades={trades || []} userEmail={session.user.email || ''} />
}
