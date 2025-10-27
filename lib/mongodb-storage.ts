import clientPromise, { getDatabaseName } from './mongodb'

export interface StoredDocument {
  id: string
  name: string
  size: number
  uploadedAt: string
  cloudinaryUrl: string
  cloudinaryPublicId: string
  fileType: string
  resourceType?: string // 'raw' for PDFs/docs, 'image' for images
}

const COLLECTION_NAME = 'documents'

// Get MongoDB collection
async function getCollection() {
  const client = await clientPromise
  const dbName = getDatabaseName()
  const db = client.db(dbName)
  return db.collection(COLLECTION_NAME)
}

export const mongodbStorage = {
  // Get all documents (metadata only)
  async getAll(): Promise<StoredDocument[]> {
    try {
      const collection = await getCollection()
      const docs = await collection.find({}).toArray()
      
      return docs.map((doc) => ({
        id: doc.id,
        name: doc.name,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
        cloudinaryUrl: doc.cloudinaryUrl || '',
        cloudinaryPublicId: doc.cloudinaryPublicId || '',
        fileType: doc.fileType || 'unknown',
        resourceType: doc.resourceType || 'raw',
      }))
    } catch (error) {
      console.error('[MongoDB] Error fetching documents:', error)
      throw error
    }
  },

  // Get a single document by ID
  async getById(id: string): Promise<StoredDocument | null> {
    try {
      const collection = await getCollection()
      const doc = await collection.findOne({ id })
      
      if (!doc) return null
      
      return {
        id: doc.id,
        name: doc.name,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
        cloudinaryUrl: doc.cloudinaryUrl || '',
        cloudinaryPublicId: doc.cloudinaryPublicId || '',
        fileType: doc.fileType || 'unknown',
        resourceType: doc.resourceType || 'raw',
      }
    } catch (error) {
      console.error('[MongoDB] Error fetching document:', error)
      throw error
    }
  },

  // Save a document
  async save(document: StoredDocument): Promise<void> {
    try {
      const collection = await getCollection()
      
      await collection.insertOne({
        id: document.id,
        name: document.name,
        size: document.size,
        uploadedAt: document.uploadedAt,
        cloudinaryUrl: document.cloudinaryUrl,
        cloudinaryPublicId: document.cloudinaryPublicId,
        fileType: document.fileType,
        resourceType: document.resourceType || 'raw',
      })
    } catch (error) {
      console.error('[MongoDB] Error saving document:', error)
      throw error
    }
  },

  // Delete a document by ID
  async delete(id: string): Promise<{ deleted: boolean; publicId?: string }> {
    try {
      const collection = await getCollection()
      const doc = await collection.findOne({ id })
      
      if (!doc) {
        return { deleted: false }
      }
      
      const result = await collection.deleteOne({ id })
      
      // Return the Cloudinary public ID for cleanup (if it exists)
      return {
        deleted: result.deletedCount > 0,
        publicId: doc.cloudinaryPublicId || undefined,
      }
    } catch (error) {
      console.error('[MongoDB] Error deleting document:', error)
      throw error
    }
  },

  // Check if document exists
  async exists(id: string): Promise<boolean> {
    try {
      const collection = await getCollection()
      const doc = await collection.findOne({ id })
      return doc !== null
    } catch (error) {
      console.error('[MongoDB] Error checking document existence:', error)
      throw error
    }
  },
}

