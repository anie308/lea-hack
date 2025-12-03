export function EventCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border-2 border-border bg-card animate-pulse">
      <div className="w-full aspect-video bg-muted" />
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded-lg w-3/4" />
          <div className="h-4 bg-muted rounded-lg w-1/2" />
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full" />
          <div className="flex justify-between">
            <div className="h-4 bg-muted rounded-lg w-1/3" />
            <div className="h-4 bg-muted rounded-lg w-1/3" />
          </div>
        </div>
        <div className="h-10 bg-muted rounded-lg" />
      </div>
    </div>
  )
}

export function EventCardSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}
