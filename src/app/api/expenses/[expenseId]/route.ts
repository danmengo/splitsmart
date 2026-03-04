import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// DELETE /api/expenses/:expenseId
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { expenseId } = await params

  // Make sure the expense exists and the user paid for it
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId }
  })

  if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  if (expense.paidById !== user.id) return NextResponse.json({ error: 'Only the person who paid can delete this expense' }, { status: 403 })

  // Deleting the expense also deletes all splits (cascade)
  await prisma.expense.delete({ where: { id: expenseId } })

  return NextResponse.json({ success: true })
}

// PUT /api/expenses/:expenseId
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { expenseId } = await params
  const { title, amount, splitType, splits } = await request.json()

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId }
  })

  if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  if (expense.paidById !== user.id) return NextResponse.json({ error: 'Only the person who paid can edit this expense' }, { status: 403 })

  // Update expense and recalculate splits in a transaction
  const updated = await prisma.$transaction(async (tx) => {
    const updatedExpense = await tx.expense.update({
      where: { id: expenseId },
      data: {
        title,
        amount: parseFloat(amount),
        splitType,
      }
    })

    // Delete old splits and recreate with new amounts
    await tx.expenseSplit.deleteMany({ where: { expenseId } })
    await tx.expenseSplit.createMany({
      data: splits.map((split: { userId: string; amount: number; percentage?: number }) => ({
        expenseId,
        userId: split.userId,
        amount: split.amount,
        percentage: split.percentage ?? null,
      }))
    })

    return updatedExpense
  })

  return NextResponse.json(updated)
}