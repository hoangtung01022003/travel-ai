import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Filter bar */}
      <div className="mb-8 rounded-2xl border border-border bg-white p-4 space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        {/* Star rating + price filters */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-40 rounded-xl" />
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>
      </div>

      <Skeleton className="mb-4 h-4 w-44" />

      {/* Hotel cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border bg-white">
            <Skeleton className="h-56 w-full rounded-none" />
            <div className="p-5 space-y-3">
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-3.5 w-3.5 rounded-full" />
                ))}
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <div className="flex items-center justify-between border-t border-border pt-3">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
