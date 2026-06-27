'use client'

import { cn } from '@/lib/utils'

interface Props {
  selected: string
  onSelect: (emoji: string) => void
  presets: string[]
}

export function EmojiPicker({ selected, onSelect, presets }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map(e => (
        <button
          key={e}
          type="button"
          onClick={() => onSelect(e)}
          className={cn(
            'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all',
            selected === e
              ? 'bg-zinc-100 scale-105 ring-2 ring-zinc-100'
              : 'bg-zinc-800 hover:bg-zinc-700'
          )}
        >
          {e}
        </button>
      ))}
    </div>
  )
}
