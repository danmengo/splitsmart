import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import InviteMemberButton from '@/components/groups/InviteMemberButton'
import AddExpenseButton from '@/components/expenses/AddExpenseButton'
import ExpenseActions from '@/components/expenses/ExpenseActions'
import MarkSplitPaid from '@/components/expenses/MarkSplitPaid'
import SettleUpButton from '@/components/groups/SettleUpButton'

export const dynamic = 'force-dynamic'

export default async function GroupDetailPage({
  params
}: {
  params: Promise<{ groupId: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { groupId } = await params

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: true } },
      expenses: {
        include: {
          paidBy: true,
          splits: { include: { user: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!group) notFound()

  const isMember = group.members.some(m => m.userId === user.id)
  if (!isMember) redirect('/groups')

  const currentMember = group.members.find(m => m.userId === user.id)
  const isAdmin = currentMember?.role === 'admin'

  // Calculate balances per member
  const balances = group.members.map(member => {
    let balance = 0
    for (const expense of group.expenses) {
      for (const split of expense.splits) {
        if (split.paid) continue // skip settled splits
        if (expense.paidById === member.userId && split.userId !== member.userId) {
          balance += split.amount // others owe this member
        }
        if (split.userId === member.userId && expense.paidById !== member.userId) {
          balance -= split.amount // this member owes others
        }
      }
    }
    return { user: member.user, userId: member.userId, balance }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          {group.description && (
            <p className="text-gray-500 mt-1">{group.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <InviteMemberButton groupId={group.id} />}
          <SettleUpButton
            groupId={group.id}
            members={balances}
            currentUserId={user.id}
          />
          <AddExpenseButton
            groupId={group.id}
            members={group.members.map(m => ({ userId: m.userId, user: m.user }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Members ({group.members.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.members.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-green-100 text-green-700">
                      {member.user.name?.charAt(0).toUpperCase() ?? member.user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.user.name ?? member.user.email}
                    </p>
                    {member.role === 'admin' && (
                      <Badge variant="secondary" className="text-xs">Admin</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Balances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {balances.map(({ user: memberUser, balance }) => (
                <div key={memberUser.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 truncate">
                    {memberUser.name ?? memberUser.email}
                  </span>
                  <span className={`text-sm font-semibold ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-500' : 'text-gray-400'
                    }`}>
                    {balance > 0
                      ? `+$${balance.toFixed(2)}`
                      : balance < 0
                        ? `-$${Math.abs(balance).toFixed(2)}`
                        : 'settled'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Expenses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expenses ({group.expenses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {group.expenses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 font-medium">No expenses yet</p>
                  <p className="text-gray-400 text-sm mt-1">Add your first expense above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {group.expenses.map(expense => {
                    const myShare = expense.splits.find(s => s.userId === user.id)
                    const isPayer = expense.paidById === user.id
                    return (
                      <div key={expense.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{expense.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Paid by {expense.paidBy.name ?? expense.paidBy.email} · {expense.splitType === 'equal' ? 'Split equally' : 'Split by %'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">${expense.amount.toFixed(2)}</p>
                              {myShare && (
                                <p className="text-xs text-gray-500">Your share: ${myShare.amount.toFixed(2)}</p>
                              )}
                            </div>
                            {isPayer && (
                              <ExpenseActions
                                expense={expense}
                                members={group.members.map(m => ({ userId: m.userId, user: m.user }))}
                                currentUserId={user.id}
                              />
                            )}
                          </div>
                        </div>

                        {/* Splits breakdown */}
                        <div className="border-t border-gray-200 pt-2 space-y-1">
                          {expense.splits.map(split => (
                            <div key={split.id} className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {split.user.name ?? split.user.email}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">${split.amount.toFixed(2)}</span>
                                {split.userId === user.id && !isPayer && (
                                  <MarkSplitPaid
                                    expenseId={expense.id}
                                    userId={user.id}
                                    paid={split.paid}
                                  />
                                )}
                                {split.userId !== user.id && isPayer && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${split.paid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {split.paid ? '✓ Paid' : 'Unpaid'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
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
    </div>
  )
}