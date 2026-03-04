'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Trash2, LogOut } from 'lucide-react'

export default function GroupActions({
    groupId,
    isAdmin
}: {
    groupId: string
    isAdmin: boolean
}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    async function handleDelete() {
        setLoading(true)
        const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' })
        const data = await res.json()

        if (!res.ok) {
            setError(data.error)
            setLoading(false)
            return
        }

        setLoading(false)
        setOpen(false)
        router.push('/groups')
        router.refresh()
    }

    async function handleLeave() {
        setLoading(true)
        const res = await fetch(`/api/groups/${groupId}`, { method: 'PATCH' })
        const data = await res.json()

        if (!res.ok) {
            setError(data.error)
            setLoading(false)
            return
        }

        setLoading(false)
        setOpen(false)
        router.push('/groups')
        router.refresh()
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); setError(null) }}>
            <DialogTrigger asChild>
                {isAdmin ? (
                    <Button variant="destructive" className="flex items-center gap-2">
                        <Trash2 size={16} />
                        Delete Group
                    </Button>
                ) : (
                    <Button variant="outline" className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:border-red-300">
                        <LogOut size={16} />
                        Leave Group
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{isAdmin ? 'Delete group?' : 'Leave group?'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    {isAdmin ? (
                        <p className="text-sm text-gray-600">
                            Are you sure you want to delete this group? This will permanently delete all expenses, splits and data. <span className="font-medium text-red-500">This cannot be undone.</span>
                        </p>
                    ) : (
                        <p className="text-sm text-gray-600">
                            Are you sure you want to leave this group? You'll lose access to all expenses and will need to be re-invited to rejoin.
                        </p>
                    )}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={isAdmin ? handleDelete : handleLeave}
                            disabled={loading}
                        >
                            {loading
                                ? 'Please wait...'
                                : isAdmin
                                    ? 'Delete Group'
                                    : 'Leave Group'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}