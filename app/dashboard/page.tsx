"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { NotificationSettings } from "@/components/notification-settings"

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // In a real app, you would validate the token and fetch user info
        // This is a placeholder for demonstration
        const hasToken = document.cookie.includes("access_token")

        if (!hasToken) {
          router.push("/login?error=not_authenticated")
          return
        }

        // Fetch user info from a protected endpoint
        // This would be implemented in a real application
        setUser({
          name: "Telekom User",
          email: "user@example.com",
        })
      } catch (error) {
        console.error("Authentication check failed:", error)
        router.push("/login?error=session_expired")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    // Clear auth cookies
    document.cookie = "access_token=; Max-Age=0; path=/; SameSite=Lax"
    document.cookie = "refresh_token=; Max-Age=0; path=/; SameSite=Lax"

    // Redirect to login
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#E20074] border-r-[#E20074] border-b-gray-200 border-l-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Benutzerdaten...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#E20074] text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
              <span className="text-[#E20074] text-xl font-bold">T</span>
            </div>
            <h1 className="text-xl font-semibold">Telekom Dashboard</h1>
          </div>
          <Button
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-[#E20074] bg-transparent"
            onClick={handleLogout}
          >
            Abmelden
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Willkommen, {user?.name}</h2>
            <p className="text-gray-600 mb-6">Sie sind erfolgreich bei Telekom angemeldet.</p>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="font-medium mb-2">Ihre Kontoinformationen</h3>
              <p>
                <strong>E-Mail:</strong> {user?.email}
              </p>
            </div>
          </div>

          <NotificationSettings />
        </div>
      </main>

      <footer className="bg-gray-800 text-white p-4 mt-auto">
        <div className="container mx-auto flex justify-between items-center">
          <div>© Telekom Deutschland GmbH</div>
          <div className="flex space-x-6">
            <button className="hover:underline">Impressum</button>
            <button className="hover:underline">Datenschutz</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
