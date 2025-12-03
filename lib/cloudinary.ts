/**
 * Cloudinary image upload utilities
 * Uploads images to Cloudinary and returns public URLs
 */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

/**
 * Upload an image to Cloudinary
 * @param file - The image file to upload
 * @param folder - Optional folder path in Cloudinary (e.g., 'events', 'profiles')
 * @returns The public URL of the uploaded image
 */
export async function uploadToCloudinary(file: File, folder: string = 'events'): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
  }

  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    
    // Note: Image transformations can be configured in your Cloudinary upload preset
    // or added here as transformation parameters if needed

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Upload failed' } }));
      throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    
    if (!data.secure_url) {
      throw new Error('No URL returned from Cloudinary');
    }

    return data.secure_url;
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

