import { type NextRequest, NextResponse } from "next/server"
import { mongodbStorage } from "@/lib/mongodb-storage"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doc = await mongodbStorage.getById(params.id)

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // If document has Cloudinary URL, redirect to it
    if (doc.cloudinaryUrl) {
      return NextResponse.redirect(doc.cloudinaryUrl, {
        status: 302,
        headers: {
          "Cache-Control": "no-cache",
        },
      })
    }

    // If no Cloudinary URL, this is an old document without Cloudinary storage
    return NextResponse.json({ 
      error: "This document cannot be downloaded. Please re-upload it." 
    }, { status: 410 }) // 410 Gone
  } catch (error) {
    console.error("[v0] Download error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}
