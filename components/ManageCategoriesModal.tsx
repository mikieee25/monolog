'use client'

import { useState } from 'react'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { keys } from '@/lib/query-keys'
import { getCategories, addCategory } from '@/app/actions'
import { cn } from '@/lib/utils'
import { EmojiPicker } from './EmojiPicker'
import { PlusIcon } from 'lucide-react'
import type { CategoryType } from '@/lib/types'

interface Props { open: boolean; onClose: () => void }

const EXPENSE_EMOJIS = ['🍔', '🚗', '🏠', '💡', '🛍️', '🏥', '🎬', '📚', '✈️', '💊']
const INCOME_EMOJIS  = ['💼', '💻', '🏢', '💰', '📈', '🎁', '🤝', '🏆', '💵', '🌱']

export function ManageCategoriesModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const { data: categories } = useSuspenseQuery({ queryKey: keys.categories(), queryFn: () => getCategories() })

  const [name,   setName]   = useState('')
  const [emoji,  setEmoji]  = useState('📦')
  const [type,   setType]   = useState<CategoryType>('expense')
  const [error,  setError]  = useState('')
  const [adding, setAdding] = useState(false)

  const expenses = categories.filter(c => c.type === 'expense')
  const incomes  = categories.filter(c => c.type === 'income')

  const mutation = useMutation({
    mutationFn: addCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.categories() })
      setName(''); setEmoji('📦'); setAdding(false)
    },
    onError: () => setError('Failed to add category.'),
  })

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Enter a name.')
    setError('')
    mutation.mutate({ name: name.trim(), emoji, type })
  }

  const Section = ({ title, cats }: { title: string; cats: typeof categories }) => (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-1.5">{title}</p>
      <div className="space-y-0.5">
        {cats.map(c => (
          <div key={c.id} className="flex items-center gap-2 py-2 px-2 rounded-lg">
            <span className="text-base">{c.emoji}</span>
            <span className="text-sm text-zinc-200">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 max-w-sm rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Categories</DialogTitle>
        </DialogHeader>

        {/* Existing categories */}
        <div className="max-h-56 overflow-y-auto space-y-4 mt-2">
          <Section title="Expenses" cats={expenses} />
          <Section title="Income"   cats={incomes}  />
        </div>

        {/* Add new */}
        {!adding ? (
          <Button
            onClick={() => setAdding(true)}
            variant="outline"
            className="w-full border-zinc-700 text-zinc-300 bg-zinc-800 hover:bg-zinc-700 mt-2"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        ) : (
          <form onSubmit={handleAdd} className="space-y-3 border-t border-zinc-800 pt-4 mt-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">New Category</p>

            {/* Type toggle */}
            <div className="flex rounded-xl bg-zinc-800 p-1 gap-1">
              {(['expense', 'income'] as CategoryType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setEmoji(t === 'expense' ? '📦' : '💰') }}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize',
                    type === t
                      ? t === 'expense' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                      : 'text-zinc-400'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">Icon</Label>
              <EmojiPicker
                selected={emoji}
                onSelect={setEmoji}
                presets={type === 'expense' ? EXPENSE_EMOJIS : INCOME_EMOJIS}
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">Name</Label>
              <Input
                placeholder="e.g. Groceries, Rent…"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-600"
              />
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setAdding(false); setError('') }}
                className="flex-1 text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 bg-zinc-50 text-zinc-900 hover:bg-white"
              >
                {mutation.isPending ? 'Adding…' : 'Add'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
