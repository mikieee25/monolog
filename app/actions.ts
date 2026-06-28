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
    options: {
      emailRedirectTo: 'https://monolog-zeta.vercel.app/',
    }
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
  is_recurring?: boolean
  recurrence_day?: number
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

  // Insert recurring template if requested
  if (input.is_recurring && input.recurrence_day) {
    const { error: recurError } = await supabase
      .from('recurring_transactions')
      .insert({
        user_id: user.id,
        amount: input.amount,
        type: input.type,
        description: input.description || null,
        category_id: input.category_id,
        account_id: input.account_id,
        payment_method: input.payment_method,
        recurrence_day: input.recurrence_day,
        last_processed: input.date // since we just added the initial transaction for this date
      })
    if (recurError) throw recurError
  }

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

export async function updateTransaction(id: string, input: {
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

  const { data: oldTx, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  
  if (fetchError) throw fetchError

  // Revert old transaction's effect
  const oldDelta = oldTx.type === 'income' ? -oldTx.amount : Number(oldTx.amount)
  if (oldTx.account_id) {
    const { data: oldAcc } = await supabase.from('accounts').select('balance').eq('id', oldTx.account_id).single()
    if (oldAcc) {
      await supabase.from('accounts').update({ balance: Number(oldAcc.balance) + oldDelta }).eq('id', oldTx.account_id)
    }
  }

  // Update
  const { error: updateError } = await supabase
    .from('transactions')
    .update({
      amount: input.amount,
      type: input.type,
      description: input.description || null,
      category_id: input.category_id,
      account_id: input.account_id,
      payment_method: input.payment_method,
      date: input.date,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (updateError) throw updateError

  // Apply new effect
  const newDelta = input.type === 'income' ? input.amount : -input.amount
  if (input.account_id) {
    const { data: newAcc } = await supabase.from('accounts').select('balance').eq('id', input.account_id).single()
    if (newAcc) {
      await supabase.from('accounts').update({ balance: Number(newAcc.balance) + newDelta }).eq('id', input.account_id)
    }
  }

  revalidatePath('/')
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: tx } = await supabase.from('transactions').select('*').eq('id', id).eq('user_id', user.id).single()
  if (tx) {
    const delta = tx.type === 'income' ? -tx.amount : Number(tx.amount)
    if (tx.account_id) {
      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', tx.account_id).single()
      if (acc) {
        await supabase.from('accounts').update({ balance: Number(acc.balance) + delta }).eq('id', tx.account_id)
      }
    }
  }

  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/')
}

export async function updateCategory(id: string, input: { name: string, emoji: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('categories').update(input).eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/')
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/')
}

export async function updateAccount(id: string, input: { name: string, emoji: string, balance: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('accounts').update(input).eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/')
}

export async function deleteAccount(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/')
}

// ─── Recurring Transactions ──────────────────────────────────────────────────

export async function processRecurringTransactions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: recurrings, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', user.id)

  if (error || !recurrings || recurrings.length === 0) return

  const now = new Date()

  for (const rt of recurrings) {
    const created = new Date(rt.created_at)
    const start = rt.last_processed ? new Date(rt.last_processed) : created
    const check = new Date(start.getFullYear(), start.getMonth(), 1)
    
    let latestProcessed = rt.last_processed

    while (
      check.getFullYear() < now.getFullYear() || 
      (check.getFullYear() === now.getFullYear() && check.getMonth() <= now.getMonth())
    ) {
      const cy = check.getFullYear()
      const cm = check.getMonth()
      
      const lastDay = new Date(cy, cm + 1, 0).getDate()
      const rDay = Math.min(rt.recurrence_day, lastDay)
      const rDate = new Date(cy, cm, rDay)
      
      if (rDate <= now && rDate > start) {
        const rDateStr = [cy, String(cm + 1).padStart(2, '0'), String(rDay).padStart(2, '0')].join('-')
        
        const { error: txError } = await supabase.from('transactions').insert({
          user_id: user.id,
          account_id: rt.account_id,
          category_id: rt.category_id,
          amount: rt.amount,
          type: rt.type,
          payment_method: rt.payment_method,
          description: rt.description ? `${rt.description} (Auto)` : 'Automatic Recurring',
          date: rDateStr
        })

        if (!txError) {
          latestProcessed = rDateStr
          
          if (rt.account_id) {
            const delta = rt.type === 'income' ? Number(rt.amount) : -Number(rt.amount)
            const { data: acc } = await supabase.from('accounts').select('balance').eq('id', rt.account_id).single()
            if (acc) {
              await supabase.from('accounts').update({ balance: Number(acc.balance) + delta }).eq('id', rt.account_id)
            }
          }
        }
      }
      
      check.setMonth(check.getMonth() + 1)
    }

    if (latestProcessed !== rt.last_processed) {
      await supabase.from('recurring_transactions').update({ last_processed: latestProcessed }).eq('id', rt.id)
    }
  }
}

export async function getUpcomingRecurringTransactions(days = 14) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: recurrings } = await supabase
    .from('recurring_transactions')
    .select('*, category:categories(name, emoji, type)')
    .eq('user_id', user.id)

  if (!recurrings) return []

  const now = new Date()
  now.setHours(0, 0, 0, 0) // start of today
  const upcoming = []

  for (const rt of recurrings) {
    const rDay = Math.min(rt.recurrence_day, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())
    let rDate = new Date(now.getFullYear(), now.getMonth(), rDay)
    
    // If it already passed this month, look at next month
    if (rDate < now) {
      const nextMonthLastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate()
      const nextMonthDay = Math.min(rt.recurrence_day, nextMonthLastDay)
      rDate = new Date(now.getFullYear(), now.getMonth() + 1, nextMonthDay)
    }

    const diffDays = Math.ceil((rDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
    
    if (diffDays <= days) {
      upcoming.push({
        ...rt,
        due_date: rDate.toISOString(),
        days_until: diffDays
      })
    }
  }

  return upcoming.sort((a, b) => a.days_until - b.days_until)
}

export async function getProjectedEndOfMonthBalance() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data: accounts } = await supabase.from('accounts').select('balance').eq('user_id', user.id)
  let currentBalance = accounts?.reduce((sum, a) => sum + Number(a.balance), 0) || 0

  const { data: recurrings } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', user.id)

  if (!recurrings) return currentBalance

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  for (const rt of recurrings) {
    const rDay = Math.min(rt.recurrence_day, lastDayOfMonth.getDate())
    const rDate = new Date(now.getFullYear(), now.getMonth(), rDay)
    
    // If it hasn't happened yet this month, factor it into the projection
    if (rDate >= now) {
      if (rt.type === 'expense') {
        currentBalance -= Number(rt.amount)
      } else {
        currentBalance += Number(rt.amount)
      }
    }
  }

  return currentBalance
}

// ─── Budgets ───────────────────────────────────────────────────────────────

export async function getBudgets() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('budgets')
    .select('*, category:categories(name, emoji)')
    .eq('user_id', user.id)

  if (error) throw error
  return data
}

export async function setBudget(input: { category_id: string, amount: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // upsert on user_id and category_id
  const { error } = await supabase
    .from('budgets')
    .upsert({
      user_id: user.id,
      category_id: input.category_id,
      amount: input.amount
    }, { onConflict: 'user_id, category_id' })

  if (error) throw error
  revalidatePath('/')
}

export async function addRecurringTransactionsBatch(transactions: any[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const toInsert = transactions.map(t => ({
    user_id: user.id,
    amount: t.amount,
    type: t.type,
    description: t.description,
    category_id: t.category_id,
    account_id: t.account_id,
    payment_method: t.payment_method,
    recurrence_day: t.recurrence_day,
    last_processed: null
  }))

  const { error } = await supabase
    .from('recurring_transactions')
    .insert(toInsert)

  if (error) throw error
  revalidatePath('/')
}
