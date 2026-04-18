import Stripe from "stripe";
import { Request, Response } from "express";
import { eq, sql } from "drizzle-orm";
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

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        try {
          const db = await getDb();
          if (!db) break;
          const [u] = await db.select().from(users).where(eq(users.stripeAccountId, account.id)).limit(1);
          if (u) {
            const chargesEnabled = !!account.charges_enabled;
            const payoutsEnabled = !!account.payouts_enabled;
            const hasRequirements = (account.requirements?.currently_due?.length ?? 0) > 0
              || (account.requirements?.past_due?.length ?? 0) > 0;
            const status = chargesEnabled && payoutsEnabled && !hasRequirements
              ? "verified"
              : account.details_submitted && hasRequirements
                ? "restricted"
                : "pending";

            const updateData: any = {
              stripeAccountStatus: status,
              stripeChargesEnabled: chargesEnabled,
              stripePayoutsEnabled: payoutsEnabled,
            };
            if (status === "verified" && !u.stripeOnboardedAt) {
              updateData.stripeOnboardedAt = new Date();
            }
            await db.update(users).set(updateData).where(eq(users.id, u.id));
            console.log(`[Webhook] Synced Stripe account ${account.id} -> status=${status}`);
          }
        } catch (e) {
          console.error("[Webhook] account.updated sync failed:", e);
        }
        break;
      }

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
 * Handle multi-item cart checkout
 */
