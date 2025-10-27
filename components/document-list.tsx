"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Download, Trash2, Search, X, ExternalLink } from "lucide-react"

interface Document {
  id: string
  name: string
  size: number
  uploadedAt: string
  cloudinaryUrl?: string
  cloudinaryPublicId?: string
  fileType?: string
  resourceType?: string
}

export function DocumentList({ 
  isAdmin = false, 
  adminPassword = ""
}: { 
  isAdmin?: boolean
  adminPassword?: string
}) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "size" | "date">("name")
  const [error, setError] = useState<string | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [loadingViewUrl, setLoadingViewUrl] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setError(null)
      const response = await fetch("/api/documents")
      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Failed to fetch documents:", response.status, errorText)
        setError(`Failed to load documents (${response.status})`)
        setDocuments([])
        setLoading(false)
        return
      }
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error("[v0] Failed to fetch documents:", error)
      setError("Failed to load documents")
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedDocuments = useMemo(() => {
    const filtered = documents.filter((doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "size":
          return b.size - a.size
        case "date":
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [documents, searchQuery, sortBy])

  const handleDownload = async (doc: Document) => {
    try {
      // Use the download API endpoint to get proper download URL
      const encodedId = encodeURIComponent(doc.id)
      const response = await fetch(`/api/documents/${encodedId}/download`)
      
      if (response.ok) {
        const data = await response.json()
        
        // Fetch the file as blob and trigger download
        try {
          const fileResponse = await fetch(data.downloadUrl)
          if (fileResponse.ok) {
            const blob = await fileResponse.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = doc.name
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
          } else {
            // Fallback: open in new tab
            window.open(data.downloadUrl, '_blank')
          }
        } catch (fetchError) {
          // Fallback: open in new tab
          window.open(data.downloadUrl, '_blank')
        }
      } else {
        console.error('[v0] Download failed:', response.status)
        alert('Failed to download document')
      }
    } catch (error) {
      console.error('[v0] Download error:', error)
      alert('Failed to download document')
    }
  }

  const handleDelete = async (id: string) => {
    // If no admin password provided, prompt for it (fallback for non-logged in admins)
    const password = adminPassword || prompt("Enter admin password to delete:")
    if (!password) return

    if (!window.confirm("Are you sure you want to delete this document?")) {
      return
    }

    try {
      // Properly encode the ID to handle special characters
      const encodedId = encodeURIComponent(id)
      const response = await fetch(`/api/documents/${encodedId}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      })

      if (response.ok) {
        // Trigger a full refresh by fetching documents again
        await fetchDocuments()
        alert("Document deleted successfully")
      } else {
        const data = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Delete failed:", response.status, data)
        alert(`Failed to delete document: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("[v0] Delete failed:", error)
      alert("Failed to delete document. Please check your connection.")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const handleViewDocument = async (doc: Document) => {
    setSelectedDoc(doc)
    setViewerOpen(true)
    setLoadingViewUrl(true)

    try {
      const encodedId = encodeURIComponent(doc.id)
      // Stream through our API to enforce inline Content-Type for PDFs
      setViewUrl(`/api/documents/${encodedId}/stream`)
    } finally {
      setLoadingViewUrl(false)
    }
  }

  const isPdf = (filename: string) => {
    return filename.toLowerCase().endsWith('.pdf')
  }

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  if (loading) {
    return <div className="text-center py-8">Loading documents...</div>
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchDocuments} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant={sortBy === "name" ? "default" : "outline"} size="sm" onClick={() => setSortBy("name")}>
            Name
          </Button>
          <Button variant={sortBy === "size" ? "default" : "outline"} size="sm" onClick={() => setSortBy("size")}>
            Size
          </Button>
          <Button variant={sortBy === "date" ? "default" : "outline"} size="sm" onClick={() => setSortBy("date")}>
            Date
          </Button>
        </div>
      </div>

      {/* Document list */}
      {filteredAndSortedDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {documents.length === 0 ? "No documents available" : "No documents match your search"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAndSortedDocuments.length} of {documents.length} documents
          </p>
          {filteredAndSortedDocuments.map((doc) => (
            <Card key={doc.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition">
              <div className="flex items-center gap-3 flex-1">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{doc.name}</p>
                    {!doc.cloudinaryUrl && (
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                        Old
                      </span>
                    )}
                    {doc.cloudinaryUrl && !doc.cloudinaryUrl.includes('res.cloudinary.com') && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                        Invalid URL
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatFileSize(doc.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.cloudinaryUrl ? (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    title="Download document"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="text-xs text-muted-foreground px-2">
                    Re-upload needed
                  </div>
                )}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Document Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={(open) => {
        setViewerOpen(open)
        if (!open) {
          setViewUrl(null)
          setSelectedDoc(null)
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.name}</DialogTitle>
          </DialogHeader>
          <div className="w-full h-[80vh] overflow-hidden">
            {selectedDoc && !selectedDoc.cloudinaryUrl ? (
              // Old document without Cloudinary storage
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center space-y-4 max-w-md">
                  <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">{selectedDoc.name}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This document was uploaded before Cloudinary integration and cannot be viewed or downloaded.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Please delete this document and re-upload it to enable viewing.
                  </p>
                </div>
              </div>
            ) : selectedDoc?.cloudinaryUrl ? (
              <>
                {loadingViewUrl ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-muted-foreground">Loading document...</p>
                  </div>
                ) : isPdf(selectedDoc.name) ? (
                  <div className="w-full h-full flex flex-col">
                    <iframe
                      src={viewUrl || selectedDoc.cloudinaryUrl}
                      className="w-full flex-1 border-0"
                      title={selectedDoc.name}
                      onError={(e) => {
                        console.error("Failed to load PDF")
                        // Hide iframe and show error
                        const iframe = e.target as HTMLIFrameElement
                        iframe.style.display = 'none'
                      }}
                    />
                    <div className="hidden iframe-error-message p-4 text-center">
                      <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="font-medium mb-2">PDF failed to load</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        This file may not exist in Cloudinary or has been deleted.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => window.open(selectedDoc?.cloudinaryUrl, '_blank')}>
                          Try Opening URL
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center space-y-4">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium">{selectedDoc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Preview not available for this file type
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <a 
                          href={selectedDoc.cloudinaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open in New Tab
                          </Button>
                        </a>
                        <Button 
                          variant="outline"
                          onClick={() => selectedDoc && handleDownload(selectedDoc)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Original
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground">No document selected</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
