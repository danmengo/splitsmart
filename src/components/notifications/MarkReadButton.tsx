'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function MarkReadButton({ notificationId }: { notificationId?: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleMarkRead() {
    setLoading(true)

    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId })
    })

    setLoading(false)
    router.refresh()
  }

  // If no notificationId, this is the "mark all read" button
  if (!notificationId) {
    return (
      <Button variant="outline" size="sm" onClick={handleMarkRead} disabled={loading}>
        {loading ? 'Marking...' : 'Mark all read'}
      </Button>
    )
  }

  return (
    <button
      onClick={handleMarkRead}
      disabled={loading}
      className="text-xs text-green-600 hover:text-green-700 font-medium flex-shrink-0"
    >
      {loading ? '...' : 'Mark read'}
    </button>
  )
}