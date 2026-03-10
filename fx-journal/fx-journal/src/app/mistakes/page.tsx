import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import MistakesClient from './MistakesClient'

export default async function MistakesPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')
  const { data: trades } = await supabase.from('trades').select('id').eq('user_id', session.user.id)
  const { data: mistakes } = await supabase.from('mistakes').select('*').eq('user_id', session.user.id).order('occurrence_count', { ascending: false })
  return <MistakesClient mistakes={mistakes || []} tradeCount={trades?.length || 0} userEmail={session.user.email || ''} />
}
