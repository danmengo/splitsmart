import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false }
  })

  return <AppShell unreadCount={unreadCount} name={user.user_metadata.full_name || user.email || 'Your account'}>{children}</AppShell>
}
