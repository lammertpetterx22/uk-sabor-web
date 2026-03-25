#!/usr/bin/env tsx
/**
 * Script to recover lost purchases from Stripe
 *
 * This script:
 * 1. Fetches all successful checkout sessions from Stripe
 * 2. Checks which ones are missing from our database
 * 3. Creates the missing orders, tickets, and QR codes
 * 4. Sends confirmation emails to customers
 */

import "dotenv/config";
import Stripe from "stripe";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { orders, eventTickets, coursePurchases, classPurchases, qrCodes, users, events, courses, classes } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import QRCode from "qrcode";
import { sendQRCodeEmail } from "../server/features/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any,
});

function generateTicketCode(): string {
  return `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

function generateAccessCode(): string {
  return `ACCESS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client);

  console.log("🔍 Fetching completed checkout sessions from Stripe...\n");

  // Fetch all successful checkout sessions from Stripe (last 30 days)
  const sessions = await stripe.checkout.sessions.list({
    limit: 100,
    created: {
      gte: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60), // Last 30 days
    },
  });

  console.log(`Found ${sessions.data.length} checkout sessions in Stripe\n`);

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const session of sessions.data) {
    if (session.payment_status !== "paid") {
      continue;
    }

    const userId = session.client_reference_id ? parseInt(session.client_reference_id) : null;
    const metadata = session.metadata || {};
    const livemode = session.livemode;

    // Check if this is a multi-item cart purchase
    if (metadata.is_multi_item_cart === "true") {
      console.log(`\n🛒 Processing multi-item cart: ${session.id}`);

      const cartItemsJson = metadata.cart_items;
      if (!cartItemsJson || !userId) {
        console.log(`  ⚠️  Skipping - missing data`);
        skippedCount++;
        continue;
      }

      let cartItems: Array<{type: string, id: number, title: string, price: number, quantity?: number}> = [];
      try {
        cartItems = JSON.parse(cartItemsJson);
      } catch (e) {
        console.log(`  ❌ Failed to parse cart_items`);
        errorCount++;
        continue;
      }

      for (const item of cartItems) {
        const itemType = item.type as "event" | "course" | "class";
        const itemId = item.id;

        // Check if order already exists
        const existingOrder = await db
          .select()
          .from(orders)
          .where(
            and(
              eq(orders.userId, userId),
              eq(orders.itemType, itemType),
              eq(orders.itemId, itemId),
              eq(orders.stripePaymentIntentId, session.payment_intent as string)
            )
          )
          .limit(1);

        if (existingOrder.length > 0) {
          console.log(`  ✓ Already exists: ${itemType} #${itemId}`);
          skippedCount++;
          continue;
        }

        try {
          const quantity = item.quantity || 1;
          const itemPrice = item.price;

          // Create order
          const [order] = await db.insert(orders).values({
            userId,
            stripePaymentIntentId: session.payment_intent as string,
            amount: (itemPrice * quantity).toFixed(2) as any,
            currency: (session.currency || "gbp").toUpperCase(),
            status: "completed",
            itemType,
            itemId,
            livemode,
          }).returning({ id: orders.id });

          const orderId = order.id;
          console.log(`  ✅ Created order #${orderId} - ${itemType} #${itemId}`);

          let ticketCode: string | undefined;
          let accessCode: string | undefined;

          // Create purchase record
          switch (itemType) {
            case "event":
              ticketCode = generateTicketCode();
              await db.insert(eventTickets).values({
                userId,
                eventId: itemId,
                orderId,
                quantity,
                pricePaid: (itemPrice * quantity).toFixed(2) as any,
                ticketCode,
                status: "valid",
              });
              break;

            case "course":
              await db.insert(coursePurchases).values({
                userId,
                courseId: itemId,
                orderId,
                pricePaid: itemPrice.toFixed(2) as any,
                progress: 0,
                completed: false,
              });
              break;

            case "class":
              accessCode = generateAccessCode();
              await db.insert(classPurchases).values({
                userId,
                classId: itemId,
                orderId,
                pricePaid: itemPrice.toFixed(2) as any,
                accessCode,
                status: "active",
              });
              break;
          }

          // Generate QR code for events and classes
          if (itemType === "event" || itemType === "class") {
            const qrValue = itemType === "event"
              ? `event-${itemId}-user-${userId}-order-${orderId}`
              : `class-${itemId}-user-${userId}-order-${orderId}`;

            const qrCodeImage = await QRCode.toDataURL(qrValue, {
              errorCorrectionLevel: "H" as any,
              margin: 1,
              width: 300,
            });

            await db.insert(qrCodes).values({
              itemType: itemType as "event" | "class",
              itemId,
              userId,
              orderId,
              code: qrValue,
              qrData: qrCodeImage,
            });

            // Send email
            const [userRecord] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            const userEmail = userRecord?.email;
            const userName = userRecord?.name || "Customer";

            if (userEmail && qrCodeImage) {
              let itemName = item.title;
              let eventDate: string | undefined;
              let eventTime: string | undefined;

              if (itemType === "event") {
                const [eventRecord] = await db.select().from(events).where(eq(events.id, itemId)).limit(1);
                if (eventRecord) {
                  itemName = eventRecord.title;
                  const d = new Date(eventRecord.eventDate);
                  eventDate = d.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                  eventTime = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                }
              } else if (itemType === "class") {
                const [classRecord] = await db.select().from(classes).where(eq(classes.id, itemId)).limit(1);
                if (classRecord) {
                  itemName = classRecord.title;
                  const d = new Date(classRecord.classDate);
                  eventDate = d.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                  eventTime = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                }
              }

              await sendQRCodeEmail({
                to: userEmail,
                userName,
                itemType: itemType as "event" | "class",
                itemName,
                qrCodeImage,
                ticketCode: itemType === "event" ? ticketCode : undefined,
                accessCode: itemType === "class" ? accessCode : undefined,
                eventDate,
                eventTime,
              });

              console.log(`  ✅ Email sent to ${userEmail}`);
            }
          }

          processedCount++;
        } catch (error: any) {
          console.error(`  ❌ Error processing ${itemType} #${itemId}:`, error.message);
          errorCount++;
        }
      }
    } else {
      // Single item purchase (legacy)
      const itemType = metadata.itemType as "event" | "course" | "class" | undefined;
      const itemId = metadata.itemId ? parseInt(metadata.itemId) : null;

      if (!userId || !itemType || !itemId) {
        continue;
      }

      // Check if order already exists
      const existingOrder = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.userId, userId),
            eq(orders.itemType, itemType),
            eq(orders.itemId, itemId),
            eq(orders.stripePaymentIntentId, session.payment_intent as string)
          )
        )
        .limit(1);

      if (existingOrder.length > 0) {
        console.log(`✓ Already exists: ${itemType} #${itemId}`);
        skippedCount++;
        continue;
      }

      console.log(`\nℹ️  Found missing single-item purchase: ${session.id}`);
      console.log(`  Type: ${itemType}, ID: ${itemId}, User: ${userId}`);
      console.log(`  This should be processed manually or you can extend this script`);
      skippedCount++;
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`  ✅ Recovered: ${processedCount} purchases`);
  console.log(`  ⏭️  Skipped: ${skippedCount} (already exist or invalid)`);
  console.log(`  ❌ Errors: ${errorCount}`);

  await client.end();
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
