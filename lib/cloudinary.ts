/**
 * Cloudinary image upload utilities
 * Uploads images to Cloudinary via server-side API route (more secure)
 */

/**
 * Upload an image to Cloudinary via server-side API
 * @param file - The image file to upload
 * @param folder - Optional folder path in Cloudinary (e.g., 'events', 'profiles')
 * @returns The public URL of the uploaded image
 */
export async function uploadToCloudinary(file: File, folder: string = 'events'): Promise<string> {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    // Upload via server-side API route (more secure - uses API key/secret)
    const response = await fetch('/api/cloudinary/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || 'Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    
    if (!data.url) {
      throw new Error('No URL returned from Cloudinary');
    }

    return data.url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

/**
 * Upload an event image to Cloudinary
 * @param file - The image file to upload
 * @param eventId - Optional event ID for folder organization
 * @returns The public URL of the uploaded image
 */
export async function uploadEventImage(file: File, eventId?: string): Promise<string> {
  const folder = eventId ? `events/${eventId}` : 'events';
  return uploadToCloudinary(file, folder);
}

/**
 * Upload a profile avatar to Cloudinary
 * @param file - The image file to upload
 * @param walletAddress - Wallet address for folder organization
 * @returns The public URL of the uploaded image
 */
export async function uploadProfileAvatar(file: File, walletAddress: string): Promise<string> {
  const folder = `profiles/${walletAddress.slice(2, 10)}`;
  return uploadToCloudinary(file, folder);
}

