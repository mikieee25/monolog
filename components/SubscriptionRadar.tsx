'use client'

import { useState } from 'react'
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { getUpcomingRecurringTransactions } from '@/app/actions'
import { detectSubscriptions } from '@/app/actions/ai'
import { formatCurrency } from '@/lib/utils'
import { Clock } from 'lucide-react'
import { DynamicIcon } from './DynamicIcon'

export function SubscriptionRadar() {
  const qc = useQueryClient()
  const { data: upcoming } = useSuspenseQuery({
    queryKey: keys.upcomingRecurrings,
    queryFn: () => getUpcomingRecurringTransactions(14)
  })

  const hasUpcoming = upcoming && upcoming.length > 0

  if (!hasUpcoming) return null

  return (
    <div className="mx-5 mb-6 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Upcoming Bills</h3>
        </div>
      </div>

      <div className="space-y-3">
        {upcoming.map((rt: any) => (
            <div key={rt.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center text-lg">
                  <DynamicIcon name={rt.category?.emoji || 'CalendarClock'} className="w-5 h-5 text-zinc-100" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-200">
                    {rt.description || rt.category?.name || 'Recurring'}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {rt.days_until === 0 
                      ? 'Due today' 
                      : rt.days_until === 1 
                        ? 'Due tomorrow' 
                        : `Due in ${rt.days_until} days`}
                  </span>
                </div>
              </div>
              <span className="text-sm font-semibold text-zinc-100 tabular-nums">
                {formatCurrency(rt.amount)}
              </span>
            </div>
          ))}
        </div>
    </div>
  )
}
