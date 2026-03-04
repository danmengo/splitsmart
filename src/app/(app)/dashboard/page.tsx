import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Receipt, TrendingUp, TrendingDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import SpendingChart from '@/components/dashboard/SpendingChart'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all data in parallel for performance
  const [groupCount, groups, recentExpenses] = await Promise.all([
    prisma.groupMember.count({ where: { userId: user.id } }),
    prisma.group.findMany({
      where: { members: { some: { userId: user.id } } },
      include: {
        expenses: {
          include: { splits: true }
        }
      }
    }),
    prisma.expense.findMany({
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
  ])

  // Calculate balances
  // Calculate balances
  let totalOwedToMe = 0
  let totalIOwe = 0
  const spendingByGroup: { name: string; total: number }[] = []

  for (const group of groups) {
    for (const expense of group.expenses) {
      for (const split of expense.splits) {
        if (split.userId === user.id) {
          // This is my share of an expense
          if (expense.paidById !== user.id) {
            // Someone else paid — I owe them
            totalIOwe += split.amount
          }
        } else {
          // This is someone else's share
          if (expense.paidById === user.id) {
            // I paid — they owe me
            totalOwedToMe += split.amount
          }
        }
      }
    }

    // Calculate my total spend in this group for the chart
    let myGroupSpend = 0
    for (const expense of group.expenses) {
      for (const split of expense.splits) {
        if (split.userId === user.id) {
          myGroupSpend += split.amount
        }
      }
    }

    if (myGroupSpend > 0) {
      spendingByGroup.push({
        name: group.name,
        total: parseFloat(myGroupSpend.toFixed(2))
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {user.user_metadata.full_name ?? user.email}!
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Your Groups</CardTitle>
            <Users size={18} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{groupCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
            <Receipt size={18} className="text-gray-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recentExpenses.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">You Are Owed</CardTitle>
            <TrendingUp size={18} className="text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${totalOwedToMe.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">You Owe</CardTitle>
            <TrendingDown size={18} className="text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              ${totalIOwe.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by Group</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingChart data={spendingByGroup} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No expenses yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((expense: {
                  id: string
                  title: string
                  amount: number
                  createdAt: Date
                  splits: { amount: number }[]
                  paidBy: { name: string | null; email: string }
                  group: { name: string }
                }) => {
                  const myShare = expense.splits[0]
                  return (
                    <div key={expense.id} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{expense.title}</p>
                        <p className="text-xs text-gray-400">
                          {expense.group.name} · {formatDistanceToNow(new Date(expense.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${expense.amount.toFixed(2)}</p>
                        {myShare && (
                          <p className="text-xs text-gray-400">
                            Your share: ${myShare.amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}