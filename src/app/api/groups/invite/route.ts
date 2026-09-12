import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const inviteInput = z.object({ groupId: z.string().min(1), email: z.string().trim().email().toLowerCase() })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = inviteInput.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Provide a group and valid email' }, { status: 400 })
  const { groupId, email } = parsed.data
  return prisma.$transaction(async tx => {
    const requester = await tx.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: user.id } } })
    if (requester?.role !== 'admin') return NextResponse.json({ error: 'Only admins can invite members' }, { status: 403 })
    const invitedUser = await tx.user.findUnique({ where: { email } })
    if (!invitedUser) return NextResponse.json({ error: 'No user found with that email' }, { status: 404 })
    const added = await tx.groupMember.createMany({ data: [{ groupId, userId: invitedUser.id, role: 'member' }], skipDuplicates: true })
    if (!added.count) return NextResponse.json({ error: 'User is already in this group' }, { status: 409 })
    await tx.notification.create({ data: { userId: invitedUser.id, message: 'You were added to a group!' } })
    return NextResponse.json({ success: true })
  }, { isolationLevel: 'Serializable' })
}
