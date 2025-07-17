import { telegramConfig, type TelegramNotification } from "./telegram-config"

class TelegramService {
  private async sendMessage(text: string, parseMode: "HTML" | "Markdown" = "HTML") {
    try {
      const response = await fetch(`${telegramConfig.apiUrl}${telegramConfig.botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: telegramConfig.chatId,
          text,
          parse_mode: parseMode,
          disable_web_page_preview: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to send Telegram message:", error)
      throw error
    }
  }

  private formatNotification(notification: TelegramNotification): string {
    const { type, title, message, username, timestamp, metadata } = notification

    // Emoji mapping for different notification types
    const emojis = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    }

    const emoji = emojis[type]
    const time = timestamp ? timestamp.toLocaleString("de-DE") : new Date().toLocaleString("de-DE")

    let formattedMessage = `${emoji} <b>${title}</b>\n\n`
    formattedMessage += `📝 ${message}\n`
    formattedMessage += `🕐 ${time}\n`

    if (username) {
      formattedMessage += `👤 Benutzer: <code>${username}</code>\n`
    }

    if (metadata && Object.keys(metadata).length > 0) {
      formattedMessage += `\n📊 <b>Details:</b>\n`
      Object.entries(metadata).forEach(([key, value]) => {
        formattedMessage += `• ${key}: <code>${value}</code>\n`
      })
    }

    return formattedMessage
  }

  async sendNotification(notification: TelegramNotification) {
    try {
      const formattedMessage = this.formatNotification({
        ...notification,
        timestamp: notification.timestamp || new Date(),
      })

      return await this.sendMessage(formattedMessage)
    } catch (error) {
      console.error("Failed to send Telegram notification:", error)
      // Don't throw error to prevent breaking the main flow
      return null
    }
  }

  // Specific notification methods
  async notifySuccessfulLogin(username: string, metadata?: Record<string, any>) {
    return this.sendNotification({
      type: "success",
      title: "Telekom Login Erfolgreich",
      message: "Ein Benutzer hat sich erfolgreich angemeldet.",
      username,
      metadata: {
        ...metadata,
        service: "Telekom OAuth",
      },
    })
  }

  async notifyLoginError(error: string, username?: string, metadata?: Record<string, any>) {
    return this.sendNotification({
      type: "error",
      title: "Telekom Login Fehler",
      message: `Anmeldefehler aufgetreten: ${error}`,
      username,
      metadata: {
        ...metadata,
        service: "Telekom OAuth",
      },
    })
  }

  async notifyLoginAttempt(username: string, metadata?: Record<string, any>) {
    return this.sendNotification({
      type: "info",
      title: "Telekom Login Versuch",
      message: "Ein Benutzer versucht sich anzumelden.",
      username,
      metadata: {
        ...metadata,
        service: "Telekom OAuth",
      },
    })
  }

  async notifyTokenRefresh(username: string, metadata?: Record<string, any>) {
    return this.sendNotification({
      type: "info",
      title: "Token Aktualisierung",
      message: "Benutzer-Token wurde erfolgreich aktualisiert.",
      username,
      metadata: {
        ...metadata,
        service: "Telekom OAuth",
      },
    })
  }
}

export const telegramService = new TelegramService()
