import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId, title, amount, splitType, splits } = await request.json()

  if (!groupId || !title || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify user is a member of this group
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } }
  })
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Create expense and all splits in one transaction
  // A transaction means: either ALL of this succeeds, or NONE of it does
  // This prevents situations like the expense being created but splits failing
  const expense = await prisma.$transaction(async (tx) => {
    const newExpense = await tx.expense.create({
      data: {
        groupId,
        paidById: user.id,
        title,
        amount: parseFloat(amount),
        splitType,
      }
    })

    // Create a split record for each member
    await tx.expenseSplit.createMany({
      data: splits.map((split: { userId: string; amount: number; percentage?: number }) => ({
        expenseId: newExpense.id,
        userId: split.userId,
        amount: split.amount,
        percentage: split.percentage ?? null,
      }))
    })

    // Notify everyone else in the group
    const otherMembers = splits
      .filter((s: { userId: string }) => s.userId !== user.id)
      .map((s: { userId: string }) => ({
        userId: s.userId,
        message: `A new expense "${title}" of $${parseFloat(amount).toFixed(2)} was added to your group`
      }))

    if (otherMembers.length > 0) {
      await tx.notification.createMany({ data: otherMembers })
    }

    return newExpense
  })

  return NextResponse.json(expense, { status: 201 })
}