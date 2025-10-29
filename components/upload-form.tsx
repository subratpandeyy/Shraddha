"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Upload, Loader2 } from "lucide-react"

export function UploadForm({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [files, setFiles] = useState<FileList | null>(null)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files || files.length === 0 || !password) {
      setError("Please select at least one file and enter password")
      return
    }

    // Validate file sizes (10MB limit per file)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    const oversizedFiles = Array.from(files).filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      setError(`File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is 10MB per file.`)
      return
    }

    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append("file", file))
      formData.append("password", password)

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setFiles(null)
        setPassword("")
        onUploadSuccess()
      } else {
        const data = await response.json().catch(() => ({ error: "Upload failed" }))
        setError(data.error || "Upload failed")
      }
    } catch (err) {
      setError("Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Document(s)</label>
          <Input type="file" multiple onChange={(e) => setFiles(e.target.files)} disabled={loading} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Admin Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            disabled={loading}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document(s)
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}