async function handleMultiItemCartCheckout(
  session: Stripe.Checkout.Session,
  db: any,
  userId: number | null,
  livemode: boolean
) {
  if (!userId) {
    console.error("[Webhook] ❌ No user ID for multi-item cart");
    return;
  }

  const metadata = session.metadata || {};
  const cartItemsJson = metadata.cart_items;

  if (!cartItemsJson) {
    console.error("[Webhook] ❌ No cart_items in metadata");
    return;
  }

  let cartItems: Array<{type: string, id: number, title: string, price: number, quantity?: number}> = [];

  try {
    cartItems = JSON.parse(cartItemsJson);
  } catch (e) {
    console.error("[Webhook] ❌ Failed to parse cart_items:", e);
    return;
  }

  console.log(`[Webhook] 🛒 Processing ${cartItems.length} items from cart`);

  const totalAmount = session.amount_total ? (session.amount_total / 100).toFixed(2) : "0";
  const currency = (session.currency || "gbp").toUpperCase();

  // Process each item in the cart
  for (const item of cartItems) {
    const itemType = item.type as "event" | "course" | "class";
    const itemId = item.id;
    const quantity = (item.quantity || 1);
    const itemPrice = item.price;

    try {
      // Create order record for each item
      const [order] = await db.insert(orders).values({
        userId,
        stripePaymentIntentId: session.payment_intent as string,
        amount: (itemPrice * quantity).toFixed(2) as any,
        currency,
        status: "completed",
        itemType,
        itemId,
        livemode,
      }).returning({ id: orders.id });

      const orderId = order.id;
      console.log(`[Webhook] ✅ Order created #${orderId} - ${livemode ? 'LIVE' : 'TEST'} - ${itemType} #${itemId} x${quantity} - £${(itemPrice * quantity).toFixed(2)}`);

      // ─── Calculate Earnings ──────────────────────────────────────────────
      let creatorUserId: number | null = null;
      let platformFeeGBP = 0;
      let instructorEarningsGBP = 0;
      let netEarningsPence = Math.round(itemPrice * quantity * 100);

      try {
        let sellerPlan: string = "starter";
        let sellerRole: string = "user";

        if (itemType === "event") {
          const [event] = await db.select({ creatorId: events.creatorId }).from(events).where(eq(events.id, itemId)).limit(1);
          creatorUserId = event?.creatorId || null;
          if (creatorUserId) {
            const [u] = await db.select({ subscriptionPlan: users.subscriptionPlan, role: users.role }).from(users).where(eq(users.id, creatorUserId)).limit(1);
            sellerPlan = u?.subscriptionPlan || "starter";
            sellerRole = u?.role || "user";
          }
        } else if (itemType === "course") {
          const [course] = await db.select({ instructorId: courses.instructorId }).from(courses).where(eq(courses.id, itemId)).limit(1);
          if (course) {
            const [instr] = await db.select({ userId: instructors.userId }).from(instructors).where(eq(instructors.id, course.instructorId)).limit(1);
            creatorUserId = instr?.userId || null;
            if (creatorUserId) {
              const [u] = await db.select({ subscriptionPlan: users.subscriptionPlan, role: users.role }).from(users).where(eq(users.id, creatorUserId)).limit(1);
              sellerPlan = u?.subscriptionPlan || "starter";
              sellerRole = u?.role || "user";
            }
          }
        } else if (itemType === "class") {
          const [classItem] = await db.select({ instructorId: classes.instructorId }).from(classes).where(eq(classes.id, itemId)).limit(1);
          if (classItem) {
            const [instr] = await db.select({ userId: instructors.userId }).from(instructors).where(eq(instructors.id, classItem.instructorId)).limit(1);
            creatorUserId = instr?.userId || null;
            if (creatorUserId) {
              const [u] = await db.select({ subscriptionPlan: users.subscriptionPlan, role: users.role }).from(users).where(eq(users.id, creatorUserId)).limit(1);
              sellerPlan = u?.subscriptionPlan || "starter";
              sellerRole = u?.role || "user";
            }
          }
        }

        if (creatorUserId && netEarningsPence > 0) {
          // ADMIN USERS PAY ZERO PLATFORM FEE (only Stripe fees)
          let commissionRate = 0;

          if (sellerRole === "admin") {
            // Admins pay 0% platform commission
            commissionRate = 0;
            console.log(`[Webhook] 👑 ADMIN detected - Zero platform fee for ${itemType} #${itemId}`);
          } else {
            // Regular users pay commission based on their plan
            const planDef = PLANS[sellerPlan as PlanKey] || PLANS.starter;
            if (itemType === "course") {
              commissionRate = planDef.courseCommissionRate;
            } else if (itemType === "event" || itemType === "class") {
              commissionRate = planDef.commissionRate;
            }
          }

          const commissionPence = Math.round(netEarningsPence * commissionRate);
          platformFeeGBP = commissionPence / 100;
          instructorEarningsGBP = (netEarningsPence - commissionPence) / 100;

          console.log(`[Webhook] 💰 ${livemode ? 'LIVE' : 'TEST'} EARNINGS - ${itemType} #${itemId} | Role: ${sellerRole} | Price: £${(netEarningsPence/100).toFixed(2)} | Fee: £${platformFeeGBP.toFixed(2)} (${(commissionRate*100).toFixed(1)}%) | Instructor: £${instructorEarningsGBP.toFixed(2)}`);

          // Check if there's a collaborator for this item
          const { collaborators } = await import("../../drizzle/schema");
          const { and: andOp } = await import("drizzle-orm");
          const [collaboratorRecord] = await db.select()
            .from(collaborators)
            .where(andOp(
              eq(collaborators.itemType, itemType),
              eq(collaborators.itemId, itemId)
            ))
            .limit(1);

          if (collaboratorRecord) {
            // Split earnings between creator and collaborator
            const creatorEarnings = (instructorEarningsGBP * collaboratorRecord.creatorPercentage) / 100;
            const collaboratorEarnings = (instructorEarningsGBP * collaboratorRecord.collaboratorPercentage) / 100;

            console.log(`[Webhook] 🤝 SPLIT EARNINGS - Creator (${collaboratorRecord.creatorPercentage}%): £${creatorEarnings.toFixed(2)} | Collaborator (${collaboratorRecord.collaboratorPercentage}%): £${collaboratorEarnings.toFixed(2)}`);

            // Record earnings for creator
            await addEarnings({
              userId: creatorUserId,
              amount: creatorEarnings,
              description: `${livemode ? 'Sale' : 'Test Sale'}: ${item.title} (${collaboratorRecord.creatorPercentage}% split) (#${orderId})`,
              orderId: orderId,
            });

            // Record earnings for collaborator
            await addEarnings({
              userId: collaboratorRecord.collaboratorId,
              amount: collaboratorEarnings,
              description: `${livemode ? 'Sale' : 'Test Sale'}: ${item.title} (${collaboratorRecord.collaboratorPercentage}% split) (#${orderId})`,
              orderId: orderId,
            });
          } else {
            // No collaborator - all earnings go to creator
            await addEarnings({
              userId: creatorUserId,
              amount: instructorEarningsGBP,
              description: `${livemode ? 'Sale' : 'Test Sale'}: ${item.title} (#${orderId})`,
              orderId: orderId,
            });
          }
        } else {
          console.log(`[Webhook] ⚠️  No earnings - Mode: ${livemode ? 'LIVE' : 'TEST'}, Creator: ${creatorUserId || 'NULL'}, ${itemType} #${itemId}`);
        }
      } catch (earningsError) {
        console.error(`[Webhook] ❌ Error calculating earnings for ${itemType} #${itemId}:`, earningsError);
      }
      // ─────────────────────────────────────────────────────────────────────

      // Create purchase records based on item type
      let ticketCode: string | undefined;
      let accessCode: string | undefined;

      switch (itemType) {
        case "event":
          ticketCode = generateTicketCode();
          await db.insert(eventTickets).values({
            userId,
            eventId: itemId,
            orderId,
            quantity,
            instructorId: creatorUserId,
            pricePaid: (itemPrice * quantity).toFixed(2) as any,
            platformFee: platformFeeGBP.toFixed(2) as any,
            instructorEarnings: instructorEarningsGBP.toFixed(2) as any,
            ticketCode,
            status: "valid",
          });
          console.log(`[Webhook] ✅ Event ticket created for event #${itemId}`);

          // Update ticketsSold count in events table
          await db.update(events)
            .set({
              ticketsSold: sql`COALESCE(${events.ticketsSold}, 0) + ${quantity}`
            })
            .where(eq(events.id, itemId));
          console.log(`[Webhook] ✅ Updated ticketsSold for event #${itemId} (+${quantity})`);
          break;

        case "course":
          await db.insert(coursePurchases).values({
            userId,
            courseId: itemId,
            instructorId: creatorUserId,
            orderId,
            pricePaid: itemPrice.toFixed(2) as any,
            platformFee: platformFeeGBP.toFixed(2) as any,
            instructorEarnings: instructorEarningsGBP.toFixed(2) as any,
            progress: 0,
            completed: false,
          });
          console.log(`[Webhook] ✅ Course purchase created for course #${itemId}`);
          break;

        case "class":
          accessCode = generateAccessCode();
          await db.insert(classPurchases).values({
            userId,
            classId: itemId,
            instructorId: creatorUserId,
            orderId,
            pricePaid: itemPrice.toFixed(2) as any,
            platformFee: platformFeeGBP.toFixed(2) as any,
            instructorEarnings: instructorEarningsGBP.toFixed(2) as any,
            accessCode,
            status: "active",
          });
          console.log(`[Webhook] ✅ Class purchase created for class #${itemId}`);
          break;
      }

      // Generate QR codes for events and classes
      if (itemType === "event" || itemType === "class") {
        const qrValue = itemType === "event"
          ? `event-${itemId}-user-${userId}-order-${orderId}`
          : `class-${itemId}-user-${userId}-order-${orderId}`;

        try {
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

          console.log(`[Webhook] ✅ QR code saved for ${itemType} #${itemId}`);

          // Send email with QR code
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

            console.log(`[Webhook] ✅ QR code email sent to ${userEmail} for ${itemType} #${itemId}`);
          }
        } catch (qrError) {
          console.error(`[Webhook] ❌ Error generating/sending QR for ${itemType} #${itemId}:`, qrError);
        }
      }
    } catch (error) {
      console.error(`[Webhook] ❌ Error processing cart item ${itemType} #${itemId}:`, error);
    }
  }

  console.log(`[Webhook] ✅ Multi-item cart processed successfully for user ${userId}`);
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
  const livemode = session.livemode; // Capture test vs production mode

  // Check if this is a multi-item cart purchase
  if (metadata.is_multi_item_cart === "true") {
    console.log(`[Webhook] 🛒 Processing multi-item cart checkout - Mode: ${livemode ? 'LIVE' : 'TEST'}, User: ${userId}`);
    await handleMultiItemCartCheckout(session, db, userId, livemode);
    return;
  }

  // Single item purchase (legacy flow)
  const itemType = metadata[PRODUCT_METADATA.ITEM_TYPE];
  const itemId = metadata[PRODUCT_METADATA.ITEM_ID] ? parseInt(metadata[PRODUCT_METADATA.ITEM_ID]) : null;

  console.log(`[Webhook] 🔍 Processing single-item checkout - Mode: ${livemode ? 'LIVE' : 'TEST'}, User: ${userId}, Type: ${itemType}, Item: ${itemId}`);

  if (!userId || !itemType || !itemId) {
    console.error("[Webhook] ❌ Missing required metadata:", { userId, itemType, itemId, livemode });
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
      livemode, // Store test vs production mode
    }).returning({ id: orders.id });

    const orderId = order.id;
    console.log(`[Webhook] ✅ Order created #${orderId} - ${livemode ? 'LIVE' : 'TEST'} - ${itemType} - £${amount}`);

    // ─── Financial Payout Logic ──────────────────────────────────────────────
    try {
      let creatorUserId: number | null = null;
      let netEarningsPence = 0;
      let sellerPlan: string = "starter";
      let sellerRole: string = "user";

      if (itemType === "event") {
        const [event] = await db.select({ creatorId: events.creatorId }).from(events).where(eq(events.id, itemId)).limit(1);
        creatorUserId = event?.creatorId || null;
        if (creatorUserId) {
          const [u] = await db.select({ subscriptionPlan: users.subscriptionPlan, role: users.role }).from(users).where(eq(users.id, creatorUserId)).limit(1);
          sellerPlan = u?.subscriptionPlan || "starter";
          sellerRole = u?.role || "user";
        }
        // Precio del ticket SIN incluir el Stripe fee (el cliente ya lo pagó aparte)
        const ticketPricePence = parseInt(metadata.ticket_price_pence || "0");
        const quantity = metadata.quantity ? parseInt(metadata.quantity) : 1;
        netEarningsPence = ticketPricePence * quantity;
      } else if (itemType === "course") {
        const [course] = await db.select({ instructorId: courses.instructorId }).from(courses).where(eq(courses.id, itemId)).limit(1);
        if (course) {
          const [instr] = await db.select({ userId: instructors.userId }).from(instructors).where(eq(instructors.id, course.instructorId)).limit(1);
          creatorUserId = instr?.userId || null;
          if (creatorUserId) {
            const [u] = await db.select({ subscriptionPlan: users.subscriptionPlan, role: users.role }).from(users).where(eq(users.id, creatorUserId)).limit(1);
            sellerPlan = u?.subscriptionPlan || "starter";
            sellerRole = u?.role || "user";
          }
          // Precio del curso SIN incluir el Stripe fee (el cliente ya lo pagó aparte)
          netEarningsPence = parseInt(metadata.ticket_price_pence || "0");
        }
      } else if (itemType === "class") {
        const [classItem] = await db.select({ instructorId: classes.instructorId }).from(classes).where(eq(classes.id, itemId)).limit(1);
        if (classItem) {
          const [instr] = await db.select({ userId: instructors.userId }).from(instructors).where(eq(instructors.id, classItem.instructorId)).limit(1);
          creatorUserId = instr?.userId || null;
          if (creatorUserId) {
            const [u] = await db.select({ subscriptionPlan: users.subscriptionPlan, role: users.role }).from(users).where(eq(users.id, creatorUserId)).limit(1);
            sellerPlan = u?.subscriptionPlan || "starter";
            sellerRole = u?.role || "user";
          }
          // Precio de la clase SIN incluir el Stripe fee (el cliente ya lo pagó aparte)
          netEarningsPence = parseInt(metadata.ticket_price_pence || "0");
        }
      }

      if (creatorUserId && netEarningsPence > 0) {
        // ADMIN USERS PAY ZERO PLATFORM FEE (only Stripe fees)
        let commissionRate = 0;

        if (sellerRole === "admin") {
          // Admins pay 0% platform commission
          commissionRate = 0;
          console.log(`[Webhook] 👑 ADMIN detected - Zero platform fee for ${itemType} #${itemId}`);
        } else {
          // Regular users pay commission based on their plan
          const planDef = PLANS[sellerPlan as PlanKey] || PLANS.starter;
          if (itemType === "course") {
            commissionRate = planDef.courseCommissionRate;
          } else if (itemType === "event" || itemType === "class") {
            commissionRate = planDef.commissionRate; // Event/class commission rate
          }
        }

        // NEW MODEL: Only deduct platform fee from instructor (client already paid Stripe fee)
        const commissionPence = Math.round(netEarningsPence * commissionRate);
        const platformFeeGBP = commissionPence / 100;
        const instructorEarningsGBP = (netEarningsPence - commissionPence) / 100;

        console.log(`[Webhook] 💰 ${livemode ? 'LIVE' : 'TEST'} EARNINGS - ${itemType} #${itemId} | Role: ${sellerRole} | Plan: ${sellerPlan} | Price: £${(netEarningsPence/100).toFixed(2)} | Fee: £${platformFeeGBP.toFixed(2)} (${(commissionRate*100).toFixed(1)}%) | Instructor: £${instructorEarningsGBP.toFixed(2)}`);

        // Check if there's a collaborator for this item
        const { collaborators } = await import("../../drizzle/schema");
        const { and } = await import("drizzle-orm");
        const [collaboratorRecord] = await db.select()
          .from(collaborators)
          .where(and(
            eq(collaborators.itemType, itemType),
            eq(collaborators.itemId, itemId)
          ))
          .limit(1);

        if (collaboratorRecord) {
          // Split earnings between creator and collaborator
          const creatorEarnings = (instructorEarningsGBP * collaboratorRecord.creatorPercentage) / 100;
          const collaboratorEarnings = (instructorEarningsGBP * collaboratorRecord.collaboratorPercentage) / 100;

          console.log(`[Webhook] 🤝 SPLIT EARNINGS - Creator (${collaboratorRecord.creatorPercentage}%): £${creatorEarnings.toFixed(2)} | Collaborator (${collaboratorRecord.collaboratorPercentage}%): £${collaboratorEarnings.toFixed(2)}`);

          // Record earnings for creator
          await addEarnings({
            userId: creatorUserId,
            amount: creatorEarnings,
            description: `${livemode ? 'Sale' : 'Test Sale'}: ${metadata.item_name || itemType} (${collaboratorRecord.creatorPercentage}% split) (#${orderId})`,
            orderId: orderId,
          });

          // Record earnings for collaborator
          await addEarnings({
            userId: collaboratorRecord.collaboratorId,
            amount: collaboratorEarnings,
            description: `${livemode ? 'Sale' : 'Test Sale'}: ${metadata.item_name || itemType} (${collaboratorRecord.collaboratorPercentage}% split) (#${orderId})`,
            orderId: orderId,
          });
        } else {
          // No collaborator - all earnings go to creator
          await addEarnings({
            userId: creatorUserId,
            amount: instructorEarningsGBP,
            description: `${livemode ? 'Sale' : 'Test Sale'}: ${metadata.item_name || itemType} (#${orderId})`,
            orderId: orderId,
          });
        }

        // Store financial details in purchase record later (sharing scope)
        (metadata as any)._calculated_platform_fee = platformFeeGBP;
        (metadata as any)._calculated_instructor_earnings = instructorEarningsGBP;
        (metadata as any)._creator_user_id = creatorUserId;

        console.log(`[Webhook] ✅ ${livemode ? 'LIVE' : 'TEST'} EARNINGS - Item: ${itemType} | Ticket Price: £${(netEarningsPence/100).toFixed(2)} | Platform Fee: £${platformFeeGBP.toFixed(2)} (${(commissionRate*100).toFixed(1)}%) | Instructor Earnings: £${instructorEarningsGBP.toFixed(2)} | NOTE: Stripe fee (${metadata.stripe_fee_pence ? '£' + (parseInt(metadata.stripe_fee_pence)/100).toFixed(2) : 'N/A'}) was paid by client`);
      } else {
        console.error(`[Webhook] ❌ No earnings recorded - Mode: ${livemode ? 'LIVE' : 'TEST'}, creatorUserId: ${creatorUserId}, netEarnings: ${netEarningsPence}p, itemType: ${itemType}, metadata: ${JSON.stringify(metadata)}`);
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
        const eventQuantity = metadata.quantity ? parseInt(metadata.quantity) : 1;
        await db.insert(eventTickets).values({
          userId,
          eventId: itemId,
          orderId,
          quantity: eventQuantity,
          instructorId: (metadata as any)._creator_user_id,
          pricePaid: (parseInt(metadata.ticket_price_pence || "0") * eventQuantity / 100).toFixed(2) as any,
          platformFee: ((metadata as any)._calculated_platform_fee || 0).toFixed(2) as any,
          instructorEarnings: ((metadata as any)._calculated_instructor_earnings || 0).toFixed(2) as any,
          ticketCode,
          status: "valid",
        });
        console.log(`[Webhook] Event ticket created for user ${userId}, event ${itemId}`);

        // Update ticketsSold count in events table
        await db.update(events)
          .set({
            ticketsSold: sql`COALESCE(${events.ticketsSold}, 0) + ${eventQuantity}`
          })
          .where(eq(events.id, itemId));
        console.log(`[Webhook] ✅ Updated ticketsSold for event #${itemId} (+${eventQuantity})`);
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
