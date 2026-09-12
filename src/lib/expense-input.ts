import { z } from 'zod'

const money = z.union([z.number(), z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/)])
  .transform(Number).pipe(z.number().finite().positive().max(1_000_000_000))
  .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001,
    'Use at most two decimal places')

export const titleInput = z.object({ title: z.string().trim().min(1).max(200) })
export const expenseInput = titleInput.extend({
  amount: money,
  splitType: z.enum(['equal', 'percentage', 'amount']),
  splits: z.array(z.object({
    userId: z.string().min(1),
    amount: z.number().finite().nonnegative().max(1_000_000_000),
    percentage: z.number().finite().min(0).max(100).nullish(),
  })).min(1).max(1000),
})

export type ExpenseInput = z.infer<typeof expenseInput>

// Allocate whole cents deterministically; the largest remainders get leftover cents.
export function normalizeSplits(input: ExpenseInput, memberIds: string[]) {
  const members = new Set(memberIds)
  const ids = input.splits.map(split => split.userId)
  if (new Set(ids).size !== ids.length) throw new Error('Each person can appear only once')
  if (ids.some(id => !members.has(id))) throw new Error('Every participant must belong to this group')
  const splits = [...input.splits].sort((a, b) => a.userId.localeCompare(b.userId))
  const cents = Math.round(input.amount * 100)
  if (input.splitType === 'amount') {
    if (splits.some(split => Math.abs(split.amount * 100 - Math.round(split.amount * 100)) > 0.00001)) {
      throw new Error('Split amounts must use at most two decimal places')
    }
    if (splits.reduce((sum, split) => sum + Math.round(split.amount * 100), 0) !== cents) {
      throw new Error('Split amounts must equal the expense total')
    }
    return splits.map(split => ({ userId: split.userId, amount: Math.round(split.amount * 100) / 100, percentage: null }))
  }
  const totalPercentage = splits.reduce((sum, split) => sum + (split.percentage ?? 0), 0)
  if (input.splitType === 'percentage' &&
      (splits.some(split => split.percentage == null) || Math.abs(totalPercentage - 100) > 0.000001)) {
    throw new Error('Percentages must add up to 100%')
  }
  const shares = splits.map(split => {
    const exact = input.splitType === 'equal' ? cents / splits.length : cents * split.percentage! / totalPercentage
    return { userId: split.userId, cents: Math.floor(exact), remainder: exact - Math.floor(exact),
      percentage: input.splitType === 'percentage' ? split.percentage! : null }
  })
  const remaining = cents - shares.reduce((sum, share) => sum + share.cents, 0)
  const ranked = [...shares].sort((a, b) => b.remainder - a.remainder || a.userId.localeCompare(b.userId))
  for (let i = 0; i < remaining; i++) ranked[i].cents++
  return shares.map(share => ({ userId: share.userId, amount: share.cents / 100, percentage: share.percentage }))
}
