'use client'

import { useState, useRef } from 'react'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { keys } from '@/lib/query-keys'
import { getAccounts, getCategories, addTransaction } from '@/app/actions'
import { scanReceipt } from '@/app/actions/ai'
import { Loader2, UploadCloud, CheckCircle2, Camera } from 'lucide-react'
import type { PaymentMethod } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
}

export function ReceiptScannerModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const { data: accounts } = useSuspenseQuery({ queryKey: keys.accounts, queryFn: getAccounts })
  const { data: categories } = useSuspenseQuery({ queryKey: keys.categories(), queryFn: () => getCategories() })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')

  // Form State (filled after scan)
  const [scanned, setScanned] = useState(false)
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [payment, setPayment] = useState<PaymentMethod>('card')

  const reset = () => {
    setScanned(false)
    setAmount('')
    setDesc('')
    setCategoryId('')
    setAccountId('')
    setPayment('card')
    setError('')
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset()
      onClose()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsScanning(true)
      setError('')
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const base64 = reader.result as string
        const result = await scanReceipt(base64)
        if (!result) {
          setError('Failed to scan receipt. Please try again.')
          return
        }

        setAmount(String(result.amount || ''))
        setDesc(result.description || '')
        
        // Try to match generic category to an actual category ID
        if (result.suggestedCategory) {
          const cat = categories.find(c => c.name.toLowerCase().includes(result.suggestedCategory.toLowerCase()) && c.type === 'expense')
          if (cat) setCategoryId(cat.id)
        }
        
        if (accounts.length > 0) setAccountId(accounts[0].id)
        if (result.paymentMethod) setPayment(result.paymentMethod)

        setScanned(true)
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while reading the file.')
    } finally {
      setIsScanning(false)
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!amount || !categoryId || !accountId) throw new Error('Please fill in required fields')
      await addTransaction({
        type: 'expense',
        amount: Number(amount),
        description: desc,
        category_id: categoryId,
        account_id: accountId,
        payment_method: payment,
        date: new Date().toISOString().split('T')[0]
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: keys.balance })
      qc.invalidateQueries({ queryKey: keys.monthlySpending })
      handleOpenChange(false)
    },
    onError: (err: any) => {
      setError(err.message)
    }
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-stone-950/80 backdrop-blur-2xl border-stone-800 text-stone-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            Scan Receipt
          </DialogTitle>
          <DialogDescription className="text-stone-400">
            Upload a receipt to automatically extract the details using AI.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">
            {error}
          </div>
        )}

        {!scanned && (
          <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-stone-800 rounded-xl bg-stone-900/30">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            {isScanning ? (
              <div className="flex flex-col items-center text-indigo-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm font-medium">Scanning Receipt with AI...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                >
                  Choose or Take Photo
                </Button>
              </div>
            )}
          </div>
        )}

        {scanned && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-3 rounded-lg text-sm font-medium mb-2">
              <CheckCircle2 className="w-4 h-4" />
              Receipt Extracted Successfully
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Amount</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className="text-2xl h-12 bg-stone-900 border-stone-800"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label>Description / Merchant</Label>
                <Input 
                  value={desc} 
                  onChange={(e) => setDesc(e.target.value)} 
                  className="bg-stone-900 border-stone-800"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v || '')}>
                  <SelectTrigger className="bg-stone-900 border-stone-800">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.type === 'expense').map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">{c.emoji} {c.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Wallet</Label>
                <Select value={accountId} onValueChange={(v) => setAccountId(v || '')}>
                  <SelectTrigger className="bg-stone-900 border-stone-800">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="flex items-center gap-2">{a.emoji} {a.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-4"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm & Save
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={reset}
              disabled={mutation.isPending}
            >
              Scan Another Receipt
            </Button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}
