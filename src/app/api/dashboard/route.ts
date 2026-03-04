import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // All groups the user belongs to
  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.id } } },
    include: {
      expenses: {
        include: {
          splits: true,
          paidBy: true
        }
      }
    }
  })

  // Calculate total owed TO the user (they paid, others owe them)
  let totalOwedToMe = 0
  // Calculate total the user OWES others
  let totalIOwe = 0

  // Spending per group for the chart
  const spendingByGroup = groups.map(group => {
    const myExpenseSplits = group.expenses
      .flatMap(e => e.splits)
      .filter(s => s.userId === user.id)

    const totalIOweInGroup = myExpenseSplits
      .filter(s => {
        const expense = group.expenses.find(e => e.id === s.expenseId)
        return expense?.paidById !== user.id
      })
      .reduce((sum, s) => sum + s.amount, 0)

    const totalOwedToMeInGroup = group.expenses
      .filter(e => e.paidById === user.id)
      .flatMap(e => e.splits)
      .filter(s => s.userId !== user.id)
      .reduce((sum, s) => sum + s.amount, 0)

    totalIOwe += totalIOweInGroup
    totalOwedToMe += totalOwedToMeInGroup

    const totalSpend = myExpenseSplits.reduce((sum, s) => sum + s.amount, 0)

    return {
      name: group.name,
      total: parseFloat(totalSpend.toFixed(2))
    }
  })

  // Recent expenses across all groups
  const recentExpenses = await prisma.expense.findMany({
    where: {
      group: { members: { some: { userId: user.id } } }
    },
    include: {
      paidBy: true,
      group: true,
      splits: { where: { userId: user.id } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  return NextResponse.json({
    totalOwedToMe: parseFloat(totalOwedToMe.toFixed(2)),
    totalIOwe: parseFloat(totalIOwe.toFixed(2)),
    spendingByGroup,
    recentExpenses
  })
}