import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import Link from 'next/link'
import CreateGroupButton from '@/components/groups/CreateGroupButton'

export const dynamic = 'force-dynamic'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.id } } },
    include: { members: { include: { user: true } } },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-teal-950">Groups</h1>
          <p className="text-gray-500 mt-1">Manage your expense groups</p>
        </div>
        <CreateGroupButton />
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No groups yet</p>
          <p className="text-slate-500 text-sm mt-1">Create a group to start splitting expenses</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="h-full hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg transition-all cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  {group.description && (
                    <p className="text-sm text-gray-500">{group.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <Users size={14} />
                    <span>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}