"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Heart, Copy, Check, Wallet } from "lucide-react"
import { ContributionModal } from "@/components/contribution-modal"
import { ContributionFeed } from "@/components/contribution-feed"
import { SuccessModal } from "@/components/success-modal"
import { getEventById, getEventContributions, getEventContributorCount } from "@/lib/events"
import { Event } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"
import { toast } from 'sonner'

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const [showContributionModal, setShowContributionModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [event, setEvent] = useState<Event | null>(null)
  const [contributions, setContributions] = useState<any[]>([])
  const [contributorCount, setContributorCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setIsLoading(true)
        const eventData = await getEventById(id)
        
        if (!eventData) {
          // Event not found
          return
        }

        setEvent(eventData)

        // Fetch contributions and contributor count
        const [contribs, count] = await Promise.all([
          getEventContributions(id),
          getEventContributorCount(id)
        ])

        // Format contributions for display
        const formattedContribs = contribs.map((contrib) => ({
          id: contrib.id,
          name: contrib.contributor_name || contrib.contributor_email.split('@')[0] || "Anonymous",
          amount: contrib.amount_cents / 100, // Convert cents to naira
          time: formatDistanceToNow(new Date(contrib.created_at), { addSuffix: true }),
          avatar: "/placeholder.svg",
        }))

        setContributions(formattedContribs)
        setContributorCount(count)
      } catch (error) {
        console.error('Error fetching event data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventData()
  }, [id])

  // Handle payment success callback from Paystack
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const reference = searchParams.get('reference')
    
    if (paymentStatus === 'success' && reference) {
      // Verify payment and process if webhook hasn't already
      const verifyAndProcessPayment = async () => {
        try {
          // First, verify payment with Paystack
          const verifyResponse = await fetch('/api/paystack/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reference }),
          })

          const verifyData = await verifyResponse.json()

          if (!verifyData.success || !verifyData.verified) {
            toast.error('Payment Verification Failed', {
              description: 'Unable to verify payment. Please contact support.',
            })
            return
          }

          // Check if contribution already exists (webhook may have processed it)
          const { supabase } = await import('@/lib/supabase')
          const { data: existingContributions } = await supabase
            .from('contributions')
            .select('*')
            .eq('event_id', id)
            .eq('contributor_email', verifyData.customerEmail)
            .order('created_at', { ascending: false })
            .limit(1)

          // If contribution doesn't exist, create it manually (fallback if webhook failed)
          if (!existingContributions || existingContributions.length === 0) {
            const { error: insertError } = await supabase
              .from('contributions')
              .insert({
                event_id: verifyData.eventId,
                amount_cents: verifyData.amountCents,
                contributor_email: verifyData.customerEmail,
                contributor_name: verifyData.transaction.customer?.first_name 
                  ? `${verifyData.transaction.customer.first_name} ${verifyData.transaction.customer.last_name || ''}`.trim()
                  : verifyData.customerEmail.split('@')[0],
                origin_share_id: null,
              })

            if (insertError) {
              console.error('Failed to insert contribution:', insertError)
              toast.error('Payment Recorded', {
                description: 'Payment verified but failed to record. Please contact support.',
              })
            } else {
              // Recalculate raised_cents from all contributions to avoid double-counting
              const { data: allContributions } = await supabase
                .from('contributions')
                .select('amount_cents')
                .eq('event_id', id)

              if (allContributions) {
                const totalRaised = allContributions.reduce((sum, contrib) => sum + (contrib.amount_cents || 0), 0)
                await supabase
                  .from('events')
                  .update({ raised_cents: totalRaised })
                  .eq('id', id)
              }
            }
          } else {
            // Contribution already exists - just recalculate to ensure accuracy
            const { data: allContributions } = await supabase
              .from('contributions')
              .select('amount_cents')
              .eq('event_id', id)

            if (allContributions) {
              const totalRaised = allContributions.reduce((sum, contrib) => sum + (contrib.amount_cents || 0), 0)
              await supabase
                .from('events')
                .update({ raised_cents: totalRaised })
                .eq('id', id)
            }
          }

          toast.success('Payment Successful!', {
            description: 'Your contribution has been recorded. Thank you!',
            duration: 5000,
          })

          // Refresh event data
          const eventData = await getEventById(id)
          if (eventData) {
            setEvent(eventData)
            
            const [contribs, count] = await Promise.all([
              getEventContributions(id),
              getEventContributorCount(id)
            ])
            
            const formattedContribs = contribs.map((contrib) => ({
              id: contrib.id,
              name: contrib.contributor_name || contrib.contributor_email.split('@')[0] || "Anonymous",
              amount: contrib.amount_cents / 100,
              time: formatDistanceToNow(new Date(contrib.created_at), { addSuffix: true }),
              avatar: "/placeholder.svg",
            }))
            
            setContributions(formattedContribs)
            setContributorCount(count)
          }
        } catch (error) {
          console.error('Error verifying payment:', error)
          toast.error('Payment Verification Error', {
            description: 'Unable to verify payment. Please refresh the page.',
          })
        }
      }

      verifyAndProcessPayment()

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [searchParams, id])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading event...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or has been removed.</p>
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

  const raised = event.raised_cents / 100
  const target = event.target_cents / 100
  const percentage = target > 0 ? Math.round((raised / target) * 100) : 0
  const amountNeeded = Math.max(0, target - raised) // Ensure it's never negative
  const isGoalReached = raised >= target

  const shareUrl = typeof window !== "undefined" ? window.location.href : ""

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleContributionSuccess = () => {
    setShowContributionModal(false)
    setShowSuccessModal(true)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 lg:px-8 py-3">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cover Image & Header */}
            <div className="space-y-4">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-border">
                <img src={event.image_url || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-block bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold mb-3">
                    {event.event_type}
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-balance">{event.title}</h1>
                </div>
              </div>

              {/* Organizer */}
              {event.wallet_address && (
                <div className="flex items-center gap-3 pt-4">
                  <div className="w-12 h-12 rounded-full border-2 border-border bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Organized by</p>
                    <p className="font-semibold font-mono text-xs">
                      {event.wallet_address.slice(0, 6)}...{event.wallet_address.slice(-4)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Story Section */}
            {event.description && (
              <div className="space-y-4 bg-muted/30 p-6 rounded-xl border border-border">
                <h2 className="text-xl font-bold">The Story</h2>
                <p className="text-foreground/90 leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Contributions Feed */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">People Supporting This Event</h2>
              <ContributionFeed contributions={contributions} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-32 lg:h-fit">
            {/* Progress Card */}
            <div className="bg-card border-2 border-border rounded-xl p-6 space-y-6">
              {/* Amount */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-3xl font-bold text-primary">₦{raised.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">of ₦{target.toLocaleString()}</span>
                </div>
                {isGoalReached ? (
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    🎉 Goal Reached!
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-secondary">
                    ₦{amountNeeded.toLocaleString()} more needed
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-primary">{percentage}%</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-muted/30 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">{contributorCount}</div>
                  <div className="text-xs text-muted-foreground">Contributors</div>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-secondary">{contributions.length}</div>
                  <div className="text-xs text-muted-foreground">Recent gifts</div>
                </div>
              </div>

              {/* Primary CTA */}
              <button
                onClick={() => setShowContributionModal(true)}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
              >
                <Heart className="w-5 h-5" />
                Contribute Now
              </button>

              {/* Share Buttons */}
              <div className="space-y-3 pt-4 border-t border-border">
                <p className="text-sm font-semibold">Share with your community</p>

                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={`https://wa.me/?text=Check this out: ${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-3 bg-muted hover:bg-muted/70 rounded-lg transition text-sm font-semibold"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=Join me in supporting this event&url=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-3 bg-muted hover:bg-muted/70 rounded-lg transition text-sm font-semibold"
                  >
                    Twitter
                  </a>
                  <a
                    href={`https://t.me/share/url?url=${shareUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-3 bg-muted hover:bg-muted/70 rounded-lg transition text-sm font-semibold"
                  >
                    Telegram
                  </a>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/70 rounded-lg transition text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-border">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition font-semibold ${
                    isLiked
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      : "bg-muted hover:bg-muted/70 text-foreground"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                  {isLiked ? "Loved" : "Love This"}
                </button>
              </div>
            </div>

            {/* Wallet Connect */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                <h3 className="font-bold">See Your NFT</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect your wallet to see the onchain tribute you'll receive
              </p>
              <button className="w-full px-4 py-2 border-2 border-primary text-primary hover:bg-primary/5 font-semibold rounded-lg transition">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {event && (
        <>
          <ContributionModal
            isOpen={showContributionModal}
            onClose={() => setShowContributionModal(false)}
            eventTitle={event.title}
            onSuccess={handleContributionSuccess}
          />

          <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} eventTitle={event.title} />
        </>
      )}
    </main>
  )
}
