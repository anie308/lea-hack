"use client"

import { useState } from "react"
import { Heart, Loader } from "lucide-react"

interface PaystackButtonProps {
  amount: number
  email?: string
  eventTitle: string
  onSuccess?: (reference: string) => void
  onClose?: () => void
}

export function PaystackButton({
  amount,
  email = "contributor@example.com",
  eventTitle,
  onSuccess,
  onClose,
}: PaystackButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      // In a real app, this would initialize Paystack payment
      // For now, we'll simulate the payment flow
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount * 100, // Paystack uses kobo
          email,
          metadata: {
            eventTitle,
            custom_fields: [
              {
                display_name: "Event",
                variable_name: "event",
                value: eventTitle,
              },
            ],
          },
        }),
      })

      const data = await response.json()

      if (data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url
      }
    } catch (error) {
      console.error("Payment error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading || amount <= 0}
      className="w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-bold rounded-lg transition-all flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <Loader className="w-5 h-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Heart className="w-5 h-5" />
          Pay ₦{amount.toLocaleString()} with Paystack
        </>
      )}
    </button>
  )
}
