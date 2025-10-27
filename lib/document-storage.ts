// This allows all API routes to access the same document store

interface StoredDocument {
  id: string
  name: string
  size: number
  uploadedAt: string
  data: ArrayBuffer
}

// Global in-memory document storage
export const documentsStore = new Map<string, StoredDocument>()
