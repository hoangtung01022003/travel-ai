import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>

      {/* Quota bar */}
      <Skeleton className="h-8 w-60 rounded-full" />

      {/* Itinerary list */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-start gap-4 p-5">
              <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
