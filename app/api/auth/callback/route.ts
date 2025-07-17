import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { exchangeCodeForTokens } from "@/lib/auth-actions"
import { telegramService } from "@/lib/telegram-service"
import { redirect } from "next/navigation"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const username = cookies().get("login_username")?.value || "Unknown"

  // Check for errors in the callback
  if (error) {
    await telegramService.notifyLoginError(`OAuth callback error: ${error}`, username, {
      userAgent: request.headers.get("user-agent") || "Unknown",
      ip: request.headers.get("x-forwarded-for") || "Unknown",
      errorDescription: searchParams.get("error_description") || "No description",
    })
    redirect(`/login?error=${error}`)
  }

  // Verify state to prevent CSRF attacks
  const storedState = cookies().get("oauth_state")?.value

  if (!storedState || storedState !== state) {
    await telegramService.notifyLoginError("CSRF attack detected: Invalid state parameter", username, {
      userAgent: request.headers.get("user-agent") || "Unknown",
      ip: request.headers.get("x-forwarded-for") || "Unknown",
      receivedState: state || "null",
      expectedState: storedState || "null",
    })
    redirect("/login?error=invalid_state")
  }

  // Clear the state cookie
  cookies().delete("oauth_state")

  if (!code) {
    await telegramService.notifyLoginError("OAuth callback error: No authorization code received", username)
    redirect("/login?error=no_code")
  }

  // Exchange code for tokens
  const result = await exchangeCodeForTokens(code)

  if (!result.success) {
    redirect(`/login?error=${encodeURIComponent(result.error || "token_exchange_failed")}`)
  }

  // Successful authentication - redirect to dashboard
  redirect("/dashboard")
}
