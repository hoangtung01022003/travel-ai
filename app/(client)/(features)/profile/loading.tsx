import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="space-y-6">
        {/* Avatar card */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6">
          <div className="flex items-center gap-5">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-56" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-48" />
            </div>
          ))}
        </div>

        {/* Quick links card */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
