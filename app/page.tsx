"use client"

import { useState } from "react"
import { DocumentList } from "@/components/document-list"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Loader2 } from "lucide-react"
import logo from "@/public/logo.png"
import Image from "next/image"

const ContactForm = dynamic(() => import("@/components/contact"), { ssr: false })

export default function Home() {
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authenticatedPassword, setAuthenticatedPassword] = useState("") // Store authenticated password separately
  const [refreshKey, setRefreshKey] = useState(0)
  const [uploading, setUploading] = useState(false)

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
    <main className="min-h-screen bg-linear-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            {/* <Smile className="h-8 w-8 text-primary"/> */}
            <Image src={logo} alt="logo" className="h-10 w-10"/>
            <h1 className="text-4xl font-bold">TMKC</h1>
          </div>
          <div className="flex lg:flex-col">
          <p className="text-muted-foreground text-lg">
            Your documents, one click away — download instantly!
          </p>
          <p className="text-secondary-foreground text-lg">
          Access Previous Year Questions Instantly
          </p>
          </div>
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
                <h3 className="font-semibold mb-4">Upload Document(s)</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()

                    const input = (e.currentTarget.querySelector('#file-upload') as HTMLInputElement) || undefined
                    const files = input?.files

                    if (!files || files.length === 0) {
                      alert("Please select at least one file")
                      return
                    }

                    const uploadFormData = new FormData()
                    Array.from(files).forEach((file) => uploadFormData.append("file", file))
                    uploadFormData.append("password", authenticatedPassword)

                    try {
                      setUploading(true)
                      const res = await fetch("/api/documents", {
                        method: "POST",
                        body: uploadFormData,
                      })

                      if (res.ok) {
                        ;(e.target as HTMLFormElement).reset()
                        handleUploadSuccess()
                        alert(files.length > 1 ? "Files uploaded successfully!" : "File uploaded successfully!")
                      } else {
                        const data = await res.json().catch(() => ({ error: res.statusText }))
                        alert(`Upload failed: ${data.error || "Unknown error"}`)
                      }
                    } catch (err: any) {
                      alert(`Upload failed: ${err.message}`)
                    } finally {
                      setUploading(false)
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-2">
                    <label htmlFor="file-upload" className="block text-sm font-medium mb-1">
                      Choose File(s)
                    </label>
                    <Input 
                      id="file-upload"
                      type="file" 
                      name="file" 
                      multiple
                      disabled={uploading}
                      className="w-full cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Document(s)
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-semibold mb-4 px-4">Couldn't find what you were looking for?</h3>
              <ContactForm
                onSubmit={async (data) => {
                  const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  })
                  let payload: any = null
                  try { payload = await res.json() } catch {}
                  if (!res.ok) {
                    throw new Error(payload?.error || 'Failed to send message')
                  }
                  // Optional: show Ethereal preview URL in dev
                  if (payload?.previewUrl) {
                    console.log('Email preview URL:', payload.previewUrl)
                  }
                }}
              />
            </div>

          </div>

        </div>
      </div>
    </main>
  )
}
