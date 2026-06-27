export type TransactionType = 'income' | 'expense'
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer'
export type CategoryType = 'income' | 'expense'

export interface Account {
  id: string
  user_id: string
  name: string
  emoji: string
  balance: number
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: CategoryType
  emoji: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string | null
  category_id: string | null
  amount: number
  type: TransactionType
  payment_method: PaymentMethod
  description: string | null
  date: string
  created_at: string
  // joined relations
  category?: Pick<Category, 'name' | 'emoji' | 'type'> | null
  account?: Pick<Account, 'name' | 'emoji'> | null
}

export interface DashboardData {
  balance: number
  monthlySpending: number
  transactions: Transaction[]
}
