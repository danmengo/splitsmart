'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CheckCircle } from 'lucide-react'

type Member = {
    userId: string
    user: { name: string | null; email: string }
    balance: number
}

export default function SettleUpButton({
    groupId,
    members,
    currentUserId
}: {
    groupId: string
    members: Member[]
    currentUserId: string
}) {
    const [loading, setLoading] = useState<string | null>(null)
    const [open, setOpen] = useState(false)
    const router = useRouter()

    // Only show members that have a non-zero balance with current user
    const otherMembers = members.filter(m => m.userId !== currentUserId && m.balance !== 0)

    async function handleSettle(withUserId: string) {
        setLoading(withUserId)
        await fetch(`/api/groups/${groupId}/settle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ withUserId })
        })
        setLoading(null)
        setOpen(false)
        router.refresh()
    }

    if (otherMembers.length === 0) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    Settle Up
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Settle up</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                    <p className="text-sm text-gray-500">
                        Select a person to mark all debts between you as settled.
                    </p>
                    {otherMembers.map(member => (
                        <div key={member.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {member.user.name ?? member.user.email}
                                </p>
                                <p className={`text-xs mt-0.5 ${member.balance > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {member.balance > 0
                                        ? `You owe $${member.balance.toFixed(2)}`
                                        : `Owes you $${Math.abs(member.balance).toFixed(2)}`}
                                </p>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleSettle(member.userId)}
                                disabled={loading === member.userId}
                            >
                                {loading === member.userId ? 'Settling...' : 'Settle'}
                            </Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}