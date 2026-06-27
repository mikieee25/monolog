'use client'

import { useState } from 'react'
import { BalanceSummary } from './BalanceSummary'
import { TransactionFeed } from './TransactionFeed'
import { QuickActionsBar } from './QuickActionsBar'
import { AddTransactionModal } from './AddTransactionModal'
import { ManageWalletsModal } from './ManageWalletsModal'
import { ManageCategoriesModal } from './ManageCategoriesModal'

type Modal = 'transaction' | 'wallets' | 'categories' | null

export function Dashboard() {
  const [activeModal, setActiveModal] = useState<Modal>(null)
  const close = () => setActiveModal(null)

  return (
    <div className="flex flex-col min-h-dvh pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-14 pb-2">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">Monolog</h1>
        <span className="text-xs text-zinc-500 font-mono">
          {new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
        </span>
      </header>

      {/* Balance + spending summary */}
      <BalanceSummary onAddTransaction={() => setActiveModal('transaction')} />

      {/* Divider */}
      <div className="h-px bg-zinc-800 mx-5 my-4" />

      {/* Transaction feed */}
      <div className="flex-1 px-5">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Recent
        </p>
        <TransactionFeed />
      </div>

      {/* Fixed bottom action bar */}
      <QuickActionsBar
        onAdd={() => setActiveModal('transaction')}
        onWallets={() => setActiveModal('wallets')}
        onCategories={() => setActiveModal('categories')}
      />

      {/* Modals */}
      <AddTransactionModal     open={activeModal === 'transaction'} onClose={close} />
      <ManageWalletsModal      open={activeModal === 'wallets'}     onClose={close} />
      <ManageCategoriesModal   open={activeModal === 'categories'}  onClose={close} />
    </div>
  )
}
