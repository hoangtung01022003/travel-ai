import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mb-10 text-center space-y-4">
        <Skeleton className="mx-auto h-8 w-48 rounded-full" />
        <Skeleton className="mx-auto h-12 w-2/3" />
        <Skeleton className="mx-auto h-5 w-96" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Form skeleton */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-5">
            <Skeleton className="h-6 w-44" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        {/* Result area skeleton */}
        <div className="lg:col-span-3 flex flex-col items-center justify-center py-24 space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
    </div>
  )
}
