"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { HelpCircle } from "lucide-react"
import { initiateOAuth } from "@/lib/auth-actions"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image" // Import Image component

function TelekomLoginForm() {
  const [username, setUsername] = useState("")
  const [rememberUsername, setRememberUsername] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  // Get remembered username from cookie if available
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift()
    }

    const rememberedUsername = getCookie("remembered_username")
    if (rememberedUsername) {
      setUsername(rememberedUsername)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("username", username)
    formData.append("rememberUsername", rememberUsername.toString())

    try {
      await initiateOAuth(formData)
    } catch (error) {
      console.error("Authentication error:", error)
      setIsSubmitting(false)
    }
  }

  // Error messages mapping
  const errorMessages: Record<string, string> = {
    invalid_state: "Sicherheitsfehler: Ungültiger Status",
    no_code: "Authentifizierungsfehler: Kein Code erhalten",
    token_exchange_failed: "Fehler beim Token-Austausch",
    access_denied: "Zugriff verweigert",
    unauthorized_client: "Nicht autorisierter Client",
    invalid_request: "Ungültige Anfrage",
  }

  return (
    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg">
      {/* Header with Help Icon */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Telekom Login</h1>
        <HelpCircle className="w-6 h-6 text-gray-400" />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{errorMessages[error] || "Ein Fehler ist aufgetreten"}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Username Field */}
        <div className="mb-6">
          <div className="relative">
            <Input
              type="text"
              name="username"
              placeholder="Benutzername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:border-[#E20074] focus:ring-1 focus:ring-[#E20074] text-base"
            />
            <HelpCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Remember Username Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Switch
              checked={rememberUsername}
              onCheckedChange={setRememberUsername}
              className="data-[state=checked]:bg-[#E20074]"
            />
            <span className="text-gray-700 text-sm">Benutzername merken</span>
          </div>
          <HelpCircle className="w-5 h-5 text-gray-400" />
        </div>

        {/* Continue Button */}
        <Button
          type="submit"
          className="w-full h-12 bg-[#E20074] hover:bg-[#C1005F] text-white font-medium rounded-lg mb-4"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Bitte warten..." : "Weiter"}
        </Button>
      </form>

      {/* Other Login Options */}
      <Button
        variant="outline"
        className="w-full h-12 border-gray-300 text-gray-700 font-medium rounded-lg mb-6 hover:bg-gray-50 bg-transparent"
        onClick={() => console.log("Other options clicked")}
        disabled={isSubmitting}
      >
        Andere Anmeldeoptionen
      </Button>

      {/* Register Link */}
      <div className="text-center">
        <button
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          onClick={() => console.log("Register clicked")}
          disabled={isSubmitting}
          type="button"
        >
          Neu hier? Jetzt registrieren
        </button>
      </div>
    </div>
  )
}

export default function TelekomLogin() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <Image
        alt="Telekom Login Background"
        src="/background.jpeg"
        quality={100}
        fill
        sizes="100vw"
        style={{
          objectFit: "cover",
          zIndex: -1, // Ensure it stays in the background
        }}
        priority // Load background image eagerly
      />

      {/* Telekom Logo */}
      <div className="absolute top-8 left-8 z-10">
        <Image
          src="/telekom-logo-full.svg"
          alt="Telekom Logo"
          width={60} // SVG viewBox is 60x60
          height={60} // SVG viewBox is 60x60
          priority
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 z-10">
        <Suspense
          fallback={
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg">
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-t-[#E20074] border-r-[#E20074] border-b-gray-200 border-l-gray-200 rounded-full animate-spin"></div>
              </div>
            </div>
          }
        >
          <TelekomLoginForm />
        </Suspense>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center px-8 py-6 text-white text-sm z-10">
        <div>
          <div>© Telekom Deutschland GmbH</div>
          <div>26.24.0</div>
        </div>
        <div className="flex space-x-6">
          <button className="hover:underline">Impressum</button>
          <button className="hover:underline">Datenschutz</button>
        </div>
      </div>
    </div>
  )
}
