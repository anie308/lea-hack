"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { EventCard } from "@/components/event-card"
import { Heart, Zap, ArrowRight } from "lucide-react"
import { SmoothScrollButton } from "@/components/smooth-scroll-button"
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

export default function Home() {
  const [events, setEvents] = useState<EventDisplay[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        const publicEvents = await getPublicEvents(6) // Get 6 featured events
        
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
        
        setEvents(eventsWithCounts)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <section className="relative px-4 sm:px-6 lg:px-8 pt-20 pb-32 sm:pt-32 sm:pb-40">
        {/* Background grid pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5ddd0_1px,transparent_1px),linear-gradient(to_bottom,#e5ddd0_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,#2d3748_1px,transparent_1px),linear-gradient(to_bottom,#2d3748_1px,transparent_1px)] opacity-30" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl -z-10" />
        </div>

        <div className="mx-auto max-w-7xl">
          {/* Hero grid layout */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left column - content */}
            <div className="space-y-8 lg:pt-8">
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] text-balance">
                  Celebrate life
                  <br />
                  <span className="text-primary">together</span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                  Connect with your community across Africa for weddings, memorials, and life's important moments. Every
                  contribution becomes an eternal thank-you gift on the blockchain.
                </p>
              </div>

              {/* CTA buttons - stacked on mobile, row on desktop */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/create"
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-200 hover:shadow-lg active:scale-95"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Create Event
                </Link>
                <Link
                  href="/browse"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-border text-foreground hover:border-primary hover:bg-primary/5 font-medium rounded-lg transition-all duration-200"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Explore
                </Link>
              </div>

              {/* Social proof numbers */}
              <div className="pt-8 space-y-4">
                <div className="text-sm text-muted-foreground font-medium">Trusted by communities</div>
                <div className="flex flex-wrap gap-8">
                  <div>
                    <div className="text-3xl font-bold">₦2.3B</div>
                    <div className="text-sm text-muted-foreground">raised</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">12K+</div>
                    <div className="text-sm text-muted-foreground">events</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">95%</div>
                    <div className="text-sm text-muted-foreground">success rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - visual grid showcase */}
            <div className="hidden lg:grid grid-cols-2 gap-6 lg:gap-8">
              {/* Large featured card - spans 2 rows */}
              <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                  <img
                    src="/nigerian-wedding-celebration.jpg"
                    alt="Wedding celebration"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Ade & Zainab</h3>
                  <div className="text-sm text-muted-foreground">₦450k / ₦1M</div>
                </div>
              </div>

              {/* Top right small card */}
              <div className="rounded-xl overflow-hidden bg-card border border-border hover:border-secondary/50 transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-secondary/20 to-accent/20 relative overflow-hidden">
                  <img
                    src="/african-baby-naming-celebration.jpg"
                    alt="Baby naming"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm">Chioma's Naming</div>
                  <div className="text-xs text-muted-foreground">87 contributors</div>
                </div>
              </div>

              {/* Bottom right small card */}
              <div className="rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 relative overflow-hidden">
                  <img
                    src="/african-memorial-ceremony.jpg"
                    alt="Memorial"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <div className="font-medium text-sm">Chief Okonkwo</div>
                  <div className="text-xs text-muted-foreground">Memorial fund</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-bold">Featured right now</h2>
            <p className="text-muted-foreground">Real celebrations happening across Africa</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} {...event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
              <p className="text-muted-foreground mb-4">No events yet. Be the first to create one!</p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition"
              >
                <Zap className="w-4 h-4" />
                Create Event
              </Link>
            </div>
          )}

          <div className="text-center pt-12">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
            >
              View all events <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">How LifeEvents Works</h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-bold mb-2">Create Event</h3>
              <p className="text-sm text-muted-foreground">Share your celebration details and set a funding target</p>
            </div>
            <div className="text-center">
              <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💝</span>
              </div>
              <h3 className="font-bold mb-2">Invite & Share</h3>
              <p className="text-sm text-muted-foreground">Share with your community on WhatsApp, Twitter, Telegram</p>
            </div>
            <div className="text-center">
              <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="font-bold mb-2">Contribute Now</h3>
              <p className="text-sm text-muted-foreground">Contributors send funds via Paystack easily</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎁</span>
              </div>
              <h3 className="font-bold mb-2">Get NFT Gift</h3>
              <p className="text-sm text-muted-foreground">Every contributor gets an onchain thank-you tribute</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 sm:px-6 lg:px-8 py-12 mt-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">LifeEvents Africa</h3>
              <p className="text-sm text-muted-foreground">Celebrating life's moments across Africa</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-muted-foreground hover:text-foreground">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/browse" className="text-muted-foreground hover:text-foreground">
                    Browse
                  </Link>
                </li>
                <li>
                  <Link href="/create" className="text-muted-foreground hover:text-foreground">
                    Create
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Follow</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Telegram
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 LifeEvents Africa. Building communities, one celebration at a time.</p>
          </div>
        </div>
      </footer>

      {/* Smooth Scroll Button */}
      <SmoothScrollButton />
    </main>
  )
}
