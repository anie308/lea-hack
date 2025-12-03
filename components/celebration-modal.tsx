"use client"

import { useEffect, useState } from "react"
import { CheckCircle } from "lucide-react"

interface CelebrationModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
}

export function CelebrationModal({ isOpen, onClose, title, message }: CelebrationModalProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number }>>([])

  useEffect(() => {
    if (isOpen) {
      // Play celebration audio (optional)
      const particles = Array.from({ length: 80 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
      }))
      setConfetti(particles)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* Confetti */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="fixed w-2 h-2 rounded-full pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: 0,
            background: `hsl(${Math.random() * 60 + 10}, 100%, 50%)`,
            animation: `fall 3s linear ${particle.delay}s forwards`,
          }}
        />
      ))}

      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-fade-in-scale relative z-10">
        <div className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative animate-celebrate">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-3xl animate-pulse-glow" />
              <CheckCircle className="w-24 h-24 text-primary relative drop-shadow-lg" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-balance">{title}</h2>
            <p className="text-lg text-muted-foreground">{message}</p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all duration-200 active:scale-95"
          >
            Celebrate
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
