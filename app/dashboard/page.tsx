"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Users, DollarSign, Calendar, Settings, Zap, Wallet } from "lucide-react"
import { DashboardEventCard } from "@/components/dashboard-event-card"
import { ProfileModal } from "@/components/profile-modal"
import { useAuth } from '@campnetwork/origin/react'
import { getDashboardStats, getEventContributorCount } from "@/lib/events"
import { getOrCreateUserFromWallet } from "@/lib/auth"
import { formatDistanceToNow } from "date-fns"
import { toast } from 'sonner'

interface DashboardEvent {
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

export default function Dashboard() {
  const { jwt, viem } = useAuth()
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all")
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [organizerId, setOrganizerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  // Dashboard data
  const [organizer, setOrganizer] = useState({
    name: "Event Organizer",
    avatar: "/placeholder.svg",
    totalRaised: 0,
    totalEvents: 0,
    activeEvents: 0,
  })
  const [events, setEvents] = useState<DashboardEvent[]>([])
  const [profile, setProfile] = useState<{ name: string | null; avatar_url: string | null; bio: string | null } | null>(null)

  // Get wallet address and load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      // Check if wallet is connected - need both jwt and viem
      if (!jwt || !viem || typeof window === 'undefined') {
        setWalletAddress(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        // Get accounts from wallet
        const accounts = await viem.request({ method: 'eth_accounts' })
        if (accounts && accounts.length > 0) {
          const address = accounts[0]
          setWalletAddress(address)

          // Get or create user
          const userResult = await getOrCreateUserFromWallet(address)
          if (userResult.user) {
            setOrganizerId(userResult.user.id)

            // Load dashboard stats
            const stats = await getDashboardStats(userResult.user.id, address)
            
            setProfile(stats.profile)
            setOrganizer({
              name: stats.profile?.name || address.slice(0, 6) + '...' + address.slice(-4),
              avatar: stats.profile?.avatar_url || "/placeholder.svg",
              totalRaised: stats.totalRaised / 100, // Convert cents to naira
              totalEvents: stats.totalEvents,
              activeEvents: stats.activeEvents,
            })

            // Format events for display
            const formattedEvents = await Promise.all(
              stats.events.map(async (event) => {
                const contributorCount = await getEventContributorCount(event.id)
                const raised = (event.raised_cents || 0) / 100
                const target = event.target_cents / 100
                const status: "active" | "completed" = raised >= target ? "completed" : "active"
                
                // Calculate days since creation (simplified - you might want to add event end dates)
                const createdAt = new Date(event.created_at)
                const daysSince = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
                
                return {
                  id: event.id,
                  title: event.title,
                  type: event.event_type,
                  image: event.image_url || "/placeholder.svg",
                  raised,
                  target,
                  contributors: contributorCount,
                  status,
                  createdAt: formatDistanceToNow(createdAt, { addSuffix: true }),
                  daysLeft: status === "active" ? Math.max(0, 30 - daysSince) : 0, // Simplified - assume 30 day events
                }
              })
            )

            setEvents(formattedEvents)
          } else {
            // No user found - wallet connected but no organizer account
            setWalletAddress(null)
          }
        } else {
          // No accounts found
          setWalletAddress(null)
        }
      } catch (error) {
        console.error('Error loading dashboard:', error)
        setWalletAddress(null)
        toast.error('Failed to Load Dashboard', {
          description: 'Please try refreshing the page.',
        })
      } finally {
        setIsLoading(false)
      }
    }

    // Only load if we have jwt (wallet is authenticated)
    if (jwt) {
      loadDashboard()
    } else {
      setWalletAddress(null)
      setIsLoading(false)
    }

    // Listen for account changes
    if (viem && typeof window !== 'undefined' && jwt) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          // Reload dashboard when account changes
          loadDashboard()
        } else {
          // Wallet disconnected
          setWalletAddress(null)
          setIsLoading(false)
        }
      }

      viem.on?.('accountsChanged', handleAccountsChanged)
      
