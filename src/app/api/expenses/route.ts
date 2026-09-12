import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { expenseInput, normalizeSplits } from '@/lib/expense-input'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createInput = expenseInput.extend({ groupId: z.string().min(1) })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = createInput.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Provide a title, positive amount and valid splits' }, { status: 400 })
  const input = parsed.data
  return prisma.$transaction(async tx => {
    const members = await tx.groupMember.findMany({ where: { groupId: input.groupId } })
    if (!members.some(member => member.userId === user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    let splits
    try { splits = normalizeSplits(input, members.map(member => member.userId)) }
    catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }) }
    const expense = await tx.expense.create({
      data: { groupId: input.groupId, paidById: user.id, title: input.title, amount: input.amount,
        splitType: input.splitType, splits: { create: splits } },
    })
    const notifications = splits.filter(split => split.userId !== user.id).map(split => ({
      userId: split.userId, message: `A new expense "${input.title}" of $${input.amount.toFixed(2)} was added to your group`,
    }))
    if (notifications.length) await tx.notification.createMany({ data: notifications })
    return NextResponse.json(expense, { status: 201 })
  }, { isolationLevel: 'Serializable' })
}
