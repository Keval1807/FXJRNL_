import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import SetupsClient from './SetupsClient'

export default async function SetupsPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')
  const { data: trades } = await supabase.from('trades').select('id,setup_tag').eq('user_id', session.user.id)
  const { data: setups } = await supabase.from('setups').select('*').eq('user_id', session.user.id).order('created_at')
  return <SetupsClient setups={setups || []} tradeCount={trades?.length || 0} userEmail={session.user.email || ''} tradeTags={(trades || []).map(t => t.setup_tag).filter(Boolean)} />
}
