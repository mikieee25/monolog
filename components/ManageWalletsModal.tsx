'use client'

import { useState } from 'react'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { keys } from '@/lib/query-keys'
import { getAccounts, addAccount } from '@/app/actions'
import { formatCurrency } from '@/lib/utils'
import { EmojiPicker } from './EmojiPicker'
import { PlusIcon } from 'lucide-react'

interface Props { open: boolean; onClose: () => void }

export function ManageWalletsModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const { data: accounts } = useSuspenseQuery({ queryKey: keys.accounts, queryFn: getAccounts })

  const [name,    setName]    = useState('')
  const [emoji,   setEmoji]   = useState('💳')
  const [balance, setBalance] = useState('')
  const [error,   setError]   = useState('')
  const [adding,  setAdding]  = useState(false)

  const mutation = useMutation({
    mutationFn: addAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.accounts })
      qc.invalidateQueries({ queryKey: keys.balance })
      setName(''); setEmoji('💳'); setBalance(''); setAdding(false)
    },
    onError: () => setError('Failed to add account.'),
  })

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(balance)
    if (!name.trim())              return setError('Enter a name.')
    if (isNaN(parsed) || parsed < 0) return setError('Enter a valid balance.')
    setError('')
    mutation.mutate({ name: name.trim(), emoji, balance: parsed })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 max-w-sm rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Wallets & Banks</DialogTitle>
        </DialogHeader>

        {/* Existing accounts */}
        <div className="space-y-0.5 mt-2 max-h-52 overflow-y-auto">
          {accounts.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-4">No accounts yet.</p>
          )}
          {accounts.map(a => (
            <div key={a.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-zinc-800">
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-100">{a.name}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-zinc-100">
                {formatCurrency(a.balance)}
              </p>
            </div>
          ))}
        </div>

        {/* Add new */}
        {!adding ? (
          <Button
            onClick={() => setAdding(true)}
            variant="outline"
            className="w-full border-zinc-700 text-zinc-300 bg-zinc-800 hover:bg-zinc-700 mt-2"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        ) : (
          <form onSubmit={handleAdd} className="space-y-3 border-t border-zinc-800 pt-4 mt-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">New Account</p>

            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">Icon</Label>
              <EmojiPicker
                selected={emoji}
                onSelect={setEmoji}
                presets={['💳', '💵', '🏦', '💰', '🪙', '💼', '🏧', '📱', '💴', '💶']}
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">Name</Label>
              <Input
                placeholder="e.g. BPI Savings, GCash…"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-50 placeholder:text-zinc-600"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">Starting Balance (₱)</Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={balance}
                onChange={e => setBalance(e.target.value)}
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
