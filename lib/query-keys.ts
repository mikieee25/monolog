export const keys = {
  balance:         ['balance'] as const,
  projectedBalance:['projected-balance'] as const,
  monthlySpending: ['monthly-spending'] as const,
  transactions:    (limit = 30) => ['transactions', limit] as const,
  accounts:        ['accounts'] as const,
  categories:      (type?: string) => type ? ['categories', type] : ['categories'],
  upcomingRecurrings: ['upcoming-recurrings'] as const,
}
