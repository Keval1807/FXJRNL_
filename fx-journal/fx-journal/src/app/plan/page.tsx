import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import PlanClient from './PlanClient'

export default async function PlanPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')
  const { data: trades } = await supabase.from('trades').select('id').eq('user_id', session.user.id)
  const { data: notes } = await supabase.from('plan_notes').select('content').eq('user_id', session.user.id).single()
  return (
    <PlanClient
      tradeCount={trades?.length || 0}
      userEmail={session.user.email || ''}
      initialContent={notes?.content || ''}
    />
  )
}
