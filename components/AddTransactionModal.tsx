'use client'

import { useState, useEffect } from 'react'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { keys } from '@/lib/query-keys'
import { getAccounts, getCategories, addTransaction, updateTransaction } from '@/app/actions'
import { suggestCategoryAndWallet } from '@/app/actions/ai'
import { cn } from '@/lib/utils'
import { DynamicIcon } from './DynamicIcon'
import { Switch } from '@/components/ui/switch'
import { Sparkles } from 'lucide-react'
import type { PaymentMethod, TransactionType, Transaction } from '@/lib/types'

interface Props { 
  open: boolean; 
  onClose: () => void;
  initialData?: Transaction | null;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash',          label: 'Cash'          },
  { value: 'card',          label: 'Card'          },
  { value: 'bank_transfer', label: 'Bank Transfer' },
]

export function AddTransactionModal({ open, onClose, initialData }: Props) {
  const qc = useQueryClient()
  const isEdit = !!initialData

  const { data: accounts }   = useSuspenseQuery({ queryKey: keys.accounts,     queryFn: getAccounts })
  const { data: categories } = useSuspenseQuery({ queryKey: keys.categories(), queryFn: () => getCategories() })

  const [type, setType]         = useState<TransactionType>('expense')
  const [amount, setAmount]     = useState('')
  const [desc, setDesc]         = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId,  setAccountId]  = useState('')
  const [payment,    setPayment]    = useState<PaymentMethod>('cash')
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0])
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceDay, setRecurrenceDay] = useState('')
  const [error, setError]       = useState('')

  useEffect(() => {
    if (open) {
      if (initialData) {
        setType(initialData.type)
        setAmount(String(initialData.amount))
        setDesc(initialData.description || '')
        setCategoryId(initialData.category_id || '')
        setAccountId(initialData.account_id || '')
        setPayment(initialData.payment_method)
        setDate(initialData.date)
      } else {
        setType('expense')
        setAmount('')
        setDesc('')
        setCategoryId('')
        setAccountId('')
        setPayment('cash')
        setDate(new Date().toISOString().split('T')[0])
        setIsRecurring(false)
        setRecurrenceDay('')
      }
      setError('')
    }
  }, [open, initialData])

  const [isCategorizing, setIsCategorizing] = useState(false)

  const handleDescriptionBlur = async () => {
    if (isEdit || !desc.trim()) return

    setIsCategorizing(true)
    try {
      const simplifiedCategories = categories.map(c => ({ id: c.id, name: c.name }))
      const simplifiedAccounts = accounts.map(a => ({ id: a.id, name: a.name }))
      
      const suggestion = await suggestCategoryAndWallet(desc, simplifiedCategories, simplifiedAccounts)
      if (suggestion) {
        if (suggestion.categoryId) {
          setCategoryId(suggestion.categoryId)
        }
        if (suggestion.accountId) {
          setAccountId(suggestion.accountId)
        }
        if (suggestion.paymentMethod) {
          setPayment(suggestion.paymentMethod as PaymentMethod)
        }
        if (suggestion.amount !== null && !amount) {
          setAmount(String(suggestion.amount))
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsCategorizing(false)
    }
  }

  const filteredCategories = categories.filter(c => c.type === type)

  const mutation = useMutation({
    mutationFn: async (input: Parameters<typeof addTransaction>[0]) => {
      if (isEdit) {
        await updateTransaction(initialData.id, input)
      } else {
        await addTransaction(input)
      }
    },

    // ── Optimistic update ──────────────────────────────────────────────────
    onMutate: async (input) => {
      if (isEdit) return {} // skip optimistic update for edits to keep it simple

      await qc.cancelQueries({ queryKey: keys.transactions() })
      await qc.cancelQueries({ queryKey: keys.balance })
      await qc.cancelQueries({ queryKey: keys.monthlySpending })

      const prevTxs     = qc.getQueryData<Transaction[]>(keys.transactions())
      const prevBal     = qc.getQueryData<number>(keys.balance) ?? 0
      const prevSpend   = qc.getQueryData<number>(keys.monthlySpending) ?? 0

      const cat  = categories.find(c => c.id === input.category_id)
      const acc  = accounts.find(a => a.id === input.account_id)

      const optimistic: Transaction = {
        id:             `optimistic-${Date.now()}`,
        user_id:        '',
        account_id:     input.account_id,
        category_id:    input.category_id,
        amount:         input.amount,
        type:           input.type,
        payment_method: input.payment_method,
        description:    input.description ?? null,
        date:           input.date,
        created_at:     new Date().toISOString(),
        category:       cat ? { name: cat.name, emoji: cat.emoji, type: cat.type } : null,
        account:        acc ? { name: acc.name, emoji: acc.emoji } : null,
      }

      qc.setQueryData<Transaction[]>(keys.transactions(), old => [optimistic, ...(old ?? [])])
      const delta = input.type === 'income' ? input.amount : -input.amount
      qc.setQueryData<number>(keys.balance, prevBal + delta)
      if (input.type === 'expense') {
        qc.setQueryData<number>(keys.monthlySpending, prevSpend + input.amount)
      }

      return { prevTxs, prevBal, prevSpend }
    },

    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prevTxs) {
        qc.setQueryData(keys.transactions(), ctx.prevTxs)
        qc.setQueryData(keys.balance, ctx.prevBal)
        qc.setQueryData(keys.monthlySpending, ctx.prevSpend)
      }
      setError('Failed to save. Please try again.')
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.transactions() })
      qc.invalidateQueries({ queryKey: keys.balance })
      qc.invalidateQueries({ queryKey: keys.monthlySpending })
    },

    onSuccess: () => {
      onClose()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) return setError('Enter a valid amount.')
    if (!categoryId) return setError('Select a category.')
    if (!accountId)  return setError('Select an account.')
    
    let parsedDay: number | undefined = undefined
    if (isRecurring && !isEdit) {
      parsedDay = parseInt(recurrenceDay, 10)
      if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
        return setError('Enter a valid day of the month (1-31) for the recurring transaction.')
      }
    }
    
    setError('')
    mutation.mutate({ 
      amount: parsed, 
      type, 
      description: desc, 
      category_id: categoryId, 
      account_id: accountId, 
      payment_method: payment, 
      date,
      is_recurring: isRecurring && !isEdit,
      recurrence_day: parsedDay
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 max-w-sm rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{isEdit ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Income / Expense toggle */}
          <div className="flex rounded-xl bg-zinc-800 p-1 gap-1">
            {(['expense', 'income'] as TransactionType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategoryId('') }}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize',
                  type === t
                    ? t === 'expense'
                      ? 'bg-rose-500 text-white'
                      : 'bg-emerald-500 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <Label className="text-xs text-zinc-400 mb-1 block">Amount (₱)</Label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-50 text-lg font-semibold placeholder:text-zinc-600 h-12"
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label className="text-xs text-zinc-400 mb-1 block">Category</Label>
            <Select value={categoryId} onValueChange={v => v && setCategoryId(v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-50">
                {categoryId ? (
                  <span className="truncate flex items-center gap-2">
                    <DynamicIcon name={filteredCategories.find(c => c.id === categoryId)?.emoji || ''} className="w-4 h-4 text-zinc-400" />
                    {filteredCategories.find(c => c.id === categoryId)?.name}
                  </span>
                ) : (
                  <span className="text-zinc-400">Select category</span>
                )}
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {filteredCategories.map(c => (
                  <SelectItem key={c.id} value={c.id} className="text-zinc-100">
                    <div className="flex items-center gap-2">
                      <DynamicIcon name={c.emoji} className="w-4 h-4 text-zinc-400" />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account */}
          <div>
            <Label className="text-xs text-zinc-400 mb-1 block">Account</Label>
            <Select value={accountId} onValueChange={v => v && setAccountId(v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-50">
                {accountId ? (
                  <span className="truncate flex items-center gap-2">
                    <DynamicIcon name={accounts.find(a => a.id === accountId)?.emoji || ''} className="w-4 h-4 text-zinc-400" />
                    {accounts.find(a => a.id === accountId)?.name}
                  </span>
                ) : (
                  <span className="text-zinc-400">Select account</span>
                )}
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id} className="text-zinc-100">
                    <div className="flex items-center gap-2">
                      <DynamicIcon name={a.emoji} className="w-4 h-4 text-zinc-400" />
                      {a.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment method */}
          <div>
            <Label className="text-xs text-zinc-400 mb-1 block">Payment Method</Label>
            <div className="flex gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPayment(m.value)}
                  className={cn(
                    'flex-1 py-1.5 text-xs rounded-lg border transition-all',
                    payment === m.value
                      ? 'bg-zinc-100 text-zinc-900 border-zinc-100 font-semibold'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-zinc-400">Description (optional)</Label>
              {isCategorizing && (
                <span className="text-[10px] text-indigo-400 font-medium flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" /> Auto-categorizing...
                </span>
              )}
            </div>
            <Input
              placeholder="e.g. Jollibee, Grab ride…"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              onBlur={handleDescriptionBlur}
              className="bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-600"
            />
          </div>

          {/* Date */}
          <div>
            <Label className="text-xs text-zinc-400 mb-1 block">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-50"
            />
          </div>

          {/* Recurring Toggle (Only for New) */}
          {!isEdit && (
            <div className="flex items-center justify-between bg-zinc-800 p-3 rounded-xl border border-zinc-700">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-zinc-200">Recurring Transaction</Label>
                <p className="text-xs text-zinc-400">Automatically repeat this every month</p>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
          )}

          {isRecurring && !isEdit && (
            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">Day of the month (1-31)</Label>
              <Input
                type="number"
                min="1" max="31"
                value={recurrenceDay}
                onChange={e => setRecurrenceDay(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-50"
                required={isRecurring}
                placeholder="e.g., 15"
              />
            </div>
          )}

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-12 text-sm font-semibold bg-zinc-50 text-zinc-900 hover:bg-white rounded-xl"
          >
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
