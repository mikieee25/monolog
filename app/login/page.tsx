'use client'

import { useState, useTransition } from 'react'
import { login, signup } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [isSignup,    setIsSignup]    = useState(false)
  const [error,       setError]       = useState('')
  const [isPending,   startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = isSignup ? await signup(fd) : await login(fd)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col justify-center min-h-dvh px-8 pb-safe">
      {/* Logo */}
      <div className="mb-10">
        <p className="text-3xl font-bold tracking-tight text-zinc-50">Monolog</p>
        <p className="text-sm text-zinc-500 mt-1">Your personal expense ledger.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-xs text-zinc-400 mb-1 block">Email</Label>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 h-12"
          />
        </div>

        <div>
          <Label className="text-xs text-zinc-400 mb-1 block">Password</Label>
          <Input
            name="password"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            placeholder="••••••••"
            required
            minLength={6}
            className="bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-600 h-12"
          />
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 font-semibold text-sm bg-zinc-50 text-zinc-900 hover:bg-white rounded-xl mt-2"
        >
          {isPending ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
        </Button>
      </form>

      <button
        onClick={() => { setIsSignup(s => !s); setError('') }}
        className="text-xs text-zinc-500 hover:text-zinc-300 mt-6 transition-colors"
      >
        {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
      </button>
    </div>
  )
}
