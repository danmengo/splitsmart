'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'

type Member = {
  userId: string
  user: { name: string | null; email: string }
}

export default function AddExpenseButton({
  groupId,
  members
}: {
  groupId: string
  members: Member[]
}) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [splitType, setSplitType] = useState<'equal' | 'percentage'>('equal')
  const [percentages, setPercentages] = useState<Record<string, string>>(
    Object.fromEntries(members.map(m => [m.userId, '']))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Calculate equal split amount per person
  const equalAmount = amount && members.length
    ? (parseFloat(amount) / members.length).toFixed(2)
    : '0.00'

  // Check percentages add up to 100
  const totalPercentage = Object.values(percentages)
    .reduce((sum, p) => sum + (parseFloat(p) || 0), 0)

  async function handleSubmit() {
    setError(null)

    if (!title.trim() || !amount) {
      setError('Please fill in all fields')
      return
    }

    if (splitType === 'percentage' && Math.abs(totalPercentage - 100) > 0.01) {
      setError(`Percentages must add up to 100% (currently ${totalPercentage}%)`)
      return
    }

    setLoading(true)

    const splits = members.map(member => {
      if (splitType === 'equal') {
        return {
          userId: member.userId,
          amount: parseFloat(amount) / members.length
        }
      } else {
        const pct = parseFloat(percentages[member.userId]) || 0
        return {
          userId: member.userId,
          amount: (parseFloat(amount) * pct) / 100,
          percentage: pct
        }
      }
    })

    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, title, amount, splitType, splits })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    setLoading(false)
    setOpen(false)
    setTitle('')
    setAmount('')
    setPercentages(Object.fromEntries(members.map(m => [m.userId, ''])))
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setError(null) }}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus size={16} />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add an expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>What was it for?</Label>
            <Input
              placeholder="e.g. Electricity bill"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Total amount ($)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
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
                      <span className="text-sm text-gray-700">
                        {member.user.name ?? member.user.email}
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        ${equalAmount}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="percentage" className="mt-3">
                <div className="space-y-2">
                  {members.map(member => (
                    <div key={member.userId} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 flex-1">
                        {member.user.name ?? member.user.email}
                      </span>
                      <div className="flex items-center gap-1 w-28">
                        <Input
                          type="number"
                          placeholder="0"
                          value={percentages[member.userId]}
                          onChange={e => setPercentages(prev => ({
                            ...prev,
                            [member.userId]: e.target.value
                          }))}
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

          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Expense'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}