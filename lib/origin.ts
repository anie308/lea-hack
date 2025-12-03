import { Auth } from '@campnetwork/origin';
import { createWalletClient, custom } from 'viem';
import { campTestnet } from './chains';

let auth: Auth | null = null;

export async function getOriginAuth() {
  if (!auth) {
    if (typeof window === 'undefined') {
      throw new Error('Origin Auth can only be initialized in the browser');
    }

    if (!window.ethereum) {
      throw new Error('No Ethereum wallet found. Please install MetaMask or another Web3 wallet.');
    }

    const clientId = process.env.NEXT_PUBLIC_ORIGIN_CLIENT_ID;
    if (!clientId) {
      throw new Error('NEXT_PUBLIC_ORIGIN_CLIENT_ID is required. Please set it in your .env file.');
    }

    const walletClient = createWalletClient({
      chain: campTestnet,
      transport: custom(window.ethereum)
    });

    auth = new Auth({ 
      walletClient,
      clientId 
    });
    await auth.authenticate();
  }

  return auth;
}

export async function registerIP(metadata: {
  metadataURI: string;
  royalties?: number;
  attributes?: Array<{ trait_type: string; value: string }>;
}) {
  const auth = await getOriginAuth();

  return await auth.origin.registerIP({
    metadataURI: metadata.metadataURI,
    royalties: metadata.royalties || 5,
    attributes: metadata.attributes || []
  });
}

export async function mintFractional(params: {
  to: string;
  tokenId: string;
  amount: number;
  eventId: string;
}) {
  const auth = await getOriginAuth();

  return await auth.origin.mintFractional({
    to: params.to,
    tokenId: params.tokenId,
    amount: params.amount,
    eventId: params.eventId
  });
}

export async function createIPTemplate(metadata: {
  name: string;
  description: string;
  royalties?: number;
}) {
  const auth = await getOriginAuth();

  return await auth.origin.createIPTemplate({
    metadata: {
      name: metadata.name,
      description: metadata.description
    },
    royalties: metadata.royalties || 10
  });
}
