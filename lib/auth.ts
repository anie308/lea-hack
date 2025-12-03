import { supabase } from './supabase';

/**
 * Sign in or sign up to Supabase using wallet address
 * Creates a user account if it doesn't exist, or signs in if it does
 */
export async function signInWithWallet(walletAddress: string) {
  try {
    // Normalize wallet address (remove 0x prefix if present)
    const normalizedAddress = walletAddress.toLowerCase().replace(/^0x/, '');
    // Encode wallet address to create a valid email format
    // Use base64 encoding and make it URL-safe for email compatibility
    const encodedAddress = btoa(normalizedAddress)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    // Use a deterministic email format that Supabase will accept
    // Prefix with 'w' to ensure it starts with a letter
    const email = `w${encodedAddress}@wallet.local`;
    // Create a stronger password from wallet address (meets requirements)
    const password = `wallet_${normalizedAddress}_auth`;
    
    // Try to sign in first (in case user already exists)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError && signInData.user) {
      return { user: signInData.user, error: null };
    }

    // If sign in fails, try to sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          wallet_address: normalizedAddress,
          display_name: `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`,
        },
        emailRedirectTo: undefined, // Don't require email confirmation
      },
    });

    // Check if signup was successful
    if (signUpData?.user) {
      // If user was created, try to sign in immediately
      const { data: autoSignIn, error: autoSignInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!autoSignInError && autoSignIn?.user) {
        return { user: autoSignIn.user, error: null };
      }
    }

    // If signup failed, check if it's because user already exists
    if (signUpError) {
      // User might already exist, try sign in one more time
      const { data: retrySignIn, error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!retryError && retrySignIn?.user) {
        return { user: retrySignIn.user, error: null };
      }

      // If still failing, return the original signup error
      return { user: null, error: signUpError };
    }

    // If we have a user from signup but couldn't auto-sign in, return the user anyway
    if (signUpData?.user) {
      return { user: signUpData.user, error: null };
    }

    return { user: null, error: new Error('Failed to create or sign in user') };
  } catch (error) {
    console.error('Error signing in with wallet:', error);
    return { user: null, error: error as Error };
  }
}

/**
 * Get or create a Supabase user from wallet address
 * This is a fallback approach that doesn't require password authentication
 * Uses browser Web Crypto API to generate deterministic UUID
 */
export async function getOrCreateUserFromWallet(walletAddress: string) {
  try {
    // Check if user already exists by wallet address
    const { data: existingUser } = await supabase.auth.getUser();
    
    if (existingUser?.user) {
      // Check if the user's metadata matches the wallet address
      if (existingUser.user.user_metadata?.wallet_address === walletAddress.toLowerCase()) {
        return { user: existingUser.user, error: null };
      }
    }

    // Create a deterministic UUID from wallet address for organizer_id
    // This allows us to use wallet_address as the primary identifier
    // while still having a UUID for organizer_id
    const normalizedAddress = walletAddress.toLowerCase();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalizedAddress);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
    
    // Format as UUID (8-4-4-4-12)
    const formattedId = `${hashHex.substring(0, 8)}-${hashHex.substring(8, 12)}-${hashHex.substring(12, 16)}-${hashHex.substring(16, 20)}-${hashHex.substring(20, 32)}`;
    
    return { 
      user: { id: formattedId } as any, 
      error: null,
      isWalletOnly: true 
    };
  } catch (error) {
    console.error('Error getting user from wallet:', error);
    return { user: null, error: error as Error };
  }
}

