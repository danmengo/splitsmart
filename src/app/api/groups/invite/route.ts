import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// POST /api/groups/invite - invite a user to a group by email
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId, email } = await request.json()

  // Find the user being invited
  const invitedUser = await prisma.user.findUnique({ where: { email } })
  if (!invitedUser) return NextResponse.json({ error: 'No user found with that email' }, { status: 404 })

  // Check if already a member
  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: invitedUser.id } }
  })
  if (existing) return NextResponse.json({ error: 'User is already in this group' }, { status: 400 })

  // Add them to the group
  await prisma.groupMember.create({
    data: { groupId, userId: invitedUser.id, role: 'member' }
  })

  // Create a notification for the invited user
  await prisma.notification.create({
    data: {
      userId: invitedUser.id,
      message: `You were added to a group!`
    }
  })

  return NextResponse.json({ success: true })
}