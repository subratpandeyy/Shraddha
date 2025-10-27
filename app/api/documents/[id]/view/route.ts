import { type NextRequest, NextResponse } from "next/server"
import { mongodbStorage } from "@/lib/mongodb-storage"
import { getCloudinaryUrl } from "@/lib/cloudinary"

// GET /api/documents/[id]/view - Get signed URL for viewing
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

    if (!doc.cloudinaryPublicId) {
      return NextResponse.json({ error: "Document has no Cloudinary storage" }, { status: 404 })
    }

    // Use the stored cloudinaryUrl directly (it's the correct URL from upload)
    const viewUrl = doc.cloudinaryUrl

    return NextResponse.json({
      viewUrl,
      filename: doc.name,
      size: doc.size,
      fileType: doc.fileType,
    })
  } catch (error) {
    console.error("[v0] View URL generation error:", error)
    return NextResponse.json({ error: "Failed to generate view URL" }, { status: 500 })
  }
}
