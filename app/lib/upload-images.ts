// ARENA - Image Upload Utility for Supabase Storage
'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const STORAGE_BUCKET = 'proposal-images'

/**
 * Upload multiple images to Supabase Storage
 * @param files - Array of image files to upload
 * @param proposalId - ID of the proposal (used for folder organization)
 * @returns Array of public URLs for uploaded images
 */
export async function uploadProposalImages(
  files: File[],
  proposalId: string
): Promise<string[]> {
  try {
    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET)

    if (!bucketExists) {
      // Create bucket if it doesn't exist (public bucket)
      await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      })
    }

    const uploadPromises = files.map(async (file, index) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${proposalId}/${Date.now()}-${index}.${fileExt}`

      // Convert File to ArrayBuffer for upload
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path)

      return publicUrl
    })

    const urls = await Promise.all(uploadPromises)
    return urls
  } catch (error) {
    console.error('Error uploading images:', error)
    throw new Error('Failed to upload images')
  }
}

/**
 * Delete images from Supabase Storage
 * @param imageUrls - Array of image URLs to delete
 */
export async function deleteProposalImages(imageUrls: string[]): Promise<void> {
  try {
    const filePaths = imageUrls.map(url => {
      // Extract file path from public URL
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split(`/${STORAGE_BUCKET}/`)
      return pathParts[1]
    })

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths)

    if (error) {
      console.error('Failed to delete images:', error)
      throw error
    }
  } catch (error) {
    console.error('Error deleting images:', error)
    // Don't throw - deletion failure shouldn't break the app
  }
}
