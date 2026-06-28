'use client'

import { useState } from 'react'
import { detectSubscriptions } from '@/app/actions/ai'
import { useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/query-keys'
import { Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  isMobile?: boolean
}

export function ScanSubscriptionsButton({ className, isMobile }: Props) {
  const qc = useQueryClient()
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = async () => {
    setIsScanning(true)
    try {
      await detectSubscriptions()
      qc.invalidateQueries({ queryKey: keys.upcomingRecurrings })
    } catch (e) {
      console.error(e)
    } finally {
      setIsScanning(false)
    }
  }

  if (isMobile) {
    return (
      <button 
        onClick={handleScan}
        disabled={isScanning}
        className={cn("flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 active:scale-95 transition-all w-full h-full", className)}
      >
        <div className="bg-zinc-800 p-2.5 rounded-full text-indigo-400">
          {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        </div>
        <span className="text-[11px] font-medium leading-tight">Detect Sub</span>
      </button>
    )
  }

  return (
    <button 
      onClick={handleScan}
      disabled={isScanning}
      className={cn("flex items-center gap-3 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800/50 text-zinc-300 rounded-xl font-medium transition-colors disabled:opacity-50", className)}
    >
      {isScanning ? <Loader2 className="w-[18px] h-[18px] animate-spin text-indigo-400" /> : <Sparkles className="w-[18px] h-[18px] text-indigo-400" />}
      Detect Subscriptions
    </button>
  )
}
