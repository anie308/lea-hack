"use client"

import { useState } from "react"
import { X, Trophy } from "lucide-react"

interface TargetReachedBannerProps {
  eventTitle: string
  amountRaised: number
  onDismiss?: () => void
}

export function TargetReachedBanner({ eventTitle, amountRaised, onDismiss }: TargetReachedBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 max-w-sm mx-4 z-40 animate-slide-up">
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl p-6 shadow-2xl border-2 border-primary/50">
        <div className="flex items-start gap-4">
          <Trophy className="w-6 h-6 flex-shrink-0 mt-1 animate-bounce-gentle" />
          <div className="flex-grow">
            <h3 className="font-bold text-lg mb-1">Target Don Complete!</h3>
            <p className="text-sm opacity-90 mb-2">
              {eventTitle} raised ₦{amountRaised.toLocaleString()}
            </p>
            <p className="text-xs opacity-75">Money Don Land! Your celebration can proceed</p>
          </div>
          <button onClick={handleDismiss} className="text-primary-foreground hover:opacity-75 transition flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
