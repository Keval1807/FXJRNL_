import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import WeeklyClient from './WeeklyClient'

export default async function WeeklyPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/')
  const { data: trades } = await supabase.from('trades').select('*').eq('user_id', session.user.id)
  const weekStart = new Date()
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay())
  const weekStr = weekStart.toISOString().split('T')[0]
  const { data: review } = await supabase.from('weekly_reviews').select('*').eq('user_id', session.user.id).eq('week_start', weekStr).single()
  return <WeeklyClient trades={trades || []} userEmail={session.user.email || ''} weekStart={weekStr} review={review || null} />
}
