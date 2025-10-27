import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  url: string
  resource_type: string
  format: string
  bytes: number
  width?: number
  height?: number
}

// Upload buffer to Cloudinary
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder?: string
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    // Convert buffer to stream
    const stream = new Readable()
    stream.push(buffer)
    stream.push(null)

    // Determine resource type based on file extension
    const isPdf = filename.toLowerCase().endsWith('.pdf')
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename)
    
    // Extract file extension to preserve it
    const fileExtension = filename.split('.').pop()?.toLowerCase() || ''
    
    const uploadOptions: any = {
      resource_type: isPdf ? 'raw' : (isImage ? 'image' : 'auto'),
      folder: folder || 'documents',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      tags: ['document-management'],
    }
    
    // Only set format for images to preserve quality, not for raw files
    if (isImage && fileExtension) {
      uploadOptions.format = fileExtension
    }

    console.log(`[Cloudinary] Uploading ${filename} as resource_type: ${uploadOptions.resource_type}`)

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload error:', error)
          reject(error)
        } else if (result) {
          console.log('[Cloudinary] Upload success:')
          console.log('  - public_id:', result.public_id)
          console.log('  - secure_url:', result.secure_url)
          console.log('  - resource_type:', result.resource_type)
          console.log('  - format:', result.format)
          resolve(result as CloudinaryUploadResult)
        }
      }
    )

    stream.pipe(uploadStream)
  })
}

// Delete file from Cloudinary
export async function deleteFromCloudinary(public_id: string, resource_type: string = 'raw'): Promise<void> {
  return new Promise((resolve, reject) => {
    // Use public_id as-is from database (already without extension for raw files)
    cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type
    }, (error, result) => {
      if (error) {
        console.error('[Cloudinary] Delete error:', error)
        reject(error)
      } else {
        console.log('[Cloudinary] Delete success:', public_id)
        resolve()
      }
    })
  })
}

// Get file URL from Cloudinary (for viewing)
export function getCloudinaryUrl(public_id: string, format?: string, resource_type: string = 'raw'): string {
  const options: any = {
    secure: true,
    resource_type: resource_type,
    sign_url: true, // Generate signed URL
    type: 'upload',
  }
  
  // Only add format if it's a valid format (not 'unknown' or undefined)
  if (format && format !== 'unknown') {
    options.format = format
  }
  
  const url = cloudinary.url(public_id, options)
  console.log('[Cloudinary] Generated view URL:', url)
  console.log('  - Input public_id:', public_id)
  console.log('  - Resource type:', resource_type)
  return url
}

// Get download URL that preserves original format and forces download
export function getDownloadUrl(public_id: string, filename: string, resource_type: string = 'raw'): string {
  // Extract file extension from filename
  const fileExtension = filename.split('.').pop()?.toLowerCase()
  
  // For raw files, append extension to public_id if not already present
  let fullPublicId = public_id
  if (resource_type === 'raw' && fileExtension && !public_id.endsWith(`.${fileExtension}`)) {
    fullPublicId = `${public_id}.${fileExtension}`
  }
  
  // For raw files, just use the same URL as view URL
  // The browser will handle download based on Content-Disposition header from Cloudinary
  const url = cloudinary.url(fullPublicId, {
    secure: true,
    resource_type: resource_type,
    sign_url: true,
    type: 'upload',
  })
  
  console.log('[Cloudinary] Generated download URL:', url)
  console.log('  - Input public_id:', public_id)
  console.log('  - Full public_id:', fullPublicId)
  return url
}

