import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/get-query-client'
import { keys } from '@/lib/query-keys'
import { getBalance, getMonthlySpending, getRecentTransactions, getAccounts, getCategories, getProjectedEndOfMonthBalance, getUpcomingRecurringTransactions } from './actions'
import { Dashboard } from '@/components/Dashboard'

export const dynamic = 'force-dynamic'

// SSR: prefetch all data so the first paint is instantaneous
export default async function Page() {
  const queryClient = getQueryClient()

  // Parallel prefetch — all run concurrently on the server
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: keys.balance,         queryFn: getBalance }),
    queryClient.prefetchQuery({ queryKey: keys.monthlySpending, queryFn: getMonthlySpending }),
    queryClient.prefetchQuery({ queryKey: keys.transactions(),  queryFn: () => getRecentTransactions(30) }),
    queryClient.prefetchQuery({ queryKey: keys.accounts,        queryFn: getAccounts }),
    queryClient.prefetchQuery({ queryKey: keys.categories(),    queryFn: () => getCategories() }),
    queryClient.prefetchQuery({ queryKey: keys.projectedBalance,queryFn: getProjectedEndOfMonthBalance }),
    queryClient.prefetchQuery({ queryKey: keys.upcomingRecurrings, queryFn: () => getUpcomingRecurringTransactions() }),
  ])

  return (
    // Serialise server-prefetched cache into HTML → zero flash on client
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Dashboard />
    </HydrationBoundary>
  )
}
