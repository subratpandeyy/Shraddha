import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {}

// Extract database name from connection string
// Format: mongodb+srv://.../database_name?retryWrites...
export function getDatabaseName(): string {
  // If explicitly set in env, use it
  if (process.env.MONGODB_DB_NAME) {
    return process.env.MONGODB_DB_NAME
  }
  
  // Try to extract from URI
  try {
    const url = new URL(uri)
    const dbName = url.pathname.substring(1) // Remove leading slash
    if (dbName && dbName !== '/') {
      return dbName
    }
  } catch (e) {
    // URL parsing failed, might be a connection string without protocol
    const match = uri.match(/\/([^?]+)/)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  // Default fallback
  throw new Error('Database name not specified. Add MONGODB_DB_NAME to .env.local or include database name in MONGODB_URI (e.g., mongodb+srv://.../database_name)')
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

