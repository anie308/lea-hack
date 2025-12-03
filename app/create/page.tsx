"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Upload, Zap, AlertCircle } from "lucide-react"
import { useAuth, CampModal } from '@campnetwork/origin/react'
import { toast } from 'sonner'

export default function CreateEvent() {
  const { jwt, viem, origin } = useAuth()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetAmount: "",
    eventType: "Wedding",
    isPrivate: false,
    image: null as File | null,
  })
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)

  const eventTypes = ["Wedding", "Funeral", "Naming", "Thanksgiving"]

  // Get wallet address and token balance when connected
  useEffect(() => {
    const getWalletAddressAndBalance = async () => {
      if (viem && typeof window !== 'undefined' && jwt) {
        try {
          const accounts = await viem.request({ method: 'eth_accounts' })
          if (accounts && accounts.length > 0) {
            const address = accounts[0]
            setWalletAddress(address)
            
            // Fetch token balance (only if contract is configured)
            try {
              setIsCheckingBalance(true)
              const { getTokenBalance } = await import('@/lib/tokens')
              const balance = await getTokenBalance(address)
              setTokenBalance(balance)
            } catch (balanceError: any) {
              // Silently handle token balance errors - it's optional if contract isn't deployed
              if (balanceError?.message?.includes('not configured') || 
                  balanceError?.message?.includes('not available')) {
                setTokenBalance(null) // Contract not configured, hide token balance
              } else {
                console.warn('Error fetching token balance:', balanceError)
                setTokenBalance(null)
              }
            } finally {
              setIsCheckingBalance(false)
            }
          } else {
            setWalletAddress(null)
            setTokenBalance(null)
          }
        } catch (error) {
          console.error('Error getting wallet address:', error)
        }
      }
    }

    getWalletAddressAndBalance()
    
    // Listen for account changes
    if (viem && typeof window !== 'undefined') {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          const address = accounts[0]
          setWalletAddress(address)
          
          // Refresh token balance
          try {
            setIsCheckingBalance(true)
            const { getTokenBalance } = await import('@/lib/tokens')
            const balance = await getTokenBalance(address)
            setTokenBalance(balance)
          } catch (balanceError) {
            console.error('Error fetching token balance:', balanceError)
            setTokenBalance(null)
          } finally {
            setIsCheckingBalance(false)
          }
        } else {
          setWalletAddress(null)
          setTokenBalance(null)
        }
      }

      viem.on?.('accountsChanged', handleAccountsChanged)
      
      return () => {
        viem.removeListener?.('accountsChanged', handleAccountsChanged)
      }
    }
  }, [viem, jwt])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Check wallet connection
      if (!walletAddress || !jwt) {
        toast.error('Wallet Connection Required', {
          description: 'Please connect your wallet to create an event',
        });
        setIsSubmitting(false);
        return;
      }

      // Check token balance and charge 2 Basecamp tokens (if contract is configured)
      const { hasEnoughTokens, transferTokens, getTokenBalance } = await import('@/lib/tokens');
      const EVENT_CREATION_FEE = 2; // 2 Basecamp tokens
      let txHash: string | undefined; // Declare outside the if block

      // Only check tokens if contract is configured
      const tokenContractConfigured = process.env.NEXT_PUBLIC_BASECAMP_TOKEN_ADDRESS && 
                                      process.env.NEXT_PUBLIC_BASECAMP_TOKEN_ADDRESS !== '0x0000000000000000000000000000000000000000';

      if (tokenContractConfigured) {
        try {
          // Check if user has enough tokens
          const hasEnough = await hasEnoughTokens(walletAddress, EVENT_CREATION_FEE);
          if (!hasEnough) {
            const balance = await getTokenBalance(walletAddress);
            toast.error('Insufficient Tokens', {
              description: `You need ${EVENT_CREATION_FEE} Basecamp tokens to create an event. Your balance: ${balance.toFixed(2)} tokens.`,
            });
            setIsSubmitting(false);
            return;
          }

          // Transfer tokens to platform wallet
          toast.info('Processing Payment', {
            description: `Charging ${EVENT_CREATION_FEE} Basecamp tokens...`,
          });

          try {
            txHash = await transferTokens(walletAddress, EVENT_CREATION_FEE);
            toast.success('Payment Successful', {
              description: `Transaction confirmed: ${txHash.slice(0, 10)}...`,
            });
          } catch (transferError: any) {
            console.error('Token transfer failed:', transferError);
            toast.error('Payment Failed', {
              description: transferError?.message || 'Failed to process token payment. Please try again.',
            });
            setIsSubmitting(false);
            return;
          }
        } catch (tokenError: any) {
          // If token contract is not available, allow event creation without token payment
          console.warn('Token payment skipped:', tokenError?.message);
          toast.warning('Token Payment Skipped', {
            description: 'Event will be created without token payment. Token contract not available.',
          });
        }
      } else {
        // Contract not configured - skip token payment
        console.log('Token contract not configured, skipping token payment');
      }

      // Import supabase and cloudinary utilities
      const { supabase } = await import('@/lib/supabase');
      const { uploadEventImage } = await import('@/lib/cloudinary');

      // Generate organizer_id from wallet address
      // We use wallet_address as the primary identifier, so we don't need Supabase auth
      const { getOrCreateUserFromWallet } = await import('@/lib/auth');
      const userResult = await getOrCreateUserFromWallet(walletAddress);
      
      if (!userResult.user) {
        console.error('Error getting user from wallet:', userResult.error);
        toast.error('Authentication Failed', {
          description: 'Failed to authenticate. Please try again.',
        });
        setIsSubmitting(false);
        return;
      }
      
      const user = userResult.user;

      // Upload image first to Cloudinary
      let imageUrl: string | null = null;
      if (formData.image) {
        try {
          toast.info('Uploading Image', {
            description: 'Uploading your event image to Cloudinary...',
          });
          imageUrl = await uploadEventImage(formData.image);
          toast.success('Image Uploaded', {
            description: 'Image uploaded successfully!',
          });
        } catch (uploadError: any) {
          console.error('Error uploading image:', uploadError);
          toast.error('Image Upload Failed', {
            description: uploadError?.message || 'Failed to upload image. Please try again.',
          });
          setIsSubmitting(false);
          return; // Don't create event if image upload fails
        }
      }

      // Create event with image URL
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          title: formData.title,
          description: formData.description,
          target_cents: Number(formData.targetAmount) * 100,
          event_type: formData.eventType,
          organizer_id: user.id,
          wallet_address: walletAddress,
          is_private: formData.isPrivate,
          image_url: imageUrl, // Include image URL in initial creation
          raised_cents: 0
        })
        .select()
        .single();

      if (eventError) {
        console.error('Error creating event:', eventError);
        toast.error('Event Creation Failed', {
          description: 'Failed to create event. Please try again.',
        });
        setIsSubmitting(false);
        return;
      }

      // Record the payment in database (if token payment was made)
      if (tokenContractConfigured && txHash) {
        try {
          await supabase
            .from('event_creation_payments')
            .insert({
              event_id: event.id,
              wallet_address: walletAddress,
              amount_tokens: EVENT_CREATION_FEE,
              transaction_hash: txHash,
            });
        } catch (paymentError) {
          console.error('Error recording payment:', paymentError);
          // Payment was successful on-chain, so we continue even if DB record fails
        }
      }

      // Origin SDK: Pre-register IP template (gasless)
      // Note: IP template creation may require different API - skipping for now
      // You can implement this later when the exact API is confirmed
      if (origin) {
        try {
          // Try to use the origin instance - method may vary
          // For now, we'll skip IP template creation and focus on event creation
          console.log('Origin SDK available, but IP template creation skipped');
          // const ipTemplate = await origin.createIPTemplate({...});

          // IP template creation can be added later
          // For now, event is created successfully
          toast.success('Event Created Successfully!', {
            description: `Your event is live! Share it with your community.`,
            action: {
              label: 'View Event',
              onClick: () => window.location.href = `/event/${event.id}`
            },
            duration: 5000,
          });
        } catch (originError) {
          console.error('Origin IP creation failed:', originError);
          // Event is still created, just without IP template
          toast.success('Event Created!', {
            description: 'IP template creation pending. Your event is live!',
            duration: 5000,
          });
        }
      } else {
        // Event is still created, just without IP template
        toast.success('Event Created!', {
          description: 'IP template creation pending. Your event is live!',
          duration: 5000,
        });
      }

      // Redirect to event page after a short delay
      setTimeout(() => {
        window.location.href = `/event/${event.id}`;
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something Went Wrong', {
        description: 'An error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isFormValid = formData.title.trim() && formData.description.trim() && formData.targetAmount && imagePreview

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all mb-6 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Create Your Event</h1>
          <p className="text-muted-foreground">Share your celebration and invite people to contribute</p>
        </div>

        {/* Wallet Connection Alert */}
        {!walletAddress && (
          <div className="mb-6 p-4 bg-amber-500/10 border-2 border-amber-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
                Wallet Connection Required
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Connect your wallet to create events and manage your intellectual property on-chain.
              </p>
              <CampModal />
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Wallet Status */}
          {walletAddress && (
            <div className="p-4 bg-green-500/10 border-2 border-green-500/20 rounded-lg space-y-2">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                ✓ Wallet Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
              {isCheckingBalance ? (
                <p className="text-xs text-muted-foreground">Checking token balance...</p>
              ) : tokenBalance !== null ? (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Basecamp Token Balance:</p>
                  <p className={`text-sm font-semibold ${tokenBalance >= 2 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {tokenBalance.toFixed(2)} tokens
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Event Creation Fee Notice */}
          {walletAddress && (
            <div className="p-4 bg-primary/10 border-2 border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-primary mb-1">Event Creation Fee</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Creating an event costs <span className="font-semibold text-foreground">2 Basecamp tokens</span>
                  </p>
                  {tokenBalance !== null && tokenBalance < 2 && (
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                      ⚠️ Insufficient balance. You need {(2 - tokenBalance).toFixed(2)} more tokens.
                    </p>
                  )}
                  {tokenBalance !== null && tokenBalance >= 2 && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ You have enough tokens to create an event
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Event Type */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold">Event Type</label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-lg border-2 border-border bg-card text-foreground focus:outline-none focus:border-primary transition"
            >
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <label htmlFor="title" className="block text-sm font-semibold">
              Event Title
            </label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Ade & Zainab's Wedding"
              className="w-full px-4 py-3 rounded-lg border-2 border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label htmlFor="description" className="block text-sm font-semibold">
              Tell Your Story
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Share why this celebration matters to you and your community. What makes this event special?"
              rows={6}
              className="w-full px-4 py-3 rounded-lg border-2 border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition resize-none"
            />
          </div>

          {/* Target Amount */}
          <div className="space-y-3">
            <label htmlFor="targetAmount" className="block text-sm font-semibold">
              Funding Target (NGN)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-lg font-semibold text-primary">₦</span>
              <input
                id="targetAmount"
                type="number"
                name="targetAmount"
                value={formData.targetAmount}
                onChange={handleInputChange}
                placeholder="500000"
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Common amounts: ₦250,000 | ₦500,000 | ₦1,000,000 | ₦2,500,000
            </p>
          </div>

          {/* Privacy Setting */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold">Event Visibility</label>
            <select
              name="isPrivate"
              value={formData.isPrivate ? "private" : "public"}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.value === "private" }))}
              className="w-full px-4 py-3 rounded-lg border-2 border-border bg-card text-foreground focus:outline-none focus:border-primary transition"
            >
              <option value="public">Public - Visible on home page and browse</option>
              <option value="private">Private - Only accessible via direct link</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Private events won't appear in public listings but can still be shared via link
            </p>
          </div>

          {/* Cover Photo */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold">Cover Photo</label>

            {!imagePreview ? (
              <label className="flex items-center justify-center gap-3 w-full px-4 py-8 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-muted/30 transition cursor-pointer">
                <Upload className="w-5 h-5 text-primary" />
                <div className="text-center">
                  <p className="font-semibold">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
                </div>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-border">
                  <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <label className="inline-block">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-semibold border-2 border-border hover:border-primary text-primary rounded-lg transition"
                  >
                    Change Photo
                  </button>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting || !walletAddress}
            className="w-full py-4 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            {isSubmitting ? "Creating Event..." : "Create Event"}
          </button>

          {!isFormValid && (
            <p className="text-sm text-muted-foreground text-center">Fill in all fields to create your event</p>
          )}
        </form>

        {/* Help Text */}
        <div className="mt-12 p-6 bg-muted/30 rounded-lg border border-border">
          <h3 className="font-semibold mb-3">Quick Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Use a clear, compelling title that describes your event</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Share the story behind your celebration to inspire contributions</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Set a realistic funding target based on your needs</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Upload a high-quality photo that captures the essence of your event</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
