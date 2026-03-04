'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MarkSplitPaid({
    expenseId,
    userId,
    paid
}: {
    expenseId: string
    userId: string
    paid: boolean
}) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleToggle() {
        setLoading(true)
        await fetch(`/api/expenses/${expenseId}/splits`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, paid: !paid })
        })
        setLoading(false)
        router.refresh()
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${paid
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
        >
            {loading ? '...' : paid ? '✓ Paid' : 'Mark paid'}
        </button>
    )
}