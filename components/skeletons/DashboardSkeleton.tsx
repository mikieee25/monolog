import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-dvh pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-2">
        <Skeleton className="h-5 w-24 bg-zinc-800" />
        <Skeleton className="h-3 w-20 bg-zinc-800" />
      </div>

      {/* Balance section */}
      <div className="px-5 pt-4 pb-2">
        <Skeleton className="h-3 w-20 bg-zinc-800 mb-2" />
        <Skeleton className="h-10 w-48 bg-zinc-800 mb-4" />
        <div className="flex items-center gap-3">
          <div>
            <Skeleton className="h-2.5 w-16 bg-zinc-800 mb-1" />
            <Skeleton className="h-4 w-24 bg-zinc-800" />
          </div>
          <Skeleton className="h-9 w-20 rounded-full bg-zinc-800 ml-auto" />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-zinc-800 mx-5 my-4" />

      {/* Transaction feed skeleton */}
      <div className="flex-1 px-5">
        <Skeleton className="h-2.5 w-12 bg-zinc-800 mb-4" />

        {/* Today group */}
        <Skeleton className="h-2.5 w-8 bg-zinc-800 mb-3" />
        {[1, 2, 3].map(i => <TxRowSkeleton key={i} />)}

        {/* Yesterday group */}
        <div className="mt-5">
          <Skeleton className="h-2.5 w-14 bg-zinc-800 mb-3" />
          {[4, 5].map(i => <TxRowSkeleton key={i} />)}
        </div>
      </div>
    </div>
  )
}

function TxRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-3">
      <Skeleton className="h-10 w-10 rounded-full bg-zinc-800 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32 bg-zinc-800" />
        <Skeleton className="h-2.5 w-20 bg-zinc-800" />
      </div>
      <Skeleton className="h-3.5 w-16 bg-zinc-800" />
    </div>
  )
}
