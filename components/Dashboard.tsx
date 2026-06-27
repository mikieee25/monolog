'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { processRecurringTransactions } from '@/app/actions'
import { getAiVibeCheck } from '@/app/actions/ai'
import { db } from '@/lib/db'
import { BalanceSummary } from './BalanceSummary'
import { TransactionFeed } from './TransactionFeed'
import { QuickActionsBar } from './QuickActionsBar'
import { AddTransactionModal } from './AddTransactionModal'
import { ManageWalletsModal } from './ManageWalletsModal'
import { ManageCategoriesModal } from './ManageCategoriesModal'
import { CalendarView } from './CalendarView'
import { AiNudge } from './AiNudge'

type Modal = 'transaction' | 'wallets' | 'categories' | null

export function Dashboard() {
  const [activeModal, setActiveModal] = useState<Modal>(null)
  const [view, setView] = useState<'feed' | 'calendar'>('feed')
  const [aiMessage, setAiMessage] = useState<{message: string, type: 'success' | 'error' | 'loading'} | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const close = () => setActiveModal(null)

  useEffect(() => {
    processRecurringTransactions().catch(console.error)
    
    // AI Vibe Check
    const checkVibe = async () => {
      if (sessionStorage.getItem('vibeCheckDismissed')) return
      
      setIsAiLoading(true)
      try {
        const recentTx = await db.transactions.orderBy('date').reverse().limit(10).toArray()
        if (recentTx.length > 0) {
          const result = await getAiVibeCheck(recentTx)
          if (result) setAiMessage(result as any)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsAiLoading(false)
      }
    }
    checkVibe()
  }, [])

  const handleDismissNudge = () => {
    sessionStorage.setItem('vibeCheckDismissed', 'true')
    setAiMessage(null)
  }

  return (
    <div className="flex flex-col md:flex-row md:gap-12 lg:gap-16 min-h-dvh pb-24 md:pb-12 md:pt-16 md:px-8">
      
      {/* Left Column (Desktop) / Top Section (Mobile) */}
      <div className="flex flex-col w-full md:w-[320px] lg:w-[380px] shrink-0">
        {/* Header */}
        <header className="flex items-center justify-between px-5 md:px-0 pt-14 md:pt-0 pb-2 md:pb-6">
          <h1 className="text-lg md:text-xl font-semibold tracking-tight text-zinc-100">Monolog</h1>
          <span className="text-xs text-zinc-500 font-mono">
            {new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
          </span>
        </header>

        {/* Balance + spending summary */}
        <BalanceSummary onAddTransaction={() => setActiveModal('transaction')} />

        <div className="px-5 md:px-0 mt-4 md:mt-6">
          {isAiLoading ? (
            <AiNudge message={null} type="loading" />
          ) : aiMessage ? (
            <AiNudge message={aiMessage.message} type={aiMessage.type} onDismiss={handleDismissNudge} />
          ) : null}
        </div>

        {/* Divider (Mobile Only) */}
        <div className="h-px bg-zinc-800 mx-5 my-4 md:hidden" />

        {/* Desktop Quick Actions (Hidden on Mobile) */}
        <div className="hidden md:flex flex-col gap-2 mt-8">
          <button 
            onClick={() => setActiveModal('transaction')}
            className="flex items-center gap-3 px-4 py-3 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl font-medium transition-colors"
          >
            <div className="bg-zinc-900 text-zinc-50 rounded-full p-1">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            </div>
            Add Transaction
          </button>
          
          <button 
            onClick={() => setActiveModal('wallets')}
            className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800/50 text-zinc-300 rounded-xl font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-5 7.59l-9.74 4.57a2 2 0 0 1-2.85-1.69V2.57"/><path d="M15 12h4v4h-4z"/></svg>
            Manage Wallets
          </button>
          
          <button 
            onClick={() => setActiveModal('categories')}
            className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800/50 text-zinc-300 rounded-xl font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
            Manage Categories
          </button>
        </div>
      </div>

      {/* Right Column (Desktop) / Bottom Section (Mobile) */}
      <div className="flex-1 px-5 md:p-8 flex flex-col md:bg-zinc-900/30 md:backdrop-blur-xl md:border md:border-zinc-800/60 md:rounded-3xl md:shadow-2xl">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex bg-zinc-800/50 p-1 rounded-xl">
            <button 
              onClick={() => setView('feed')} 
              className={cn("px-4 py-1.5 text-xs font-semibold rounded-lg transition-all", view === 'feed' ? "bg-zinc-700 text-zinc-100 shadow" : "text-zinc-400 hover:text-zinc-200")}
            >
              Feed
            </button>
            <button 
              onClick={() => setView('calendar')} 
              className={cn("px-4 py-1.5 text-xs font-semibold rounded-lg transition-all", view === 'calendar' ? "bg-zinc-700 text-zinc-100 shadow" : "text-zinc-400 hover:text-zinc-200")}
            >
              Calendar
            </button>
          </div>
        </div>
        
        {view === 'feed' ? <TransactionFeed /> : <CalendarView />}
      </div>

      {/* Fixed bottom action bar (Mobile Only) */}
      <div className="md:hidden">
        <QuickActionsBar
          onAdd={() => setActiveModal('transaction')}
          onWallets={() => setActiveModal('wallets')}
          onCategories={() => setActiveModal('categories')}
        />
      </div>

      {/* Modals */}
      <AddTransactionModal     open={activeModal === 'transaction'} onClose={close} />
      <ManageWalletsModal      open={activeModal === 'wallets'}     onClose={close} />
      <ManageCategoriesModal   open={activeModal === 'categories'}  onClose={close} />
    </div>
  )
}
