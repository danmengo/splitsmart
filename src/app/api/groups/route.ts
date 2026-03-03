import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/groups - fetch all groups for the logged in user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.id } } },
    include: { members: { include: { user: true } } },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(groups)
}

// POST /api/groups - create a new group
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description } = await request.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const group = await prisma.group.create({
    data: {
      name,
      description,
      createdBy: user.id,
      members: {
        create: { userId: user.id, role: 'admin' }
      }
    },
    include: { members: { include: { user: true } } }
  })

  return NextResponse.json(group, { status: 201 })
}