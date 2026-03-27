/**
 * Verify that the Resend API key is valid and working
 *
 * Usage:
 * RESEND_API_KEY=re_bDESrsMD_9aWK4SeRXjzraHaiDWKdgbzA npx tsx scripts/verify-resend-key.ts
 */

import { Resend } from "resend";

async function main() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("❌ RESEND_API_KEY not set");
    process.exit(1);
  }

  console.log("🔑 Using API Key:", apiKey.substring(0, 10) + "...");

  const resend = new Resend(apiKey);

  try {
    console.log("📧 Attempting to send test email...");

    const result = await resend.emails.send({
      from: "UK Sabor <onboarding@resend.dev>",
      to: "petterlammert@gmail.com",
      subject: "🧪 Test Email - Verifying Resend API",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify the Resend API key is working.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
    });

    console.log("✅ Email sent successfully!");
    console.log("📊 Resend Response:", JSON.stringify(result, null, 2));

    if (result.data) {
      console.log("✅ Email ID:", result.data.id);
    }

    if (result.error) {
      console.error("❌ Resend Error:", result.error);
    }
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    process.exit(1);
  }
}

main().catch(console.error);
