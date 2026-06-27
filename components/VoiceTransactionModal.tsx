'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mic, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { suggestCategoryAndWallet } from '@/app/actions/ai'
import { addTransaction, getAccounts, getCategories } from '@/app/actions'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

export function VoiceTransactionModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  
  const { isListening, transcript, startListening, stopListening, isSupported, setTranscript } = useSpeechRecognition()
  
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Track if we've already started processing to avoid double submissions
  const processingRef = useRef(false)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStatus('idle')
      setErrorMessage('')
      setTranscript('')
      processingRef.current = false
      
      if (isSupported) {
        setTimeout(() => {
          startListening()
          setStatus('listening')
        }, 100)
      } else {
        setStatus('error')
        setErrorMessage('Voice recognition is not supported in your browser.')
      }
    } else {
      stopListening()
    }
  }, [open, isSupported, startListening, stopListening, setTranscript])

  const mutation = useMutation({
    mutationFn: async (text: string) => {
      // Get cached data or fetch it
      let accountsData = qc.getQueryData<any[]>(keys.accounts)
      if (!accountsData) {
        accountsData = await qc.fetchQuery({ queryKey: keys.accounts, queryFn: getAccounts })
      }
      let categoriesData = qc.getQueryData<any[]>(keys.categories())
      if (!categoriesData) {
        categoriesData = await qc.fetchQuery({ queryKey: keys.categories(), queryFn: () => getCategories() })
      }

      if (!accountsData || !categoriesData) throw new Error('Could not load data')
        
      const simplifiedCategories = categoriesData.map(c => ({ id: c.id, name: c.name }))
      const simplifiedAccounts = accountsData.map(a => ({ id: a.id, name: a.name }))

      // 1. Categorize using AI
      const aiResult = await suggestCategoryAndWallet(text, simplifiedCategories, simplifiedAccounts)
      if (!aiResult) throw new Error('Could not understand transaction')
      
      const amount = aiResult.amount
      if (!amount) throw new Error("Couldn't detect an amount. Please specify how much.")
      
      const categoryId = aiResult.categoryId
      if (!categoryId) throw new Error("Couldn't match a category. Please specify what it was for.")
      
      // Default to the first account if AI couldn't match a wallet
      const accountId = aiResult.accountId || (accountsData.length > 0 ? accountsData[0].id : null)
      if (!accountId) throw new Error("No wallet found to charge this to.")

      // 2. Add transaction
      await addTransaction({
        type: 'expense',
        amount: amount,
        description: text,
        category_id: categoryId,
        account_id: accountId,
        date: new Date().toISOString(),
        payment_method: aiResult.paymentMethod || 'cash' // Default
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: keys.balance })
      qc.invalidateQueries({ queryKey: keys.monthlySpending })
      qc.invalidateQueries({ queryKey: keys.projectedBalance })
      setStatus('success')
      setTimeout(() => {
        onClose()
      }, 1500)
    },
    onError: (err) => {
      setStatus('error')
      setErrorMessage(err.message || 'Failed to process transaction')
      processingRef.current = false
    }
  })

  // Trigger processing when listening stops and we have a transcript
  useEffect(() => {
    if (!open) return
    
    if (!isListening && transcript && status === 'listening' && !processingRef.current) {
      processingRef.current = true
      setStatus('processing')
      mutation.mutate(transcript)
    }
  }, [isListening, transcript, status, open, mutation])

  const handleMicClick = () => {
    if (status === 'listening') {
      stopListening()
    } else if (status === 'idle' || status === 'error') {
      setTranscript('')
      setErrorMessage('')
      setStatus('listening')
      startListening()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 max-w-sm rounded-3xl p-6 sm:p-8">
        <DialogHeader className="text-center sm:text-center mb-6">
          <DialogTitle className="text-xl">Voice Transaction</DialogTitle>
          <DialogDescription className="text-zinc-400">
            {status === 'listening' ? 'Speak now...' : 
             status === 'processing' ? 'Categorizing...' : 
             status === 'success' ? 'Added successfully!' : 
             status === 'error' ? 'Something went wrong' : 'Ready'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-8 py-4">
          
          {/* Main Status Icon */}
          <div className="relative flex items-center justify-center h-32 w-32">
            {status === 'listening' && (
              <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping" />
            )}
            
            {status === 'processing' && (
              <Loader2 className="w-16 h-16 text-indigo-400 animate-spin" />
            )}
            
            {status === 'success' && (
              <CheckCircle2 className="w-20 h-20 text-emerald-400 animate-in zoom-in" />
            )}

            {(status === 'idle' || status === 'listening' || status === 'error') && (
              <button
                onClick={handleMicClick}
                className={cn(
                  "relative z-10 flex items-center justify-center w-24 h-24 rounded-full shadow-2xl transition-all duration-300",
                  status === 'listening' 
                    ? "bg-rose-500 text-white scale-110 shadow-rose-500/50" 
                    : "bg-zinc-800 border-2 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                )}
              >
                <Mic className={cn("w-10 h-10", status === 'listening' && "animate-pulse")} />
              </button>
            )}
          </div>

          {/* Transcript / Error Display */}
          <div className="min-h-16 w-full text-center flex flex-col items-center justify-center">
            {status === 'error' ? (
              <p className="text-sm text-rose-400 font-medium">{errorMessage}</p>
            ) : status === 'processing' ? (
              <div className="flex items-center gap-2 text-indigo-400 font-medium">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="text-sm">"{transcript}"</span>
              </div>
            ) : (
              <p className="text-lg font-medium text-zinc-200">
                {transcript || (status === 'listening' ? "..." : "")}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
