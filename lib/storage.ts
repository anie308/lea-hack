import { supabase } from './supabase';

const BUCKET_NAME = 'event-images';

/**
 * Upload an event image to Supabase Storage
 * @param file - The image file to upload
 * @param eventId - The event ID to associate with the image
 * @returns The public URL of the uploaded image
 */
export async function uploadEventImage(file: File, eventId: string): Promise<string> {
  try {
    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${eventId}/${Date.now()}.${fileExt}`;

    // Upload the file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadEventImage:', error);
    throw error;
  }
}

/**
 * Upload a profile avatar to Supabase Storage
 * @param file - The image file to upload
 * @param walletAddress - The wallet address to associate with the avatar
 * @returns The public URL of the uploaded image
 */
export async function uploadProfileAvatar(file: File, walletAddress: string): Promise<string> {
  try {
    // Create a unique filename using wallet address
    const fileExt = file.name.split('.').pop();
    const fileName = `profiles/${walletAddress.slice(2, 10)}/${Date.now()}.${fileExt}`;

    // Upload the file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Allow overwriting existing avatars
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadProfileAvatar:', error);
    throw error;
  }
}

/**
 * Check if the event-images bucket exists, create it if it doesn't
 * This should be called once during app initialization
 */
export async function ensureEventImagesBucket() {
  try {
    // Try to list buckets to check if it exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      // Note: Creating buckets requires admin privileges
      // You'll need to create the bucket manually in Supabase Dashboard
      // or use the service role key
      console.warn(`Bucket "${BUCKET_NAME}" does not exist. Please create it in Supabase Dashboard.`);
      console.warn('Go to: Storage > Create a new bucket > Name: event-images > Public: Yes');
    }
  } catch (error) {
    console.error('Error checking bucket:', error);
  }
}

