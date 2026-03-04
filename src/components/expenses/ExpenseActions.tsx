'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pencil, Trash2 } from 'lucide-react'

type Member = {
  userId: string
  user: { name: string | null; email: string }
}

type Expense = {
  id: string
  title: string
  amount: number
  splitType: string
  splits: { userId: string; amount: number; percentage: number | null }[]
}

export default function ExpenseActions({
  expense,
  members,
  currentUserId
}: {
  expense: Expense
  members: Member[]
  currentUserId: string
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [title, setTitle] = useState(expense.title)
  const [amount, setAmount] = useState(expense.amount.toString())
  const [splitType, setSplitType] = useState<'equal' | 'percentage'>(expense.splitType as 'equal' | 'percentage')
  const [percentages, setPercentages] = useState<Record<string, string>>(
    Object.fromEntries(
      expense.splits.map(s => [s.userId, s.percentage?.toString() ?? ''])
    )
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Only show actions if current user paid for this expense
  if (expense.splits.find(s => s.userId === currentUserId) === undefined) return null
  const isPayer = expense.splits[0]?.userId === currentUserId ||
    members.find(m => m.userId === currentUserId) !== undefined

  if (expense.splits.length > 0) {
    const payerCheck = currentUserId
    if (!payerCheck) return null
  }

  const totalPercentage = Object.values(percentages)
    .reduce((sum, p) => sum + (parseFloat(p) || 0), 0)

  const equalAmount = amount && members.length
    ? (parseFloat(amount) / members.length).toFixed(2)
    : '0.00'

  async function handleEdit() {
    setError(null)
    if (!title.trim() || !amount) { setError('Please fill in all fields'); return }
    if (splitType === 'percentage' && Math.abs(totalPercentage - 100) > 0.01) {
      setError(`Percentages must add up to 100% (currently ${totalPercentage}%)`)
      return
    }

    setLoading(true)
    const splits = members.map(member => {
      if (splitType === 'equal') {
        return { userId: member.userId, amount: parseFloat(amount) / members.length }
      } else {
        const pct = parseFloat(percentages[member.userId]) || 0
        return { userId: member.userId, amount: (parseFloat(amount) * pct) / 100, percentage: pct }
      }
    })

    const res = await fetch(`/api/expenses/${expense.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, amount, splitType, splits })
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error)
      setLoading(false)
      return
    }

    setLoading(false)
    setEditOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/expenses/${expense.id}`, { method: 'DELETE' })
    setLoading(false)
    setDeleteOpen(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setEditOpen(true)}
          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>What was it for?</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Total amount ($)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>How to split?</Label>
              <Tabs value={splitType} onValueChange={v => setSplitType(v as 'equal' | 'percentage')}>
                <TabsList className="w-full">
                  <TabsTrigger value="equal" className="flex-1">Split Equally</TabsTrigger>
                  <TabsTrigger value="percentage" className="flex-1">By Percentage</TabsTrigger>
                </TabsList>
                <TabsContent value="equal" className="mt-3">
                  <div className="space-y-2">
                    {members.map(member => (
                      <div key={member.userId} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-700">{member.user.name ?? member.user.email}</span>
                        <span className="text-sm font-medium text-green-600">${equalAmount}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="percentage" className="mt-3">
                  <div className="space-y-2">
                    {members.map(member => (
                      <div key={member.userId} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 flex-1">{member.user.name ?? member.user.email}</span>
                        <div className="flex items-center gap-1 w-28">
                          <Input
                            type="number"
                            value={percentages[member.userId]}
                            onChange={e => setPercentages(prev => ({ ...prev, [member.userId]: e.target.value }))}
                            className="text-right"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                        <span className="text-sm font-medium text-green-600 w-16 text-right">
                          ${amount ? ((parseFloat(amount) * (parseFloat(percentages[member.userId]) || 0)) / 100).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    ))}
                    <div className={`text-xs mt-1 text-right ${Math.abs(totalPercentage - 100) < 0.01 ? 'text-green-500' : 'text-red-500'}`}>
                      Total: {totalPercentage.toFixed(1)}% {Math.abs(totalPercentage - 100) < 0.01 ? '✓' : '(must equal 100%)'}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full" onClick={handleEdit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete expense?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <span className="font-medium">"{expense.title}"</span>? This will remove all splits and cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}