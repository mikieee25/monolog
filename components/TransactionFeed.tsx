'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { getRecentTransactions } from '@/app/actions'
import { formatCurrency, formatDateLabel, paymentMethodLabel } from '@/lib/utils'
import type { Transaction } from '@/lib/types'
import { cn } from '@/lib/utils'

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

export function TransactionFeed() {
  const { data: transactions } = useSuspenseQuery({
    queryKey: keys.transactions(),
    queryFn: () => getRecentTransactions(30),
  })

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-4xl mb-3">🪙</span>
        <p className="text-sm text-zinc-500">No transactions yet.</p>
        <p className="text-xs text-zinc-600 mt-1">Tap + to add your first one.</p>
      </div>
    )
  }

  const grouped = groupByDate(transactions)

  return (
    <div className="space-y-5 pb-4">
      {Array.from(grouped.entries()).map(([dateLabel, txs]) => (
        <div key={dateLabel}>
          {/* Date group header */}
          <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">
            {dateLabel}
          </p>

          <div className="space-y-0.5">
            {txs.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === 'income'
  const amountStr = (isIncome ? '+' : '−') + formatCurrency(tx.amount)

  return (
    <div className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-zinc-900 transition-colors active:scale-[0.98]">
      {/* Emoji icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">
        {tx.category?.emoji ?? '💸'}
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

      {/* Amount */}
      <span
        className={cn(
          'text-sm font-semibold tabular-nums flex-shrink-0',
          isIncome ? 'text-emerald-400' : 'text-zinc-100'
        )}
      >
        {amountStr}
      </span>
    </div>
  )
}
