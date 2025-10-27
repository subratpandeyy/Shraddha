import { type NextRequest, NextResponse } from "next/server"
import { mongodbStorage } from "@/lib/mongodb-storage"
import { deleteFromCloudinary } from "@/lib/cloudinary"

// Next.js 16: params is now a Promise that needs to be awaited
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 16 compatibility
    const { id } = await params
    
    const adminPassword = request.headers.get("x-admin-password")

    const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    if (!expectedPassword) {
      console.error("[v0] NEXT_PUBLIC_ADMIN_PASSWORD environment variable not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    if (adminPassword !== expectedPassword) {
      console.warn("[v0] Invalid admin password attempt for delete")
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Get document to determine resource type before deleting
    const doc = await mongodbStorage.getById(id)
    if (!doc) {
      console.warn(`[v0] Document not found: ${id}`)
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    
    const result = await mongodbStorage.delete(id)
    
    if (result.deleted) {
      // Delete from Cloudinary with correct resource type
      if (result.publicId && doc) {
        try {
          // Determine resource type from file name
          const isPdf = doc.name.toLowerCase().endsWith('.pdf')
          const resource_type = isPdf ? 'raw' : 'image'
          await deleteFromCloudinary(result.publicId, resource_type)
        } catch (cloudinaryError) {
          console.error("[v0] Error deleting from Cloudinary:", cloudinaryError)
          // Continue even if Cloudinary deletion fails
        }
      }
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("[v0] Delete error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
