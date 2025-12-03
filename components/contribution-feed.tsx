interface Contribution {
  id: string
  name: string
  amount: number
  time: string
  avatar: string
}

interface ContributionFeedProps {
  contributions?: Contribution[]
}

export function ContributionFeed({ contributions = [] }: ContributionFeedProps) {
  if (!contributions || contributions.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/30 rounded-xl border border-border">
        <p className="text-muted-foreground">No contributions yet. Be the first to contribute!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {contributions.map((contribution) => (
        <div
          key={contribution.id}
          className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition"
        >
          <img
            src={contribution.avatar || "/placeholder.svg"}
            alt={contribution.name}
            className="w-12 h-12 rounded-full border-2 border-border flex-shrink-0"
          />
          <div className="flex-grow min-w-0">
            <p className="font-semibold">{contribution.name}</p>
            <p className="text-sm text-muted-foreground">{contribution.time}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-primary">₦{contribution.amount.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
