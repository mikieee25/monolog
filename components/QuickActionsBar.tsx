'use client'

import { PlusCircleIcon, WalletIcon, TagIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onAdd: () => void
  onWallets: () => void
  onCategories: () => void
}

const actions = [
  { key: 'add',        Icon: PlusCircleIcon, label: 'Add',        accent: true  },
  { key: 'wallets',    Icon: WalletIcon,     label: 'Wallets',    accent: false },
  { key: 'categories', Icon: TagIcon,        label: 'Categories', accent: false },
] as const

export function QuickActionsBar({ onAdd, onWallets, onCategories }: Props) {
  const handlers: Record<string, () => void> = {
    add: onAdd, wallets: onWallets, categories: onCategories,
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-sm z-50">
      {/* Frosted bottom bar */}
      <div className="bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/60 flex items-center justify-around px-4 py-3 pb-safe">
        {actions.map(({ key, Icon, label, accent }) => (
          <button
            key={key}
            onClick={handlers[key]}
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all active:scale-90',
              accent
                ? 'text-zinc-50 [&>svg]:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Icon className={cn('h-5 w-5', accent && 'stroke-[2.5]')} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
