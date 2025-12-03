"use client"

import { useAuth, CampModal } from '@campnetwork/origin/react';
import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';

export function WalletConnect() {
  const { jwt, viem } = useAuth();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Get wallet address from viem provider
    const getAddress = async () => {
      if (viem && typeof window !== 'undefined') {
        try {
          const accounts = await viem.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
          } else {
            setWalletAddress(null);
          }
        } catch (error) {
          console.error('Error getting wallet address:', error);
          setWalletAddress(null);
        }
      }
    };

    getAddress();

    // Listen for account changes
    if (viem && typeof window !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      };

      viem.on?.('accountsChanged', handleAccountsChanged);

      return () => {
        viem.removeListener?.('accountsChanged', handleAccountsChanged);
      };
    }
  }, [viem, jwt]);

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // CampModal is in the layout, so we just show the connection status
  if (!jwt || !walletAddress) {
    return (
      <CampModal />
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm font-medium">{formatAddress(walletAddress)}</span>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="p-2 rounded-lg hover:bg-muted transition"
        title="Disconnect wallet"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
