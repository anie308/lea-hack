"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { WalletConnect } from "./wallet-connect"

export function Navbar() {
  const [theme, setTheme] = useState<string | null>(null)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")
  }, [])

  const toggleTheme = () => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark")
      if (isDark) {
        document.documentElement.classList.remove("dark")
        setTheme("light")
      } else {
        document.documentElement.classList.add("dark")
        setTheme("dark")
      }
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl">⛺</div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-primary">LifeEvents</span>
              <span className="text-xs text-muted-foreground">Africa</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium hover:text-primary transition">
              Home
            </Link>
            <Link href="/browse" className="text-sm font-medium hover:text-primary transition">
              Browse Events
            </Link>
            <Link href="/create" className="text-sm font-medium hover:text-primary transition">
              Create Event
            </Link>
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition">
              Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <WalletConnect />
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-primary" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
