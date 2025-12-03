"use client"
import { ExternalLink } from "lucide-react"

interface NFTItem {
  id: string
  eventTitle: string
  amount: number
  date: string
  contractAddress: string
}

interface NFTGalleryProps {
  nfts?: NFTItem[]
  isConnected?: boolean
}

export function NFTGallery({ nfts = [], isConnected = false }: NFTGalleryProps) {
  const mockNFTs: NFTItem[] = [
    {
      id: "1",
      eventTitle: "Ade & Zainab's Wedding",
      amount: 50000,
      date: "2025-01-15",
      contractAddress: "0x1234...5678",
    },
    {
      id: "2",
      eventTitle: "Chief Okonkwo Memorial",
      amount: 25000,
      date: "2025-01-10",
      contractAddress: "0x1234...5678",
    },
  ]

  const displayNFTs = nfts.length > 0 ? nfts : mockNFTs

  if (!isConnected) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
        <p className="text-muted-foreground mb-4">Connect your wallet to view your NFT tributes</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Your LifeEvents Tributes</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {displayNFTs.map((nft) => (
          <div
            key={nft.id}
            className="bg-card border-2 border-border rounded-xl p-6 space-y-4 hover:border-primary transition"
          >
            <div className="w-full aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🎁</div>
                <p className="text-xs text-muted-foreground">NFT Tribute</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold line-clamp-2">{nft.eventTitle}</p>
              <p className="text-sm text-muted-foreground">Contributed ₦{nft.amount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{new Date(nft.date).toLocaleDateString()}</p>
            </div>
            <a
              href={`https://explorer.vercel.app/token/${nft.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary text-sm font-semibold hover:gap-3 transition"
            >
              View on Chain
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
