'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { getRecentTransactions } from '@/app/actions'
import { cn } from '@/lib/utils'
import { DynamicIcon } from './DynamicIcon'
import type { Transaction } from '@/lib/types'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Fetch a lot of transactions to ensure we have data for the calendar.
  const { data: allTransactions, isLoading } = useQuery({
    queryKey: keys.transactions(1000),
    queryFn: () => getRecentTransactions(1000),
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))

  // Selected Day State
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Calculate daily totals for this month
  const dailyTotals = useMemo(() => {
    const totals: Record<number, { income: number; expense: number; txs: Transaction[] }> = {}
    
    for (let i = 1; i <= daysInMonth; i++) {
      totals[i] = { income: 0, expense: 0, txs: [] }
    }

    if (allTransactions) {
      allTransactions.forEach(tx => {
        const txDate = new Date(tx.date)
        if (txDate.getFullYear() === year && txDate.getMonth() === month) {
          const day = txDate.getDate()
          if (totals[day]) {
            totals[day].txs.push(tx)
            if (tx.type === 'income') totals[day].income += Number(tx.amount)
            else totals[day].expense += Number(tx.amount)
          }
        }
      })
    }
    
    return totals
  }, [allTransactions, year, month, daysInMonth])

  if (isLoading || !allTransactions) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
        <div className="w-10 h-10 mb-3 bg-zinc-800 rounded-full" />
        <p className="text-sm text-zinc-500">Loading calendar...</p>
      </div>
    )
  }

  // Aggregate monthly stats
  let totalIncome = 0
  let totalExpense = 0
  Object.values(dailyTotals).forEach(day => {
    totalIncome += day.income
    totalExpense += day.expense
  })
  const netSavings = totalIncome - totalExpense

  return (
    <div className="space-y-6">
      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <p className="text-xs text-zinc-400 font-medium">Income</p>
          <p className="text-lg font-bold text-emerald-400">₱{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <p className="text-xs text-zinc-400 font-medium">Expenses</p>
          <p className="text-lg font-bold text-rose-400">₱{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
          <p className="text-xs text-zinc-400 font-medium">Savings</p>
          <p className={cn("text-lg font-bold", netSavings >= 0 ? "text-blue-400" : "text-rose-400")}>
            ₱{netSavings.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-3xl p-5">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-zinc-100">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-100">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="text-center text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const stats = dailyTotals[day]
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()
            const hasActivity = stats.income > 0 || stats.expense > 0
            const isSelected = selectedDay === day

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={cn(
                  "relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all border",
                  isToday ? "bg-zinc-800/80 border-zinc-600 text-white" : "border-transparent text-zinc-300 hover:bg-zinc-800/50",
                  isSelected && "ring-2 ring-white border-transparent bg-zinc-800",
                  !isToday && !isSelected && "bg-zinc-900/20"
                )}
              >
                <span className={cn("text-sm font-medium", isToday && "font-bold")}>{day}</span>
                
                {hasActivity && (
                  <div className="absolute bottom-1.5 flex gap-1">
                    {stats.income > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    {stats.expense > 0 && <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <h3 className="text-sm font-semibold text-zinc-100 mb-4 border-b border-zinc-800 pb-3 flex justify-between">
            <span>{new Date(year, month, selectedDay).toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            <span className="text-zinc-400 font-normal">
              Net: ₱{(dailyTotals[selectedDay].income - dailyTotals[selectedDay].expense).toLocaleString()}
            </span>
          </h3>
          
          <div className="space-y-3">
            {dailyTotals[selectedDay].txs.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No transactions on this day.</p>
            ) : (
              dailyTotals[selectedDay].txs.map(tx => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm text-zinc-400">
                      <DynamicIcon name={tx.category?.emoji || 'wallet'} className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {tx.description || tx.category?.name || 'Transaction'}
                      </p>
                      <p className="text-[10px] text-zinc-500 uppercase">{tx.account?.name}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold",
                    tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-100'
                  )}>
                    {tx.type === 'income' ? '+' : '-'}₱{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
