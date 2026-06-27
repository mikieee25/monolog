export const keys = {
  balance:         ['balance']                        as const,
  monthlySpending: ['monthly-spending']               as const,
  transactions:    (limit = 30) => ['transactions', limit] as const,
  accounts:        ['accounts']                       as const,
  categories:      (type?: string) => ['categories', type] as const,
}
