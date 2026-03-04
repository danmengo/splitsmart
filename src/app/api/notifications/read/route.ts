import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// POST /api/notifications/read - mark one or all notifications as read
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { notificationId } = await request.json()

  if (notificationId) {
    // Mark a single notification as read
    await prisma.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { read: true }
    })
  } else {
    // Mark ALL notifications as read
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true }
    })
  }

  return NextResponse.json({ success: true })
}