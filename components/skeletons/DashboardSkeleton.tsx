import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:gap-12 lg:gap-16 min-h-dvh pb-24 md:pb-12 md:pt-16 md:px-8">
      
      {/* Left Column (Desktop) / Top Section (Mobile) */}
      <div className="flex flex-col w-full md:w-[320px] lg:w-[380px] shrink-0">
        {/* Header */}
        <header className="flex items-center justify-between px-5 md:px-0 pt-14 md:pt-0 pb-2 md:pb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-zinc-100">Monolog</h1>
            <Skeleton className="h-7 w-12 rounded-full bg-zinc-800" />
          </div>
          <Skeleton className="h-3 w-20 bg-zinc-800" />
        </header>

        {/* Balance section */}
        <div className="px-5 md:px-0 pt-4 pb-2">
          <Skeleton className="h-3 w-24 bg-zinc-800 mb-2" />
          <Skeleton className="h-10 w-48 bg-zinc-800 mb-4" />
          <div className="flex items-center gap-3">
            <div>
              <Skeleton className="h-2.5 w-16 bg-zinc-800 mb-1" />
              <Skeleton className="h-4 w-24 bg-zinc-800" />
            </div>
            <Skeleton className="h-9 w-12 rounded-full bg-zinc-800 ml-auto" />
            <Skeleton className="h-9 w-20 rounded-full bg-zinc-800" />
          </div>
        </div>

        {/* Ai Nudge skeleton */}
        <div className="px-5 md:px-0 mt-4 md:mt-6">
          <Skeleton className="h-16 w-full rounded-2xl bg-zinc-800/50" />
        </div>

        {/* Subscription Radar skeleton (Empty by default like real app) */}
        
        {/* Divider (Mobile Only) */}
        <div className="h-px bg-zinc-800 mx-5 my-4 md:hidden" />

        {/* Mobile Secondary Actions */}
        <div className="md:hidden flex gap-2 overflow-x-auto px-5 pb-2 scrollbar-none">
          <Skeleton className="h-9 w-28 rounded-xl bg-zinc-800 flex-shrink-0" />
          <Skeleton className="h-9 w-28 rounded-xl bg-zinc-800 flex-shrink-0" />
          <Skeleton className="h-9 w-32 rounded-xl bg-zinc-800 flex-shrink-0" />
        </div>

        {/* Desktop Quick Actions (Hidden on Mobile) */}
        <div className="hidden md:flex flex-col gap-2 mt-8">
          <Skeleton className="h-14 w-full rounded-xl bg-zinc-100/10" />
          <Skeleton className="h-14 w-full rounded-xl bg-zinc-800/50" />
          <Skeleton className="h-14 w-full rounded-xl bg-zinc-800/50" />
          <Skeleton className="h-14 w-full rounded-xl bg-zinc-800/50" />
          <Skeleton className="h-14 w-full rounded-xl bg-zinc-800/50" />
          <Skeleton className="h-14 w-full rounded-xl bg-zinc-800/50" />
        </div>
      </div>

      {/* Right Column (Desktop) / Bottom Section (Mobile) */}
      <div className="flex-1 px-5 md:p-8 flex flex-col md:bg-zinc-900/30 md:backdrop-blur-xl md:border md:border-zinc-800/60 md:rounded-3xl md:shadow-2xl mt-4 md:mt-0">
        
        {/* Tabs & Search */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex bg-zinc-800/50 p-1 rounded-xl">
            <Skeleton className="h-8 w-16 rounded-lg bg-zinc-700 mr-1" />
            <Skeleton className="h-8 w-20 rounded-lg bg-zinc-800/50" />
          </div>
        </div>
        <div className="mb-4">
          <Skeleton className="h-10 w-full rounded-xl bg-zinc-800/50" />
        </div>

        {/* Transaction feed skeleton */}
        <div className="space-y-5 pb-4">
          <div>
            <Skeleton className="h-3 w-12 bg-zinc-800 mb-4 uppercase tracking-wider" />
            <div className="space-y-0.5">
              {[1, 2, 3].map(i => <TxRowSkeleton key={i} />)}
            </div>
          </div>
          <div>
            <Skeleton className="h-3 w-16 bg-zinc-800 mb-4 uppercase tracking-wider" />
            <div className="space-y-0.5">
              {[4, 5].map(i => <TxRowSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TxRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-3 rounded-xl bg-zinc-900">
      <Skeleton className="h-10 w-10 rounded-full bg-zinc-800 flex-shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <Skeleton className="h-4 w-32 bg-zinc-800" />
        <Skeleton className="h-3 w-20 bg-zinc-800" />
      </div>
      <Skeleton className="h-4 w-16 bg-zinc-800 flex-shrink-0" />
    </div>
  )
}
