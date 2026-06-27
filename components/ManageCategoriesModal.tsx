'use client'

import { useState } from 'react'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { keys } from '@/lib/query-keys'
import { getCategories, addCategory, updateCategory, deleteCategory } from '@/app/actions'
import { cn } from '@/lib/utils'
import { IconPicker } from './IconPicker'
import { DynamicIcon, EXPENSE_ICONS, INCOME_ICONS } from './DynamicIcon'
import { PlusIcon, Edit2, Trash2, Check, X } from 'lucide-react'
import type { CategoryType, Category } from '@/lib/types'

interface Props { open: boolean; onClose: () => void }

export function ManageCategoriesModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const { data: categories } = useSuspenseQuery({ queryKey: keys.categories(), queryFn: () => getCategories() })

  const [name,   setName]   = useState('')
  const [emoji,  setEmoji]  = useState('ShoppingCart')
  const [type,   setType]   = useState<CategoryType>('expense')
  const [error,  setError]  = useState('')
  const [adding, setAdding] = useState(false)

  const expenses = categories.filter(c => c.type === 'expense')
  const incomes  = categories.filter(c => c.type === 'income')

  const mutation = useMutation({
    mutationFn: addCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.categories() })
      setName(''); setEmoji('ShoppingCart'); setAdding(false)
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
          <CategoryRow key={c.id} category={c} />
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
                  onClick={() => { setType(t); setEmoji(t === 'expense' ? 'ShoppingCart' : 'Briefcase') }}
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
              <IconPicker
                selected={emoji}
                onSelect={setEmoji}
                presets={type === 'expense' ? EXPENSE_ICONS : INCOME_ICONS}
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

function CategoryRow({ category }: { category: Category }) {
  const qc = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [emoji, setEmoji] = useState(category.emoji)

  const updateMut = useMutation({
    mutationFn: (args: { id: string, name: string, emoji: string }) => updateCategory(args.id, args),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.categories() })
      qc.invalidateQueries({ queryKey: keys.transactions() })
      setIsEditing(false)
    }
  })

  const deleteMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.categories() })
      qc.invalidateQueries({ queryKey: keys.transactions() })
    }
  })

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-1.5 bg-zinc-800/50 rounded-xl border border-zinc-700">
        <div className="flex items-center gap-2">
          <div className="w-10 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-700 rounded-md shrink-0">
            <DynamicIcon name={emoji} className="w-4 h-4 text-zinc-400" />
          </div>
          <Input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="flex-1 h-8 bg-zinc-900 border-zinc-700 text-zinc-50" 
          />
          <Button 
            size="icon" 
            variant="ghost" 
            className="w-8 h-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 shrink-0" 
            onClick={() => {
              if (name.trim()) {
                updateMut.mutate({ id: category.id, name: name.trim(), emoji })
              }
            }}
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            className="w-8 h-8 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700 shrink-0" 
            onClick={() => {
              setIsEditing(false)
              setName(category.name)
              setEmoji(category.emoji)
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="px-0.5 pb-1">
          <IconPicker
            selected={emoji}
            onSelect={setEmoji}
            presets={category.type === 'expense' ? EXPENSE_ICONS : INCOME_ICONS}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-zinc-800/50 group transition-colors">
      <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
        <DynamicIcon name={category.emoji} className="w-4 h-4 text-zinc-100" />
      </div>
      <span className="text-sm text-zinc-200 flex-1 min-w-0 truncate">{category.name}</span>
      
      <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
        <button 
          onClick={() => setIsEditing(true)}
          className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded-lg transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => {
            if (confirm(`Delete category "${category.name}"? Transactions using this category will become uncategorised.`)) {
              deleteMut.mutate(category.id)
            }
          }}
          className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
