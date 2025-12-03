import { defineChain } from 'viem';

/**
 * Camp Network Testnet chain definition
 * RPC URL: https://testnet-rpc.campnetwork.xyz
 * 
 * Note: Chain ID may need to be updated based on Camp Network's actual testnet configuration.
 * You can set NEXT_PUBLIC_CAMP_CHAIN_ID in your .env file if different.
 */
export const campTestnet = defineChain({
  id: process.env.NEXT_PUBLIC_CAMP_CHAIN_ID 
    ? parseInt(process.env.NEXT_PUBLIC_CAMP_CHAIN_ID, 10) 
    : 123456, // Default placeholder - update with actual chain ID
  name: 'Camp Network Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CAMP',
    symbol: 'CAMP',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_CAMP_RPC_URL || 'https://testnet-rpc.campnetwork.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Camp Explorer',
      url: 'https://testnet-explorer.campnetwork.xyz',
    },
  },
  testnet: true,
});

