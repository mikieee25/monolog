'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { getBalance, getMonthlySpending } from '@/app/actions'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'

interface Props {
  onAddTransaction: () => void
}

export function BalanceSummary({ onAddTransaction }: Props) {
  const { data: balance }  = useSuspenseQuery({ queryKey: keys.balance,         queryFn: getBalance })
  const { data: spending } = useSuspenseQuery({ queryKey: keys.monthlySpending, queryFn: getMonthlySpending })

  return (
    <div className="px-5 pt-4 pb-2">
      {/* Total balance */}
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mb-1">
        Total Balance
      </p>
      <p className="text-4xl font-bold tracking-tight text-zinc-50 tabular-nums">
        {formatCurrency(balance)}
      </p>

      {/* Monthly spending */}
      <div className="flex items-center gap-3 mt-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">This Month</span>
          <span className="text-sm font-semibold text-rose-400 tabular-nums">
            −{formatCurrency(spending)}
          </span>
        </div>

        {/* Quick add button */}
        <Button
          onClick={onAddTransaction}
          size="sm"
          className="ml-auto rounded-full h-9 px-4 text-xs font-semibold bg-zinc-100 text-zinc-900 hover:bg-white"
        >
          <PlusIcon className="h-3.5 w-3.5 mr-1.5" />
          Add
        </Button>
      </div>
    </div>
  )
}
