'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UserMinus } from 'lucide-react'

export default function RemoveMemberButton({
    groupId,
    userId,
    userName
}: {
    groupId: string
    userId: string
    userName: string
}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    async function handleRemove() {
        setLoading(true)
        const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
            method: 'DELETE'
        })
        const data = await res.json()

        if (!res.ok) {
            setError(data.error)
            setLoading(false)
            return
        }

        setLoading(false)
        setOpen(false)
        router.refresh()
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="p-1 text-gray-300 hover:text-red-500 transition-colors"
            >
                <UserMinus size={14} />
            </button>

            <Dialog open={open} onOpenChange={(o) => { setOpen(o); setError(null) }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Remove member?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to remove <span className="font-medium">{userName}</span> from this group? They will lose access to all expenses and will need to be re-invited to rejoin.
                        </p>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={handleRemove}
                                disabled={loading}
                            >
                                {loading ? 'Removing...' : 'Remove'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}