'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Sparkles, Send, X } from 'lucide-react'
import { chatWithMonolog } from '@/app/actions/ai'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export function ChatModal({ open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I am Monolog, your personal AI financial advisor. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Reset chat when opened
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: 'Hi! I am Monolog, your personal AI financial advisor. How can I help you today?' }])
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      // call server action
      const response = await chatWithMonolog(newMessages)
      setMessages([...newMessages, { role: 'assistant', content: response }])
    } catch (err) {
      console.error(err)
      setMessages([...newMessages, { role: 'assistant', content: "Sorry, I ran into an error getting your data." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      {/* 
        To create the Apple Intelligence effect in Tailwind: 
        We use an outer wrapper that contains a spinning conic gradient,
        and an inner wrapper that holds the actual content with a solid dark background.
        The padding of the outer wrapper creates the "border".
      */}
      <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-2xl overflow-hidden rounded-[24px]">
        
        {/* Apple Intelligence Glowing Border Effect */}
        <div className="relative p-[2px] rounded-[24px] overflow-hidden group">
          {/* Spinning Gradient Background */}
          <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_340deg,#a855f7_360deg)] opacity-50 mix-blend-screen" />
          <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite_reverse] bg-[conic-gradient(from_0deg,transparent_0_340deg,#3b82f6_360deg)] opacity-50 mix-blend-screen" />
          <div className="absolute inset-[-100%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_340deg,#10b981_360deg)] opacity-30 mix-blend-screen" />

          {/* Actual Modal Content Container */}
          <div className="relative flex flex-col h-[65vh] bg-stone-950/95 backdrop-blur-3xl rounded-[22px] overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-800/50 bg-stone-950/50 backdrop-blur-xl z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <DialogTitle className="text-base font-bold text-stone-100">Monolog AI</DialogTitle>
              </div>
              <button onClick={onClose} className="p-1 rounded-full text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed animate-in fade-in slide-in-from-bottom-2",
                    msg.role === 'user' 
                      ? "bg-stone-800 text-stone-100 ml-auto rounded-br-sm" 
                      : "bg-transparent text-stone-300 mr-auto rounded-bl-sm"
                  )}
                >
                  {msg.role === 'assistant' && i > 0 && (
                     <div className="flex items-center gap-2 mb-1 opacity-50">
                       <Sparkles className="w-3 h-3" />
                       <span className="text-xs font-medium uppercase tracking-wider">Monolog</span>
                     </div>
                  )}
                  {msg.content}
                </div>
              ))}
              
              {isLoading && (
                <div className="max-w-[85%] mr-auto text-stone-400 bg-transparent px-4 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-stone-800/50 bg-stone-950/80 backdrop-blur-xl">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your finances..."
                  className="w-full pr-12 bg-stone-900 border-stone-800 text-stone-100 rounded-full h-12 focus-visible:ring-indigo-500/50"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1 w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
