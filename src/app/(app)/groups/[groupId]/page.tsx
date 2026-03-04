import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import InviteMemberButton from '@/components/groups/InviteMemberButton'
import AddExpenseButton from '@/components/expenses/AddExpenseButton'
import ExpenseActions from '@/components/expenses/ExpenseActions'

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

  // Calculate what each person owes / is owed
  const balances = group.members.map(member => {
    const totalPaid = group.expenses
      .filter(e => e.paidById === member.userId)
      .reduce((sum, e) => sum + e.amount, 0)

    const totalOwed = group.expenses
      .flatMap(e => e.splits)
      .filter(s => s.userId === member.userId)
      .reduce((sum, s) => sum + s.amount, 0)

    return {
      user: member.user,
      balance: totalPaid - totalOwed // positive = owed money, negative = owes money
    }
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
          <AddExpenseButton
            groupId={group.id}
            members={group.members.map(m => ({ userId: m.userId, user: m.user }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Members + Balances */}
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
                  <span className={`text-sm font-semibold ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {balance > 0 ? `+$${balance.toFixed(2)}` : balance < 0 ? `-$${Math.abs(balance).toFixed(2)}` : 'settled'}
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
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                              <p className="text-xs text-gray-500 mt-0.5">Your share: ${myShare.amount.toFixed(2)}</p>
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