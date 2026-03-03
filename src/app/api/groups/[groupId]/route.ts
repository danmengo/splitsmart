import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId } = await params

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: true }
      }
    }
  })

  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

  // Make sure the logged in user is actually in this group
  const isMember = group.members.some(m => m.userId === user.id)
  if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(group)
}