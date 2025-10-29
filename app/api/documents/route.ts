import { type NextRequest, NextResponse } from "next/server"
import { mongodbStorage } from "@/lib/mongodb-storage"
import { uploadToCloudinary } from "@/lib/cloudinary"

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      console.warn("[v0] NEXT_PUBLIC_ADMIN_PASSWORD not set")
    }

    const documentList = await mongodbStorage.getAll()
    
    return NextResponse.json(documentList)
  } catch (error) {
    console.error("[v0] Error fetching documents:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[v0] Error details:", errorMessage, error)
    return NextResponse.json({ 
      error: "Failed to fetch documents",
      details: errorMessage 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const adminPassword = formData.get("password") as string

    const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    if (!expectedPassword) {
      console.error("[v0] NEXT_PUBLIC_ADMIN_PASSWORD environment variable not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    if (adminPassword !== expectedPassword) {
      console.warn("[v0] Invalid admin password attempt")
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Allow multiple files appended under the same "file" key
    const files = formData
      .getAll("file")
      .filter((f): f is File => typeof f === "object" && (f as any)?.arrayBuffer instanceof Function)

    if (!files.length) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file sizes (10MB limit per file)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    const oversizedFiles = files.filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      return NextResponse.json({ 
        error: `File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is 10MB per file.` 
      }, { status: 400 })
    }

    // Check Cloudinary credentials
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("[v0] Cloudinary credentials not configured")
      return NextResponse.json({ 
        error: "Cloudinary not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env.local" 
      }, { status: 500 })
    }

    // Upload all files (in parallel) and persist records
    const results = await Promise.all(
      files.map(async (file) => {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        const uploadResult = await uploadToCloudinary(buffer, file.name, 'documents')

        const id = `${Date.now()}-${file.name}`
        const publicIdToStore = uploadResult.public_id
        const cloudinaryUrl = uploadResult.secure_url

        await mongodbStorage.save({
          id,
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          cloudinaryUrl: cloudinaryUrl,
          cloudinaryPublicId: publicIdToStore,
          fileType: uploadResult.format || 'unknown',
          resourceType: uploadResult.resource_type,
        })

        return {
          id,
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        }
      })
    )

    return NextResponse.json({ uploaded: results })
  } catch (error) {
    console.error("[v0] Upload error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
