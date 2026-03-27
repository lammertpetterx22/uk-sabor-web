/**
 * Test registration email sending
 *
 * Usage:
 * RESEND_API_KEY=re_bDESrsMD_9aWK4SeRXjzraHaiDWKdgbzA npx tsx scripts/test-registration-email.ts
 */

import { sendWelcomeEmail } from "../server/features/email";

async function main() {
  console.log("🧪 Testing registration email...");
  console.log("RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
  console.log("RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL || "UK Sabor <onboarding@resend.dev>");

  const success = await sendWelcomeEmail({
    to: "petterlammert@gmail.com",
    userName: "Test User",
  });

  if (success) {
    console.log("\n✅ Registration email sent successfully!");
    console.log("Check inbox: petterlammert@gmail.com");
  } else {
    console.log("\n❌ Failed to send registration email");
  }
}

main().catch(console.error);
