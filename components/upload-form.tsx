"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Upload } from "lucide-react"

export function UploadForm({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !password) {
      setError("Please select a file and enter password")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("password", password)

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setFile(null)
        setPassword("")
        onUploadSuccess()
      } else {
        const data = await response.json()
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
          <label className="block text-sm font-medium mb-2">Select Document</label>
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={loading} />
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
          <Upload className="h-4 w-4 mr-2" />
          {loading ? "Uploading..." : "Upload Document"}
        </Button>
      </form>
    </Card>
  )
}
