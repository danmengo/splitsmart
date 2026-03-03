import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Receipt } from 'lucide-react'
import InviteMemberButton from '@/components/groups/InviteMemberButton'

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
      members: {
        include: { user: true }
      }
    }
  })

  if (!group) notFound()

  // Make sure logged in user is a member
  const isMember = group.members.some(m => m.userId === user.id)
  if (!isMember) redirect('/groups')

  const currentMember = group.members.find(m => m.userId === user.id)
  const isAdmin = currentMember?.role === 'admin'

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
        {isAdmin && <InviteMemberButton groupId={group.id} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members Card */}
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
                  <p className="text-xs text-gray-400 truncate">{member.user.email}</p>
                </div>
                {member.role === 'admin' && (
                  <Badge variant="secondary" className="text-xs">Admin</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Expenses placeholder */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Receipt size={36} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No expenses yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Expenses are coming in Phase 5!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}