      return () => {
        viem.removeListener?.('accountsChanged', handleAccountsChanged)
      }
    }
  }, [viem, jwt])

  const filteredEvents = events.filter((event) => {
    if (activeTab === "active") return event.status === "active"
    if (activeTab === "completed") return event.status === "completed"
    return true
  })

  const handleProfileUpdate = () => {
    // Reload dashboard data after profile update
    if (walletAddress && organizerId) {
      const reloadDashboard = async () => {
        try {
          const stats = await getDashboardStats(organizerId, walletAddress)
          setProfile(stats.profile)
          setOrganizer({
            name: stats.profile?.name || walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4),
            avatar: stats.profile?.avatar_url || "/placeholder.svg",
            totalRaised: stats.totalRaised / 100,
            totalEvents: stats.totalEvents,
            activeEvents: stats.activeEvents,
          })
        } catch (error) {
          console.error('Error reloading dashboard:', error)
        }
      }
      reloadDashboard()
    }
  }

  const stats = [
    {
      label: "Total Raised",
      value: `₦${organizer.totalRaised.toLocaleString()}`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Total Events",
      value: organizer.totalEvents,
      icon: Calendar,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      label: "Active Events",
      value: organizer.activeEvents,
      icon: Zap,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Total Contributors",
      value: events.reduce((sum, e) => sum + e.contributors, 0),
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ]

  // Show wallet connection required if no jwt (not authenticated)
  if (!jwt) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Wallet Connection Required</h2>
            <p className="text-muted-foreground mb-6">Please connect your wallet using the button in the navbar to view your dashboard</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // If jwt exists but still loading wallet address or dashboard data, show loading
  if (isLoading || !walletAddress) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {!walletAddress ? 'Connecting wallet...' : 'Loading dashboard...'}
            </p>
          </div>
        </div>
      </main>
    )
  }

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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Your Dashboard</h1>
              <p className="text-muted-foreground">Manage your events and track contributions</p>
            </div>
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all self-start sm:self-auto"
            >
              <Zap className="w-5 h-5" />
              Create New Event
            </Link>
          </div>
        </div>

        {/* Organizer Profile */}
        <div className="bg-card border-2 border-border rounded-xl p-6 mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={organizer.avatar || "/placeholder.svg"}
                alt={organizer.name}
                className="w-16 h-16 rounded-full border-2 border-border"
              />
              <div>
                <h2 className="text-2xl font-bold">{organizer.name}</h2>
                <p className="text-muted-foreground">Event Organizer</p>
              </div>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 border-2 border-border hover:border-primary text-primary rounded-lg transition"
            >
              <Settings className="w-5 h-5" />
              Profile Settings
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-card border-2 border-border rounded-xl p-6 space-y-3">
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            )
          })}
        </div>

        {/* Events Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Your Events</h2>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            {(["all", "active", "completed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-semibold border-b-2 transition -mb-1 capitalize ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "all" ? "All Events" : tab === "active" ? "Active" : "Completed"}
              </button>
            ))}
          </div>

          {/* Events Grid */}
          {filteredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <DashboardEventCard key={event.id} {...event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
              <p className="text-muted-foreground mb-4">No events found</p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition"
              >
                <Zap className="w-4 h-4" />
                Create Your First Event
              </Link>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-16 bg-primary/10 border-2 border-primary/20 rounded-xl p-8 space-y-4">
          <h3 className="text-lg font-bold">Tips to Maximize Your Fundraising</h3>
          <ul className="grid md:grid-cols-2 gap-4">
            <li className="flex gap-3">
              <span className="text-primary font-bold">1.</span>
              <span className="text-muted-foreground">
                Share your event on WhatsApp, Twitter, and Telegram regularly
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">2.</span>
              <span className="text-muted-foreground">
                Update your event story with progress and thank contributors
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">3.</span>
              <span className="text-muted-foreground">Use a clear, compelling photo that captures your event</span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold">4.</span>
              <span className="text-muted-foreground">Engage with your contributors and respond to their messages</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Profile Modal */}
      {walletAddress && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          walletAddress={walletAddress}
          currentProfile={profile}
          onUpdate={handleProfileUpdate}
        />
      )}
    </main>
  )
}
