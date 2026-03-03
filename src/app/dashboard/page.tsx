import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome, {user.user_metadata.full_name ?? user.email}!</h1>
      <p className="text-gray-500 mt-2">Your dashboard is coming soon.</p>
    </div>
  )
}