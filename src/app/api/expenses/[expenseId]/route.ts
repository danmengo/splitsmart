import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { expenseInput, titleInput, normalizeSplits } from '@/lib/expense-input'
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

// Title-only edits retain the original split records and payment history.
export async function PUT(request: Request, { params }: { params: Promise<{ expenseId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { expenseId } = await params
  const body = await request.json().catch(() => null)
  const titleOnly = body && typeof body === 'object' && Object.keys(body).every(key => key === 'title')
  const title = titleInput.safeParse(body)
  const financial = expenseInput.safeParse(body)
  if (!title.success || (!titleOnly && !financial.success)) {
    return NextResponse.json({ error: 'Provide a title, positive amount and valid splits' }, { status: 400 })
  }
  return prisma.$transaction(async tx => {
    const expense = await tx.expense.findUnique({ where: { id: expenseId },
      include: { splits: true, group: { include: { members: true } } } })
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    if (expense.paidById !== user.id || !expense.group.members.some(member => member.userId === user.id)) {
      return NextResponse.json({ error: 'Only the payer, while still a group member, can edit this expense' }, { status: 403 })
    }
    if (titleOnly) return NextResponse.json(await tx.expense.update({ where: { id: expenseId }, data: title.data }))
    if (!financial.success) return NextResponse.json({ error: 'Invalid expense' }, { status: 400 })
    if (expense.splits.some(split => split.paid && split.userId !== expense.paidById)) {
      return NextResponse.json({ error: 'This expense has settled shares. You can change its title, but not its amounts or participants.' }, { status: 409 })
    }
    let splits
    try { splits = normalizeSplits(financial.data, expense.group.members.map(member => member.userId)) }
    catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }) }
    await tx.expenseSplit.deleteMany({ where: { expenseId } })
    return NextResponse.json(await tx.expense.update({ where: { id: expenseId }, data: {
      title: financial.data.title, amount: financial.data.amount, splitType: financial.data.splitType,
      splits: { create: splits },
    } }))
  }, { isolationLevel: 'Serializable' })
}
