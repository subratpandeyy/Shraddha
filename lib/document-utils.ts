// Utility to check if a Cloudinary URL is valid
export function isCloudinaryUrlValid(url: string | undefined): boolean {
  if (!url) return false
  
  // Basic validation - Cloudinary URLs should contain specific patterns
  const cloudinaryPattern = /res\.cloudinary\.com\/([^/]+)\//
  return cloudinaryPattern.test(url)
}

// Check if document has valid Cloudinary storage
export function hasValidCloudinaryStorage(doc: {
  cloudinaryUrl?: string
}): boolean {
  return isCloudinaryUrlValid(doc.cloudinaryUrl)
}


