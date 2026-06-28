'use client'

import { useState, useEffect } from 'react'
import { Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AiNudgeProps {
  message: string | null
  type?: 'success' | 'error' | 'loading'
  onDismiss?: () => void
  onClick?: () => void
}

export function AiNudge({ message, type = 'success', onDismiss, onClick }: AiNudgeProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (message || type === 'loading') {
      // Small delay for a nice entrance animation
      const timer = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [message, type])

  if (!message && type !== 'loading' && !isVisible) return null

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl p-[1px] transition-all duration-500 ease-out',
        onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
      )}
    >
      {/* Animated glowing border effect */}
      <div 
        className={cn(
          "absolute inset-0 opacity-20 blur-sm animate-pulse",
          type === 'error' ? "bg-red-500" : "bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"
        )} 
      />
      
      <div 
        className={cn(
          "relative flex items-start gap-3 bg-zinc-950/80 backdrop-blur-xl px-4 py-3 rounded-2xl border",
          type === 'error' ? "border-red-900/50" : "border-zinc-800/50"
        )}
      >
        <div 
          className={cn(
            "mt-0.5 p-1.5 rounded-full shrink-0",
            type === 'error' ? "bg-red-500/10" : "bg-indigo-500/10"
          )}
        >
          <Sparkles className={cn("w-4 h-4", type === 'error' ? "text-red-400" : "text-indigo-400")} />
        </div>
        
        <div className="flex-1">
          <p className={cn("text-sm leading-relaxed font-medium", type === 'error' ? "text-red-300" : "text-zinc-300")}>
            {type === 'loading' ? (
              <span className="flex items-center gap-2">
                <span className="animate-pulse">Thinking...</span>
              </span>
            ) : (
              message
            )}
          </p>
        </div>


      </div>
    </div>
  )
}
