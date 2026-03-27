#!/usr/bin/env tsx

/**
 * Test all email types to verify they work correctly
 */

import { sendWelcomeEmail, sendQRCodeEmail, sendOrderConfirmationEmail } from "../server/features/email";

async function testAllEmails() {
  console.log("🧪 Testing All Email Types...\n");

  const testEmail = "petterlammert@gmail.com";
  const testUserName = "Test User";

  // Test 1: Welcome Email
  console.log("1️⃣ Testing Welcome Email...");
  try {
    const welcomeResult = await sendWelcomeEmail({
      to: testEmail,
      userName: testUserName,
    });
    if (welcomeResult) {
      console.log("✅ Welcome email sent successfully!\n");
    } else {
      console.log("❌ Welcome email failed to send\n");
    }
  } catch (error) {
    console.error("❌ Welcome email error:", error, "\n");
  }

  // Test 2: QR Code Email (Event)
  console.log("2️⃣ Testing QR Code Email (Event)...");
  try {
    const qrResult = await sendQRCodeEmail({
      to: testEmail,
      userName: testUserName,
      itemType: "event",
      itemName: "SABOR - Latin Dance Night",
      qrCodeImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      ticketCode: "TEST-12345",
      eventDate: "Saturday, 30 March 2026",
      eventTime: "20:00",
    });
    if (qrResult) {
      console.log("✅ QR code email sent successfully!\n");
    } else {
      console.log("❌ QR code email failed to send\n");
    }
  } catch (error) {
    console.error("❌ QR code email error:", error, "\n");
  }

  // Test 3: Order Confirmation Email
  console.log("3️⃣ Testing Order Confirmation Email...");
  try {
    const orderResult = await sendOrderConfirmationEmail({
      to: testEmail,
      userName: testUserName,
      orderId: 999,
      itemType: "event",
      itemName: "SABOR - Latin Dance Night",
      amount: 500, // £5.00
      currency: "GBP",
    });
    if (orderResult) {
      console.log("✅ Order confirmation email sent successfully!\n");
    } else {
      console.log("❌ Order confirmation email failed to send\n");
    }
  } catch (error) {
    console.error("❌ Order confirmation email error:", error, "\n");
  }

  console.log("\n📊 Email Test Summary:");
  console.log("Check your inbox at:", testEmail);
  console.log("(Also check spam folder)\n");
}

testAllEmails().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
