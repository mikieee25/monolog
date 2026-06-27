import { cn } from '@/lib/utils'
import { DynamicIcon } from './DynamicIcon'

interface Props {
  selected: string
  onSelect: (iconName: string) => void
  presets: string[]
}

export function IconPicker({ selected, onSelect, presets }: Props) {
  return (
    <div className="flex flex-wrap gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-xl max-h-32 overflow-y-auto">
      {presets.map(iconName => {
        const isSelected = selected === iconName
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onSelect(iconName)}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-lg text-lg transition-all',
              isSelected 
                ? 'bg-zinc-100 text-zinc-900 shadow-sm scale-110' 
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            )}
          >
            <DynamicIcon name={iconName} className="w-5 h-5" />
          </button>
        )
      })}
    </div>
  )
}
