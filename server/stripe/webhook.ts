import Stripe from "stripe";
import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import {
  orders,
  eventTickets,
  coursePurchases,
  classPurchases,
  qrCodes,
  users,
  events,
  courses,
  classes,
  instructors,
} from "../../drizzle/schema";
import { PRODUCT_METADATA } from "./products";
import { sendQRCodeEmail } from "../features/email";
import { addEarnings } from "../features/financials";
import { PLANS, PlanKey } from "./plans";
import QRCode from "qrcode";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

/**
 * Stripe webhook handler for payment events
 * Processes checkout.session.completed and payment_intent.succeeded events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Webhook] Processing event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Handle successful checkout session
 * FIX: Generate personal QR codes per buyer, send correct codes via email,
 * and save with userId so users can retrieve them in their dashboard.
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  const userId = session.client_reference_id ? parseInt(session.client_reference_id) : null;
  const metadata = session.metadata || {};
  const itemType = metadata[PRODUCT_METADATA.ITEM_TYPE];
  const itemId = metadata[PRODUCT_METADATA.ITEM_ID] ? parseInt(metadata[PRODUCT_METADATA.ITEM_ID]) : null;

  if (!userId || !itemType || !itemId) {
    console.error("[Webhook] Missing required metadata:", { userId, itemType, itemId });
    return;
  }

  const amount = session.amount_total ? (session.amount_total / 100).toFixed(2) : "0";
  const currency = (session.currency || "gbp").toUpperCase();

  try {
    // Create order record
    const [order] = await db.insert(orders).values({
      userId,
      stripePaymentIntentId: session.payment_intent as string,
      amount: amount as any,
      currency,
      status: "completed",
      itemType: itemType as "event" | "course" | "class",
      itemId,
    }).returning({ id: orders.id });

    const orderId = order.id;

    // ─── Financial Payout Logic ──────────────────────────────────────────────
    try {
      let creatorUserId: number | null = null;
      let netEarningsPence = 0;
      let sellerPlan: string = "starter";

      if (itemType === "event") {
        const [event] = await db.select({ creatorId: events.creatorId }).from(events).where(eq(events.id, itemId)).limit(1);
        creatorUserId = event?.creatorId || null;
        if (creatorUserId) {
          const [u] = await db.select({ subscriptionPlan: users.subscriptionPlan }).from(users).where(eq(users.id, creatorUserId)).limit(1);
          sellerPlan = u?.subscriptionPlan || "starter";
        }
        const ticketPricePence = parseInt(metadata.ticket_price_pence || "0");
        const quantity = metadata.quantity ? parseInt(metadata.quantity) : 1;
        netEarningsPence = ticketPricePence * quantity;
      } else if (itemType === "course") {
        const [course] = await db.select({ instructorId: courses.instructorId }).from(courses).where(eq(courses.id, itemId)).limit(1);
        if (course) {
          const [instr] = await db.select({ userId: instructors.userId }).from(instructors).where(eq(instructors.id, course.instructorId)).limit(1);
          creatorUserId = instr?.userId || null;
          if (creatorUserId) {
            const [u] = await db.select({ subscriptionPlan: users.subscriptionPlan }).from(users).where(eq(users.id, creatorUserId)).limit(1);
            sellerPlan = u?.subscriptionPlan || "starter";
          }
          netEarningsPence = parseInt(metadata.ticket_price_pence || "0");
        }
      } else if (itemType === "class") {
        const [classItem] = await db.select({ instructorId: classes.instructorId }).from(classes).where(eq(classes.id, itemId)).limit(1);
        if (classItem) {
          const [instr] = await db.select({ userId: instructors.userId }).from(instructors).where(eq(instructors.id, classItem.instructorId)).limit(1);
          creatorUserId = instr?.userId || null;
          if (creatorUserId) {
            const [u] = await db.select({ subscriptionPlan: users.subscriptionPlan }).from(users).where(eq(users.id, creatorUserId)).limit(1);
            sellerPlan = u?.subscriptionPlan || "starter";
          }
          netEarningsPence = parseInt(metadata.ticket_price_pence || "0");
        }
      }

      if (creatorUserId && netEarningsPence > 0) {
        let platformFeeGBP = 0;
        let instructorEarningsGBP = netEarningsPence / 100;

        // For courses, calculate tiered commission
        if (itemType === "course") {
          const planDef = PLANS[sellerPlan as PlanKey] || PLANS.starter;
          const commissionRate = planDef.courseCommissionRate;
          const commissionPence = Math.round(netEarningsPence * commissionRate);
          platformFeeGBP = commissionPence / 100;
          instructorEarningsGBP = (netEarningsPence - commissionPence) / 100;
        }

        await addEarnings({
          userId: creatorUserId,
          amount: instructorEarningsGBP,
          description: `Sale: ${metadata.item_name || itemType} (#${orderId})`,
          orderId: orderId,
        });

        // Store financial details in purchase record later (sharing scope)
        (metadata as any)._calculated_platform_fee = platformFeeGBP;
        (metadata as any)._calculated_instructor_earnings = instructorEarningsGBP;
        (metadata as any)._creator_user_id = creatorUserId;

        console.log(`[Webhook] Allocated £${instructorEarningsGBP.toFixed(2)} to creator ${creatorUserId} (Fee: £${platformFeeGBP.toFixed(2)})`);
      }
    } catch (finError) {
      console.error("[Webhook] Error allocating earnings:", finError);
      // We don't throw here to avoid blocking ticket delivery, but logging is crucial
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Variables to hold the ticket/access code for this purchase
    let ticketCode: string | undefined;
    let accessCode: string | undefined;

    // Create appropriate purchase record based on item type
    switch (itemType) {
      case "event":
        ticketCode = generateTicketCode();
        await db.insert(eventTickets).values({
          userId,
          eventId: itemId,
          orderId,
          quantity: metadata.quantity ? parseInt(metadata.quantity) : 1,
          instructorId: (metadata as any)._creator_user_id,
          pricePaid: (parseInt(metadata.ticket_price_pence || "0") * (metadata.quantity ? parseInt(metadata.quantity) : 1) / 100).toFixed(2) as any,
          platformFee: ((metadata as any)._calculated_platform_fee || 0).toFixed(2) as any,
          instructorEarnings: ((metadata as any)._calculated_instructor_earnings || 0).toFixed(2) as any,
          ticketCode,
          status: "valid",
        });
        console.log(`[Webhook] Event ticket created for user ${userId}, event ${itemId}`);
        break;

      case "course":
        await db.insert(coursePurchases).values({
          userId,
          courseId: itemId,
          instructorId: (metadata as any)._creator_user_id,
          orderId,
          pricePaid: (parseInt(metadata.ticket_price_pence || "0") / 100).toFixed(2) as any,
          platformFee: ((metadata as any)._calculated_platform_fee || 0).toFixed(2) as any,
          instructorEarnings: ((metadata as any)._calculated_instructor_earnings || 0).toFixed(2) as any,
          progress: 0,
          completed: false,
        });
        console.log(`[Webhook] Course purchase created for user ${userId}, course ${itemId}`);
        break;

      case "class":
        accessCode = generateAccessCode();
        await db.insert(classPurchases).values({
          userId,
          classId: itemId,
          instructorId: (metadata as any)._creator_user_id,
          orderId,
          pricePaid: (parseInt(metadata.ticket_price_pence || "0") / 100).toFixed(2) as any,
          platformFee: ((metadata as any)._calculated_platform_fee || 0).toFixed(2) as any,
          instructorEarnings: ((metadata as any)._calculated_instructor_earnings || 0).toFixed(2) as any,
          accessCode,
          status: "active",
        });
        console.log(`[Webhook] Class purchase created for user ${userId}, class ${itemId}`);
        break;
    }

    // Generate personal QR code for events and classes (not courses)
    if (itemType === "event" || itemType === "class") {
      // Use the ticket/access code as the QR value so scanning reveals the code
      const qrValue = itemType === "event"
        ? `event-${itemId}-user-${userId}-order-${orderId}`
        : `class-${itemId}-user-${userId}-order-${orderId}`;

      let qrCodeImage: string | null = null;

      try {
        qrCodeImage = await QRCode.toDataURL(qrValue, {
          errorCorrectionLevel: "H" as any,
          margin: 1,
          width: 300,
        });

        // Save personal QR code to database (linked to this user and order)
        await db.insert(qrCodes).values({
          itemType: itemType as "event" | "class",
          itemId,
          userId,          // FIX: personal QR linked to buyer
          orderId,         // FIX: linked to the specific order
          code: qrValue,
          qrData: qrCodeImage,
        });

        console.log(`[Webhook] Personal QR code saved for user ${userId}, ${itemType} ${itemId}`);
      } catch (qrError) {
        console.error("[Webhook] Error generating QR code:", qrError);
      }

      // Send email with QR code to user
      try {
        // Get user email from database (more reliable than metadata)
        const [userRecord] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const userEmail = userRecord?.email || metadata.customer_email || "";
        const userName = userRecord?.name || metadata.customer_name || "Customer";

        // Get item title and date for the email
        let itemName = metadata.item_name || itemType;
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

        if (userEmail && qrCodeImage) {
          await sendQRCodeEmail({
            to: userEmail,
            userName,
            itemType: itemType as "event" | "class",
            itemName,
            qrCodeImage,
            // FIX: Use the actual saved codes, not newly generated random ones
            ticketCode: itemType === "event" ? ticketCode : undefined,
            accessCode: itemType === "class" ? accessCode : undefined,
            eventDate,
            eventTime,
          });
          console.log(`[Webhook] QR code email sent to ${userEmail} for ${itemType} ${itemId}`);
        } else {
          console.warn(`[Webhook] Could not send email: email=${userEmail}, hasQR=${!!qrCodeImage}`);
        }
      } catch (emailError) {
        console.error("[Webhook] Error sending QR code email:", emailError);
      }
    }

    console.log(`[Webhook] Payment completed for user ${userId}, order ID: ${orderId}`);
  } catch (error: any) {
    console.error("[Webhook] Error creating purchase records:", error);
    throw error;
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] Payment intent succeeded: ${paymentIntent.id}`);
  // Additional processing if needed beyond checkout.session.completed
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  const metadata = paymentIntent.metadata || {};
  const userId = metadata.user_id ? parseInt(metadata.user_id) : null;
  const itemType = metadata[PRODUCT_METADATA.ITEM_TYPE];
  const itemId = metadata[PRODUCT_METADATA.ITEM_ID] ? parseInt(metadata[PRODUCT_METADATA.ITEM_ID]) : null;

  if (userId && itemType && itemId) {
    try {
      await db.insert(orders).values({
        userId,
        stripePaymentIntentId: paymentIntent.id,
        amount: ((paymentIntent.amount / 100).toFixed(2)) as any,
        currency: (paymentIntent.currency || "gbp").toUpperCase(),
        status: "failed",
        itemType: itemType as "event" | "course" | "class",
        itemId,
      });

      console.log(`[Webhook] Payment failed recorded for user ${userId}`);
    } catch (error: any) {
      console.error("[Webhook] Error recording failed payment:", error);
    }
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  console.log(`[Webhook] Charge refunded: ${charge.id}`);
  // Update order status to cancelled if needed
  // This would require querying by payment intent ID
}

/**
 * Generate unique ticket code
 */
function generateTicketCode(): string {
  return `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Generate unique access code
 */
function generateAccessCode(): string {
  return `ACCESS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}
