import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface EventCardProps {
  id: string
  title: string
  type: "Wedding" | "Funeral" | "Naming" | "Thanksgiving"
  image: string
  raised: number
  target: number
  contributors: number
}

export function EventCard({ id, title, type, image, raised, target, contributors }: EventCardProps) {
  const percentage = Math.round((raised / target) * 100)

  return (
    <Link href={`/event/${id}`}>
      <div className="group rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-all duration-300 bg-card hover:shadow-lg cursor-pointer">
        {/* Image */}
        <div className="relative w-full aspect-video bg-muted overflow-hidden">
          <img
            src={image || "/placeholder.svg"}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
            {type}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{contributors} people contributing</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-primary">₦{raised.toLocaleString()}</span>
              <span className="text-muted-foreground">₦{target.toLocaleString()}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
            View Event <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}
