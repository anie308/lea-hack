"use client"

import { useState } from "react"
import { X, Heart } from "lucide-react"
import { toast } from 'sonner'

interface ContributionModalProps {
  isOpen: boolean
  onClose: () => void
  eventTitle: string
  onSuccess: () => void
}

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000]

export function ContributionModal({ isOpen, onClose, eventTitle, onSuccess }: ContributionModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [email, setEmail] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const finalAmount = customAmount ? Number.parseInt(customAmount) : selectedAmount

  const handleContribute = async () => {
    if (!finalAmount) {
      toast.info('Select Amount', {
        description: 'Please select or enter a contribution amount',
      });
      return;
    }

    if (!email || !email.includes('@')) {
      toast.error('Email Required', {
        description: 'Please enter a valid email address for payment',
      });
      return;
    }

    setIsProcessing(true)

    try {

      // Initialize Paystack payment
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalAmount * 100, // Convert to kobo (cents)
          email: email,
          metadata: {
            eventId: window.location.pathname.split('/').pop(), // Extract event ID from URL
            eventTitle: eventTitle,
            amountCents: finalAmount * 100
          }
        })
      });

      const data = await response.json();

      if (data.authorization_url) {
        toast.success('Redirecting to Payment', {
          description: 'You will be redirected to Paystack to complete your payment',
        });
        // Redirect to Paystack payment page
        setTimeout(() => {
          window.location.href = data.authorization_url;
        }, 1000);
      } else if (data.error) {
        toast.error('Payment Initialization Failed', {
          description: data.error || 'Failed to initialize payment. Please try again.',
        });
        setIsProcessing(false);
      } else {
        // For development/testing, simulate success
        toast.info('Processing Payment', {
          description: 'Simulating payment processing...',
        });
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsProcessing(false);
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment Failed', {
        description: 'An error occurred. Please try again.',
      });
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-secondary" />
            Contribute to this Event
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Event Title */}
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-1">Supporting</p>
            <p className="font-semibold line-clamp-2">{eventTitle}</p>
          </div>

          {/* Preset Amounts */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Quick Amounts</label>
            <div className="grid grid-cols-2 gap-3">
              {PRESET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount)
                    setCustomAmount("")
                  }}
                  className={`px-4 py-3 rounded-lg font-semibold transition ${
                    selectedAmount === amount && !customAmount
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/70 text-foreground"
                  }`}
                >
                  ₦{amount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-3">
            <label htmlFor="customAmount" className="text-sm font-semibold">
              Custom Amount (NGN)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-lg font-semibold text-primary">₦</span>
              <input
                id="customAmount"
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value)
                  setSelectedAmount(null)
                }}
                placeholder="Enter any amount"
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-border bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-3">
            <label htmlFor="email" className="text-sm font-semibold">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 rounded-lg border-2 border-border bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
              required
            />
            <p className="text-xs text-muted-foreground">
              We'll send your payment receipt to this email
            </p>
          </div>

          {/* Summary */}
          {finalAmount && (
            <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">You will contribute</p>
              <p className="text-3xl font-bold text-primary">₦{finalAmount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                Plus you'll receive an exclusive onchain thank-you tribute NFT
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleContribute}
            disabled={!finalAmount || isProcessing}
            className="w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-bold rounded-lg transition-all"
          >
            {isProcessing ? "Processing with Paystack..." : "Proceed to Payment"}
          </button>

          <p className="text-xs text-muted-foreground text-center">Your payment is secure with Paystack</p>
        </div>
      </div>
    </div>
  )
}
