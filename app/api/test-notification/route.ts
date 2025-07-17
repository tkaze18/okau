import { telegramService } from "@/lib/telegram-service"
import { emailService } from "@/lib/email-service" // Import email service
import { NextResponse } from "next/server"
import { emailConfig } from "@/lib/telegram-config"

export async function POST() {
  try {
    // Send a test notification to Telegram
    await telegramService.sendNotification({
      type: "info",
      title: "Test Notification",
      message: "Dies ist eine Test-Benachrichtigung vom Telekom Login System (Telegram).",
      username: "test-user",
      metadata: {
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
      },
    })

    // Send a test notification to Email
    await emailService.sendEmail({
      type: "info",
      subject: "Test Notification from Telekom Login System",
      body: `
        <h1>Test Notification</h1>
        <p>Dies ist eine Test-Benachrichtigung vom Telekom Login System (Email).</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || "development"}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
      recipient: emailConfig.recipientEmail,
    })

    return NextResponse.json({ success: true, message: "Test notifications sent (Telegram & Email)" })
  } catch (error) {
    console.error("Test notification failed:", error)
    return NextResponse.json({ success: false, error: "Failed to send test notification" }, { status: 500 })
  }
}
