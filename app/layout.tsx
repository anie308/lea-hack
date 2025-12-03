'use client';

import type React from "react"
import { useState } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { CampProvider, CampModal } from '@campnetwork/origin/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [queryClient] = useState(() => new QueryClient());
  // const clientID = process

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased adire-pattern`}>
        <QueryClientProvider client={queryClient}>
          <CampProvider clientId={process.env.NEXT_PUBLIC_ORIGIN_CLIENT_ID ?? ''}>
            {/* <CampModal /> */}
            <Navbar />
            {children}
            <Analytics />
            <Toaster position="top-right" richColors closeButton />
          </CampProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
