'use client'

import { useState, useEffect } from 'react'
import { Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AiNudgeProps {
  message: string | null
  type?: 'success' | 'error' | 'loading'
  onDismiss?: () => void
}

export function AiNudge({ message, type = 'success', onDismiss }: AiNudgeProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (message) {
      // Small delay for a nice entrance animation
      const timer = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [message])

  if (!message && !isVisible) return null

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-[1px] transition-all duration-500 ease-out',
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95',
        type === 'error' ? 'hidden' : 'block' // hide on error to not annoy user, or style differently
      )}
    >
      {/* Animated glowing border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-20 blur-sm animate-pulse" />
      
      <div className="relative flex items-start gap-3 bg-zinc-950/80 backdrop-blur-xl px-4 py-3 rounded-2xl border border-zinc-800/50">
        <div className="mt-0.5 p-1.5 bg-indigo-500/10 rounded-full shrink-0">
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-zinc-300 leading-relaxed font-medium">
            {type === 'loading' ? (
              <span className="flex items-center gap-2">
                <span className="animate-pulse">Thinking...</span>
              </span>
            ) : (
              message
            )}
          </p>
        </div>

        {onDismiss && type !== 'loading' && (
          <button 
            onClick={() => {
              setIsVisible(false)
              setTimeout(onDismiss, 300)
            }}
            className="p-1 -mr-1 -mt-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
