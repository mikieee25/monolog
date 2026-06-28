'use client'

import { useState } from 'react'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { getRecentTransactions, deleteTransaction } from '@/app/actions'
import { formatCurrency, formatDateLabel, paymentMethodLabel } from '@/lib/utils'
import type { Transaction } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddTransactionModal } from '@/components/AddTransactionModal'
import { DynamicIcon } from './DynamicIcon'
import { toast } from 'sonner'
import { motion, useAnimation, PanInfo } from 'framer-motion'
import { useMediaQuery } from '@/hooks/use-media-query'

/** Group transactions by their date string */
function groupByDate(txs: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>()
  for (const tx of txs) {
    const label = formatDateLabel(tx.date)
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(tx)
  }
  return map
}

export function TransactionFeed({ filter }: { filter?: any | null }) {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const qc = useQueryClient()

  const { data: transactions } = useSuspenseQuery({
    queryKey: keys.transactions(),
    queryFn: () => getRecentTransactions(30),
  })

  let filteredTransactions = transactions?.filter(tx => !hiddenIds.has(tx.id)) || []

  if (filter && filteredTransactions.length > 0) {
    filteredTransactions = filteredTransactions.filter(tx => {
      if (filter.type && tx.type !== filter.type) return false
      if (filter.categoryId && tx.category_id !== filter.categoryId) return false
      if (filter.startDate && tx.date < filter.startDate) return false
      if (filter.endDate && tx.date > filter.endDate) return false
      if (filter.keyword) {
        const kw = filter.keyword.toLowerCase()
        if (!tx.description?.toLowerCase().includes(kw) && !tx.category?.name.toLowerCase().includes(kw)) {
          return false
        }
      }
      return true
    })
  }

  if (!filteredTransactions || filteredTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <DynamicIcon name="Coins" className="w-10 h-10 mb-3 text-zinc-500" />
        <p className="text-sm text-zinc-500">No transactions yet.</p>
        <p className="text-xs text-zinc-600 mt-1">Tap + to add your first one.</p>
      </div>
    )
  }

  const grouped = groupByDate(filteredTransactions)

  return (
    <div className="space-y-5 pb-4">
      {Array.from(grouped.entries()).map(([dateLabel, txs]) => (
        <div key={dateLabel}>
          {/* Date group header */}
          <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">
            {dateLabel}
          </p>

          <div className="space-y-0.5 overflow-hidden">
            {txs.map((tx) => (
              <TransactionRow 
                key={tx.id} 
                tx={tx} 
                onEdit={() => setEditingTx(tx)} 
                onHide={() => setHiddenIds(prev => new Set(prev).add(tx.id))}
                onRestore={() => {
                  setHiddenIds(prev => {
                    const next = new Set(prev)
                    next.delete(tx.id)
                    return next
                  })
                }}
              />
            ))}
          </div>
        </div>
      ))}
      <AddTransactionModal 
        open={!!editingTx} 
        onClose={() => setEditingTx(null)} 
        initialData={editingTx} 
      />
    </div>
  )
}

function TransactionRow({ 
  tx, 
  onEdit, 
  onHide, 
  onRestore 
}: { 
  tx: Transaction
  onEdit: () => void
  onHide: () => void
  onRestore: () => void
}) {
  const qc = useQueryClient()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const controls = useAnimation()
  
  const isIncome = tx.type === 'income'
  const amountStr = (isIncome ? '+' : '−') + formatCurrency(tx.amount)

  const deleteMutation = useMutation({
    mutationFn: () => deleteTransaction(tx.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.transactions() })
      qc.invalidateQueries({ queryKey: keys.balance })
      qc.invalidateQueries({ queryKey: keys.monthlySpending })
    }
  })

  const handleDeleteIntent = () => {
    // Optimistic hide
    onHide()
    toast('Transaction deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          onRestore()
          toast.dismiss()
        }
      },
      onAutoClose: () => {
        deleteMutation.mutate()
      },
      onDismiss: () => {
        deleteMutation.mutate()
      }
    })
  }

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const offset = info.offset.x
    const velocity = info.velocity.x

    // Swipe Left to Delete
    if (offset < -80 || velocity < -500) {
      await controls.start({ x: -window.innerWidth, transition: { duration: 0.2 } })
      handleDeleteIntent()
    } 
    // Swipe Right to Edit
    else if (offset > 80 || velocity > 500) {
      await controls.start({ x: 0 })
      onEdit()
    } 
    // Snap back
    else {
      controls.start({ x: 0, transition: { type: 'spring', bounce: 0.4 } })
    }
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-zinc-900">
      {/* Background Actions (Visible on Swipe) */}
      <div className="absolute inset-0 flex items-center justify-between px-4 text-white font-medium text-sm">
        <div className="flex items-center gap-2 text-indigo-400">
          <Edit2 className="w-4 h-4" /> Edit
        </div>
        <div className="flex items-center gap-2 text-rose-400">
          Delete <Trash2 className="w-4 h-4" />
        </div>
      </div>

      <motion.div
        drag={isMobile ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative flex items-center gap-3 py-3 px-3 bg-[#05050A] rounded-xl hover:bg-zinc-900 transition-colors active:scale-[0.98]"
      >
        {/* Emoji icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">
          <DynamicIcon name={tx.category?.emoji || 'CircleDollarSign'} className="w-5 h-5 text-zinc-100" />
        </div>

        {/* Middle: category + description */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate">
            {tx.category?.name ?? 'Uncategorised'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {tx.description && (
              <p className="text-xs text-zinc-500 truncate">{tx.description}</p>
            )}
            {tx.description && <span className="text-zinc-700 text-xs">·</span>}
            <span className="text-[10px] text-zinc-600 capitalize">
              {paymentMethodLabel(tx.payment_method)}
            </span>
          </div>
        </div>

        {/* Amount and Actions */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-semibold tabular-nums flex-shrink-0',
              isIncome ? 'text-emerald-400' : 'text-zinc-100'
            )}
          >
            {amountStr}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors outline-none cursor-pointer">
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-zinc-800 border-zinc-700 text-zinc-100">
              <DropdownMenuItem 
                onClick={onEdit}
                className="hover:bg-zinc-800 focus:bg-zinc-800 focus:text-zinc-50 cursor-pointer"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDeleteIntent}
                className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-400 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    </div>
  )
}
