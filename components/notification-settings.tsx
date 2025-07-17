"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, Send } from "lucide-react"

export function NotificationSettings() {
  const [isTestingNotification, setIsTestingNotification] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTestNotification = async () => {
    setIsTestingNotification(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/test-notification", {
        method: "POST",
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: "Fehler beim Senden der Test-Benachrichtigung",
      })
    } finally {
      setIsTestingNotification(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Telegram Benachrichtigungen
        </CardTitle>
        <CardDescription>
          Verwalten Sie Ihre Telegram-Benachrichtigungseinstellungen für Login-Ereignisse.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">Aktive Benachrichtigungen:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✅ Erfolgreiche Anmeldungen</li>
            <li>❌ Anmeldefehler</li>
            <li>ℹ️ Anmeldeversuche</li>
            <li>🔄 Token-Aktualisierungen</li>
          </ul>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={handleTestNotification}
            disabled={isTestingNotification}
            className="w-full bg-transparent"
            variant="outline"
          >
            <Send className="w-4 h-4 mr-2" />
            {isTestingNotification ? "Sende Test..." : "Test-Benachrichtigung senden"}
          </Button>
        </div>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
