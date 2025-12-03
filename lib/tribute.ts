/**
 * Helper functions for generating AI tributes using Replicate API
 */

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

export interface TributeMetadata {
  ipfsUri: string;
  description: string;
  mediaType: 'image' | 'audio' | 'video';
  tributeData: {
    eventTitle: string;
    contributionAmount: number;
    generatedAt: string;
  };
}

/**
 * Generate an AI tribute (image, song, or video) for a contribution
 * @param eventTitle - The title of the event
 * @param amountCents - The contribution amount in cents
 * @returns Tribute metadata including IPFS URI
 */
export async function generateTribute(
  eventTitle: string,
  amountCents: number
): Promise<TributeMetadata> {
  try {
    // Determine tribute type based on contribution amount
    const tributeType = getTributeType(amountCents);

    let generatedContent: string;

    switch (tributeType) {
      case 'image':
        generatedContent = await generateImage(eventTitle, amountCents);
        break;
      case 'audio':
        generatedContent = await generateSong(eventTitle, amountCents);
        break;
      case 'video':
        generatedContent = await generateVideo(eventTitle, amountCents);
        break;
      default:
        generatedContent = await generateImage(eventTitle, amountCents);
    }

    // Upload to IPFS
    const ipfsUri = await uploadToIPFS(generatedContent, tributeType);

    return {
      ipfsUri,
      description: `Thank you for contributing ₦${amountCents / 100} to ${eventTitle}!`,
      mediaType: tributeType,
      tributeData: {
        eventTitle,
        contributionAmount: amountCents,
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error generating tribute:', error);
    // Return a mock tribute as fallback
    return {
      ipfsUri: `ipfs://Qm${Math.random().toString(36).substring(7)}`,
      description: `Thank you for contributing ₦${amountCents / 100} to ${eventTitle}!`,
      mediaType: 'image',
      tributeData: {
        eventTitle,
        contributionAmount: amountCents,
        generatedAt: new Date().toISOString()
      }
    };
  }
}

function getTributeType(amountCents: number): 'image' | 'audio' | 'video' {
  // Tier tributes based on contribution amount
  if (amountCents >= 10000000) { // 100,000 NGN+
    return 'video';
  } else if (amountCents >= 5000000) { // 50,000 NGN+
    return 'audio';
  } else {
    return 'image';
  }
}

async function generateImage(eventTitle: string, amountCents: number): Promise<string> {
  if (!REPLICATE_API_TOKEN) {
    console.warn('Replicate API token not found. Using mock data.');
    return 'mock-image-url';
  }

  try {
    const prompt = `Beautiful celebratory artwork for "${eventTitle}", African cultural motifs, vibrant colors, joyful celebration, contribution of ₦${amountCents / 100}`;

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'stability-ai/sdxl', // Or another model
        input: { prompt }
      })
    });

    const data = await response.json();
    return data.output?.[0] || 'mock-image-url';
  } catch (error) {
    console.error('Image generation failed:', error);
    return 'mock-image-url';
  }
}

async function generateSong(eventTitle: string, amountCents: number): Promise<string> {
  if (!REPLICATE_API_TOKEN) {
    console.warn('Replicate API token not found. Using mock data.');
    return 'mock-audio-url';
  }

  try {
    const prompt = `Celebratory music for ${eventTitle}, joyful, African rhythms, festive`;

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'meta/musicgen', // Or another music generation model
        input: { prompt }
      })
    });

    const data = await response.json();
    return data.output || 'mock-audio-url';
  } catch (error) {
    console.error('Song generation failed:', error);
    return 'mock-audio-url';
  }
}

async function generateVideo(eventTitle: string, amountCents: number): Promise<string> {
  if (!REPLICATE_API_TOKEN) {
    console.warn('Replicate API token not found. Using mock data.');
    return 'mock-video-url';
  }

  try {
    const prompt = `Celebration video for ${eventTitle}, African celebration, vibrant and joyful`;

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'deforum/deforum_stable_diffusion', // Or another video model
        input: { prompt }
      })
    });

    const data = await response.json();
    return data.output || 'mock-video-url';
  } catch (error) {
    console.error('Video generation failed:', error);
    return 'mock-video-url';
  }
}

async function uploadToIPFS(contentUrl: string, mediaType: string): Promise<string> {
  try {
    // This is a placeholder for IPFS upload
    // In production, you would:
    // 1. Download the generated content from contentUrl
    // 2. Upload to IPFS via nft.storage, Pinata, or web3.storage
    // 3. Return the IPFS URI

    // For now, return a mock IPFS URI
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
    return `ipfs://${mockHash}`;
  } catch (error) {
    console.error('IPFS upload failed:', error);
    return `ipfs://Qm${Math.random().toString(36).substring(7)}`;
  }
}
