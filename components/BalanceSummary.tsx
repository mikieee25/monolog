'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { getBalance, getMonthlySpending, getProjectedEndOfMonthBalance } from '@/app/actions'
import { formatCurrency } from '@/lib/utils'
import { Plus, Mic } from 'lucide-react'

interface Props {
  onAddTransaction: () => void
  onAddWithVoice: () => void
}

export function BalanceSummary({ onAddTransaction, onAddWithVoice }: Props) {
  const { data: balance }  = useSuspenseQuery({ queryKey: keys.balance,         queryFn: getBalance })
  const { data: monthlySpending } = useSuspenseQuery({ queryKey: keys.monthlySpending, queryFn: getMonthlySpending })
  const { data: projectedSavings } = useSuspenseQuery({ queryKey: keys.projectedBalance, queryFn: getProjectedEndOfMonthBalance })

  return (
    <div className="flex flex-col md:bg-zinc-100 dark:md:bg-[#0A0A0A] md:rounded-3xl px-5 md:p-6 md:border border-zinc-200 dark:md:border-zinc-800/50 md:shadow-lg">
      <h2 className="text-[10px] md:text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1 md:mb-2">Total Balance</h2>
      <div className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1">
        {formatCurrency(balance)}
      </div>
      <p className="text-[10px] md:text-xs text-zinc-500 mb-6 md:mb-8">
        Projected end of month: <span className="text-emerald-500 font-medium">
          {formatCurrency(balance + projectedSavings)}
        </span>
      </p>

      {/* Spending Progress */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <h3 className="text-[10px] md:text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">This Month</h3>
          <p className="text-sm md:text-base font-semibold text-rose-500">
            −{formatCurrency(Math.abs(monthlySpending))}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onAddWithVoice}
            className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-sm"
            aria-label="Add transaction with voice"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button 
            onClick={onAddTransaction}
            className="flex items-center justify-center h-8 md:h-9 px-3 md:px-4 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-full text-[11px] md:text-xs font-medium hover:scale-105 active:scale-95 transition-transform shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1 md:mr-1.5" />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
