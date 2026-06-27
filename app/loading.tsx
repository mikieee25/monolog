import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'

// Shown by Next.js Suspense while the Server Component page.tsx is streaming
export default function Loading() {
  return <DashboardSkeleton />
}
