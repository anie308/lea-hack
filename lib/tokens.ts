import { createPublicClient, createWalletClient, custom, formatUnits, parseUnits } from 'viem';
import { campTestnet } from './chains';

// Basecamp Token contract address
// Default to the known contract address, but allow override via environment variable
const BASECAMP_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_BASECAMP_TOKEN_ADDRESS || '0x84eaac1b2dc3f84d92ff84c3ec205b1fa74671fc';
// Platform wallet address to receive fees (must be set in environment variables)
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET || '0x0000000000000000000000000000000000000000';

// ERC20 ABI for balance and transfer
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
] as const;

/**
 * Get user's Basecamp token balance
 */
export async function getTokenBalance(walletAddress: string): Promise<number> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Wallet not available');
  }

  // Validate contract address
  if (!BASECAMP_TOKEN_ADDRESS || BASECAMP_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
    console.warn('Basecamp token contract address not configured');
    return 0; // Return 0 if contract not configured
  }

  const publicClient = createPublicClient({
    chain: campTestnet,
    transport: custom(window.ethereum),
  });

  try {
    const balance = await publicClient.readContract({
      address: BASECAMP_TOKEN_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    });

    const decimals = await publicClient.readContract({
      address: BASECAMP_TOKEN_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'decimals',
    });

    return parseFloat(formatUnits(balance as bigint, Number(decimals)));
  } catch (error: any) {
    // If contract doesn't exist or function fails, return 0 instead of throwing
    if (error?.message?.includes('returned no data') || 
        error?.message?.includes('not a contract') ||
        error?.message?.includes('does not have the function')) {
      console.warn('Token contract not available or not deployed:', error.message);
      return 0;
    }
    console.error('Error getting token balance:', error);
    throw error;
  }
}

/**
 * Transfer Basecamp tokens from user to platform wallet
 * @param walletAddress - User's wallet address
 * @param amount - Amount of tokens to transfer (in tokens, not wei)
 */
export async function transferTokens(walletAddress: string, amount: number): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Wallet not available');
  }

  // Validate contract address
  if (!BASECAMP_TOKEN_ADDRESS || BASECAMP_TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
    throw new Error('Basecamp token contract address not configured. Please set NEXT_PUBLIC_BASECAMP_TOKEN_ADDRESS');
  }

  // Validate platform wallet
  if (!PLATFORM_WALLET || PLATFORM_WALLET === '0x0000000000000000000000000000000000000000') {
    throw new Error('Platform wallet address not configured. Please set NEXT_PUBLIC_PLATFORM_WALLET');
  }

  // Get the current account from the wallet
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('No wallet account found');
  }

  const account = accounts[0] as `0x${string}`;
  
  // Verify the account matches the provided wallet address
  if (account.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error('Wallet address mismatch');
  }

  const walletClient = createWalletClient({
    chain: campTestnet,
    transport: custom(window.ethereum),
    account,
  });

  const publicClient = createPublicClient({
    chain: campTestnet,
    transport: custom(window.ethereum),
  });

  try {
    // Get token decimals
    const decimals = await publicClient.readContract({
      address: BASECAMP_TOKEN_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'decimals',
    });

    // Convert amount to token units
    const amountInWei = parseUnits(amount.toString(), Number(decimals));

    // Execute transfer
    const hash = await walletClient.writeContract({
      address: BASECAMP_TOKEN_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [PLATFORM_WALLET as `0x${string}`, amountInWei],
    });

    // Wait for transaction confirmation
    await publicClient.waitForTransactionReceipt({ hash });

    return hash;
  } catch (error) {
    console.error('Error transferring tokens:', error);
    throw error;
  }
}

/**
 * Check if user has enough tokens to create an event
 */
export async function hasEnoughTokens(walletAddress: string, requiredAmount: number = 2): Promise<boolean> {
  try {
    const balance = await getTokenBalance(walletAddress);
    return balance >= requiredAmount;
  } catch (error) {
    console.error('Error checking token balance:', error);
    return false;
  }
}

