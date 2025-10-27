import { NextResponse, type NextRequest } from "next/server"
import { mongodbStorage } from "@/lib/mongodb-storage"

// Streams the document with correct headers for inline viewing (e.g., PDFs)
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
      return NextResponse.json({ error: "Document has no Cloudinary URL" }, { status: 404 })
    }

    // Fetch file from Cloudinary
    const upstream = await fetch(doc.cloudinaryUrl)
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Upstream fetch failed" }, { status: upstream.status || 502 })
    }

    const isPdf = doc.name.toLowerCase().endsWith(".pdf")
    const headers = new Headers()
    headers.set("Content-Disposition", `inline; filename="${doc.name}"`)
    headers.set("Cache-Control", "private, max-age=3600")

    // Prefer upstream content-type if present; otherwise set based on extension
    const upstreamType = upstream.headers.get("content-type") || undefined
    headers.set("Content-Type", upstreamType || (isPdf ? "application/pdf" : "application/octet-stream"))

    return new NextResponse(upstream.body, { status: 200, headers })
  } catch (err) {
    console.error("[stream] error:", err)
    return NextResponse.json({ error: "Stream failed" }, { status: 500 })
  }
}