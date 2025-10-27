import { type NextRequest, NextResponse } from "next/server"
import { mongodbStorage } from "@/lib/mongodb-storage"
import { getDownloadUrl } from "@/lib/cloudinary"

// GET /api/documents/[id]/download - Get proper download URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const doc = await mongodbStorage.getById(id)
    
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (!doc.cloudinaryUrl) {
      return NextResponse.json({ error: "Document has no Cloudinary storage" }, { status: 404 })
    }

    // Use the stored cloudinaryUrl directly (it's the correct URL from upload)
    const downloadUrl = doc.cloudinaryUrl

    // Return the download URL or redirect directly
    return NextResponse.json({
      downloadUrl,
      filename: doc.name,
      size: doc.size,
      fileType: doc.fileType,
    })
  } catch (error) {
    console.error("[v0] Download URL generation error:", error)
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 })
  }
}
