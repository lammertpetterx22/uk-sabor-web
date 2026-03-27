#!/usr/bin/env tsx
/**
 * Test Email Script - Verifica que Resend esté configurado correctamente
 */

import { sendWelcomeEmail } from "../server/features/email";

async function testEmail() {
  console.log("🧪 Testing Resend Email Configuration...\n");

  console.log("📧 Environment Variables:");
  console.log("  RESEND_API_KEY:", process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : "❌ NOT SET");
  console.log("  RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL || "❌ NOT SET");
  console.log("");

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ ERROR: RESEND_API_KEY is not set!");
    console.log("\nTo fix:");
    console.log("1. Go to https://app.koyeb.com/");
    console.log("2. Open your app 'uk-sabor-web'");
    console.log("3. Go to Settings → Environment");
    console.log("4. Add: RESEND_API_KEY = re_bDESrsMD_9aWK4SeRXjzraHaiDWKdgbzA");
    console.log("5. Add: RESEND_FROM_EMAIL = UK Sabor <noreply@consabor.uk>");
    process.exit(1);
  }

  console.log("✅ RESEND_API_KEY is set");
  console.log("");

  console.log("📤 Sending test welcome email to: petterlammert@gmail.com");
  console.log("");

  try {
    const result = await sendWelcomeEmail({
      to: "petterlammert@gmail.com",
      userName: "Test User"
    });

    if (result) {
      console.log("✅ Email sent successfully!");
      console.log("");
      console.log("Check your inbox at petterlammert@gmail.com");
      console.log("(Also check spam folder)");
    } else {
      console.log("❌ Email failed to send");
    }
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

testEmail().catch(console.error);
