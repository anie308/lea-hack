"use client"

import { useState, useEffect } from "react"
import { CheckCircle, X } from "lucide-react"

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  eventTitle: string
}

export function SuccessModal({ isOpen, onClose, eventTitle }: SuccessModalProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number }>>([])

  useEffect(() => {
    if (isOpen) {
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.3,
      }))
      setConfetti(particles)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Confetti */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="fixed w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{
            left: `${particle.x}%`,
            top: 0,
            animation: `fall 3s linear ${particle.delay}s infinite`,
          }}
        />
      ))}

      <div className="bg-card rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95 relative z-10">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-muted rounded transition">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl" />
              <CheckCircle className="w-20 h-20 text-primary relative" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Well Done!</h2>
            <p className="text-muted-foreground">Your contribution has been received</p>
          </div>

          <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Supporting</p>
            <p className="font-semibold">{eventTitle}</p>
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">Minting your onchain tribute NFT...</p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-secondary h-full rounded-full animate-pulse" />
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all"
          >
            Back to Event
          </button>

          <p className="text-xs text-muted-foreground">You'll receive your NFT in your connected wallet shortly</p>
        </div>
      </div>

      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
