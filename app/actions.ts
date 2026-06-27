'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Account, Category, Transaction, TransactionType, PaymentMethod } from '@/lib/types'

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ─── Queries (used for SSR prefetch + client-side queryFn) ───────────────────

export async function getBalance(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data, error } = await supabase
    .from('accounts')
    .select('balance')
    .eq('user_id', user.id)

  if (error) throw error
  return (data ?? []).reduce((sum, a) => sum + Number(a.balance), 0)
}

export async function getMonthlySpending(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .gte('date', start)
    .lte('date', end)

  if (error) throw error
  return (data ?? []).reduce((sum, t) => sum + Number(t.amount), 0)
}

export async function getRecentTransactions(limit = 30): Promise<Transaction[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(name, emoji, type),
      account:accounts(name, emoji)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as Transaction[]
}

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Account[]
}

export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('type', { ascending: false }) // expense first
    .order('name', { ascending: true })

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Category[]
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function addTransaction(input: {
  amount: number
  type: TransactionType
  description?: string
  category_id: string
  account_id: string
  payment_method: PaymentMethod
  date: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Insert transaction
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      amount: input.amount,
      type: input.type,
      description: input.description || null,
      category_id: input.category_id,
      account_id: input.account_id,
      payment_method: input.payment_method,
      date: input.date,
    })

  if (txError) throw txError

  // Update account balance
  const { data: account, error: accountFetchError } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', input.account_id)
    .eq('user_id', user.id)
    .single()

  if (accountFetchError) throw accountFetchError

  const delta = input.type === 'income' ? input.amount : -input.amount
  const { error: updateError } = await supabase
    .from('accounts')
    .update({ balance: Number(account.balance) + delta })
    .eq('id', input.account_id)
    .eq('user_id', user.id)

  if (updateError) throw updateError

  revalidatePath('/')
}

export async function addAccount(input: {
  name: string
  emoji: string
  balance: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('accounts')
    .insert({ user_id: user.id, ...input })

  if (error) throw error
  revalidatePath('/')
}

export async function addCategory(input: {
  name: string
  emoji: string
  type: 'income' | 'expense'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('categories')
    .insert({ user_id: user.id, ...input })

  if (error) throw error
  revalidatePath('/')
}
