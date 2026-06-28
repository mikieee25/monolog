'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCategories, getBudgets, setBudget } from '@/app/actions'
import { keys } from '@/lib/query-keys'
import { Loader2, Target, CheckCircle2 } from 'lucide-react'
import { DynamicIcon } from '@/components/DynamicIcon'

interface Props {
  open: boolean
  onClose: () => void
}

export function BudgetsModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  
  const { data: categories = [] } = useQuery({ queryKey: keys.categories(), queryFn: () => getCategories('expense') })
  const { data: budgets = [], isLoading } = useQuery({ queryKey: ['budgets'], queryFn: getBudgets })

  const [savingId, setSavingId] = useState<string | null>(null)
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  // Initialize amounts when budgets load
  if (budgets.length > 0 && Object.keys(amounts).length === 0) {
    const initial: Record<string, string> = {}
    budgets.forEach((b: any) => {
      initial[b.category_id] = String(b.amount)
    })
    setAmounts(initial)
  }

  const mutation = useMutation({
    mutationFn: async ({ categoryId, amount }: { categoryId: string, amount: number }) => {
      await setBudget({ category_id: categoryId, amount })
    },
    onMutate: ({ categoryId }) => setSavingId(categoryId),
    onSettled: () => {
      setSavingId(null)
      qc.invalidateQueries({ queryKey: ['budgets'] })
    }
  })

  const handleSave = (categoryId: string) => {
    const val = Number(amounts[categoryId])
    if (isNaN(val) || val <= 0) return
    mutation.mutate({ categoryId, amount: val })
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-stone-950/80 backdrop-blur-2xl border-stone-800 text-stone-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Monthly Budgets
          </DialogTitle>
          <DialogDescription className="text-stone-400">
            Set monthly spending limits per category. The AI Vibe Check will monitor your pacing.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-stone-500" />
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {categories.map(c => {
              const currentBudget = budgets.find((b: any) => b.category_id === c.id)
              const savedAmount = currentBudget ? String(currentBudget.amount) : ''
              const isChanged = amounts[c.id] !== undefined && amounts[c.id] !== savedAmount && amounts[c.id] !== ''

              return (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-900/50 border border-stone-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg">
                      <DynamicIcon name={c.emoji || 'CircleDollarSign'} className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <span className="font-medium text-stone-200">{c.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 font-medium">$</span>
                      <Input 
                        type="number"
                        placeholder="0.00"
                        value={amounts[c.id] ?? savedAmount}
                        onChange={(e) => setAmounts(prev => ({ ...prev, [c.id]: e.target.value }))}
                        className="w-24 pl-6 text-right bg-stone-950 border-stone-800"
                      />
                    </div>
                    
                    {isChanged ? (
                      <Button 
                        size="sm"
                        onClick={() => handleSave(c.id)}
                        disabled={savingId === c.id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        {savingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                      </Button>
                    ) : (
                      currentBudget && (
                        <div className="w-9 h-9 flex items-center justify-center text-emerald-500">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
