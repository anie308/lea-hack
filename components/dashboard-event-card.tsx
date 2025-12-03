"use client"

import Link from "next/link"
import { MoreVertical } from "lucide-react"
import { useState } from "react"

interface DashboardEventCardProps {
  id: string
  title: string
  type: string
  image: string
  raised: number
  target: number
  contributors: number
  status: "active" | "completed"
  createdAt: string
  daysLeft: number
}

export function DashboardEventCard({
  id,
  title,
  type,
  image,
  raised,
  target,
  contributors,
  status,
  createdAt,
  daysLeft,
}: DashboardEventCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const percentage = Math.round((raised / target) * 100)
  const amountNeeded = target - raised

  return (
    <div className="bg-card border-2 border-border rounded-xl overflow-hidden hover:border-primary transition-all group">
      {/* Image */}
      <div className="relative w-full aspect-video bg-muted overflow-hidden">
        <img
          src={image || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
              status === "active" ? "bg-green-600" : "bg-gray-600"
            }`}
          >
            {status === "active" ? "Active" : "Completed"}
          </div>
          {daysLeft > 0 && (
            <div className="bg-secondary text-white px-3 py-1 rounded-full text-xs font-semibold">{daysLeft}d left</div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">Created {createdAt}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-muted/30 p-2 rounded">
            <div className="font-bold text-primary">{contributors}</div>
            <div className="text-xs text-muted-foreground">Contributors</div>
          </div>
          <div className="bg-muted/30 p-2 rounded">
            <div className="font-bold text-secondary">{percentage}%</div>
            <div className="text-xs text-muted-foreground">Funded</div>
          </div>
          <div className="bg-muted/30 p-2 rounded">
            <div className="font-bold text-accent">₦{(amountNeeded / 1000).toFixed(0)}K</div>
            <div className="text-xs text-muted-foreground">Needed</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-primary font-semibold">₦{raised.toLocaleString()}</span>
            <span className="text-muted-foreground">₦{target.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Link
            href={`/event/${id}`}
            className="flex-1 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 font-semibold rounded-lg transition text-sm text-center"
          >
            View
          </Link>
          <button className="flex-1 px-3 py-2 bg-muted hover:bg-muted/70 text-foreground font-semibold rounded-lg transition text-sm">
            Edit
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="px-3 py-2 bg-muted hover:bg-muted/70 text-foreground rounded-lg transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-card border-2 border-border rounded-lg shadow-lg z-10 w-32">
                <button className="w-full text-left px-4 py-2 hover:bg-muted text-sm">Share</button>
                <button className="w-full text-left px-4 py-2 hover:bg-muted text-sm">Withdraw</button>
                <button className="w-full text-left px-4 py-2 hover:bg-muted text-sm text-red-600">Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
