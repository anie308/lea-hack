"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import { EventCard } from "@/components/event-card"
import { getPublicEvents, getEventContributorCount } from "@/lib/events"

interface EventDisplay {
  id: string
  title: string
  type: "Wedding" | "Funeral" | "Naming" | "Thanksgiving"
  image: string
  raised: number
  target: number
  contributors: number
}

export default function BrowseEvents() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [allEvents, setAllEvents] = useState<EventDisplay[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const eventTypes = ["All", "Wedding", "Funeral", "Naming", "Thanksgiving"]

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        const publicEvents = await getPublicEvents()
        
        // Fetch contributor counts for each event
        const eventsWithCounts = await Promise.all(
          publicEvents.map(async (event) => {
            const contributorCount = await getEventContributorCount(event.id)
            return {
              id: event.id,
              title: event.title,
              type: event.event_type as "Wedding" | "Funeral" | "Naming" | "Thanksgiving",
              image: event.image_url || "/placeholder.svg",
              raised: event.raised_cents / 100, // Convert cents to naira
              target: event.target_cents / 100,
              contributors: contributorCount,
            }
          })
        )
        
        setAllEvents(eventsWithCounts)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const filteredEvents = allEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !selectedType || selectedType === "All" || event.type === selectedType
    return matchesSearch && matchesType
  })

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all mb-6 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Browse Events</h1>
          <p className="text-muted-foreground">Discover celebrations happening across Africa and lend your support</p>
        </div>

        {/* Search and Filter */}
        <div className="space-y-6 mb-12">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {eventTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type === "All" ? null : type)}
                className={`px-4 py-2 rounded-full font-semibold transition whitespace-nowrap ${
                  (type === "All" && !selectedType) || selectedType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/70 text-foreground"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} {...event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedType ? "No events found matching your search" : "No events yet. Be the first to create one!"}
            </p>
            {(searchQuery || selectedType) && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedType(null)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Stats Section */}
        <div className="mt-16 bg-primary/10 border-2 border-primary/20 rounded-xl p-8 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">₦2.3B</div>
            <p className="text-muted-foreground">Total Raised</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary mb-2">{allEvents.length}</div>
            <p className="text-muted-foreground">Active Events</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent mb-2">12K+</div>
            <p className="text-muted-foreground">Contributors</p>
          </div>
        </div>
      </div>
    </main>
  )
}
