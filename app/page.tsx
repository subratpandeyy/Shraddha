"use client"

import { useState } from "react"
import { DocumentList } from "@/components/document-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Upload } from "lucide-react"

export default function Home() {
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authenticatedPassword, setAuthenticatedPassword] = useState("") // Store authenticated password separately
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAdminLogin = () => {
    if (adminPassword === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setAuthenticatedPassword(adminPassword) // Keep password for uploads
      setAdminPassword("")
    } else {
      alert("Invalid password")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setShowAdmin(false)
    setAdminPassword("")
    setAuthenticatedPassword("") // Clear authenticated password on logout
  }

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Document Manager</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Browse and download documents. Admin access available for uploads.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-2xl font-semibold mb-6">Available Documents</h2>
              <DocumentList key={refreshKey} isAdmin={isAuthenticated} adminPassword={authenticatedPassword} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {!showAdmin ? (
              <Button onClick={() => setShowAdmin(true)} className="w-full" variant="outline">
                Admin Access
              </Button>
            ) : isAuthenticated ? (
              <div className="bg-card rounded-lg border p-6 space-y-4">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-3">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">Admin authenticated</p>
                </div>
                <Button onClick={handleLogout} variant="outline" className="w-full bg-transparent">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="bg-card rounded-lg border p-6 space-y-4">
                <h3 className="font-semibold">Admin Login</h3>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
                />
                <Button onClick={handleAdminLogin} className="w-full">
                  Login
                </Button>
                <Button onClick={() => setShowAdmin(false)} variant="outline" className="w-full">
                  Cancel
                </Button>
              </div>
            )}

            {isAuthenticated && (
              <div className="bg-card rounded-lg border p-6">
                <h3 className="font-semibold mb-4">Upload Document</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const file = formData.get("file") as File

                    if (!file || file.size === 0) {
                      alert("Please select a file")
                      return
                    }

                    const uploadFormData = new FormData()
                    uploadFormData.append("file", file)
                    uploadFormData.append("password", authenticatedPassword)

                    try {
                      const res = await fetch("/api/documents", {
                        method: "POST",
                        body: uploadFormData,
                      })

                      if (res.ok) {
                        ;(e.target as HTMLFormElement).reset()
                        handleUploadSuccess()
                        alert("File uploaded successfully!")
                      } else {
                        const data = await res.json().catch(() => ({ error: res.statusText }))
                        alert(`Upload failed: ${data.error || "Unknown error"}`)
                      }
                    } catch (err: any) {
                      alert(`Upload failed: ${err.message}`)
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <label htmlFor="file-upload" className="block text-sm font-medium mb-1">
                      Choose File
                    </label>
                    <Input 
                      id="file-upload"
                      type="file" 
                      name="file" 
                      className="w-full cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
