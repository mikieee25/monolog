'use client'

import { useState } from 'react'
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { getUpcomingRecurringTransactions } from '@/app/actions'
import { detectSubscriptions } from '@/app/actions/ai'
import { formatCurrency } from '@/lib/utils'
import { Clock, CheckCircle2, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SubscriptionRadar() {
  const qc = useQueryClient()
  const [isScanning, setIsScanning] = useState(false)
  
  const { data: upcoming } = useSuspenseQuery({
    queryKey: keys.upcomingRecurrings,
    queryFn: () => getUpcomingRecurringTransactions(14)
  })

  const handleScan = async () => {
    setIsScanning(true)
    try {
      await detectSubscriptions()
      qc.invalidateQueries({ queryKey: keys.upcomingRecurrings })
    } catch (e) {
      console.error(e)
    } finally {
      setIsScanning(false)
    }
  }

  const hasUpcoming = upcoming && upcoming.length > 0

  return (
    <div className="mx-5 mb-6 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Upcoming Bills</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleScan}
          disabled={isScanning}
          className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-8 px-2"
        >
          {isScanning ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Sparkles className="w-3 h-3 mr-1.5" />}
          Auto-Detect
        </Button>
      </div>

      {!hasUpcoming ? (
        <div className="text-sm text-zinc-500 py-2">
          No upcoming bills. Tap Auto-Detect to find recurring expenses from your history.
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((rt: any) => (
            <div key={rt.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center text-lg">
                  {rt.category?.emoji || '📅'}
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
      )}
    </div>
  )
}
