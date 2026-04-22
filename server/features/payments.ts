import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orders, eventTickets, coursePurchases, classPurchases, qrCodes, events, courses, classes, users, instructors } from "../../drizzle/schema";
import { and } from "drizzle-orm";
import { sendQRCodeEmail, sendOrderConfirmationEmail } from "./email";
import { generateInvoicePdf } from "./invoicePdf";
import QRCode from "qrcode";
import { eq, desc } from "drizzle-orm";
import Stripe from "stripe";
import { calculateCheckoutAmounts, getPlan } from "../stripe/plans";
import { subscriptions } from "../../drizzle/schema";
import { generateTicketCode, generateAccessCode } from "../lib/ticketCodes";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any,
});


export const paymentsRouter = router({
  /**
   * Create Stripe checkout session for an event ticket
   */
  createEventCheckout: protectedProcedure
    .input(z.object({
      eventId: z.number(),
      quantity: z.number().min(1).max(10).default(1),
      rrpCode: z.string().trim().max(32).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get event details
      const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      if (!event) throw new Error("Evento no encontrado");
      if (event.status !== "published") throw new Error("Este evento no está disponible");

      // Check ticket availability
      if (event.maxTickets && event.ticketsSold !== null && event.ticketsSold >= event.maxTickets) {
        throw new Error("Entradas agotadas");
      }

      const originalUnitPrice = Math.round(parseFloat(String(event.ticketPrice)) * 100); // pence
      let unitPrice = originalUnitPrice;
      let rrpAttribution: { rrpUserId: number; customerDiscountPct: number; rrpCommissionPct: number } | null = null;

      // RRP code validation + discount application
      if (input.rrpCode) {
        const { rrpProfiles, eventRrps } = await import("../../drizzle/schema");
        const normalized = input.rrpCode.trim().toUpperCase();
        const [profile] = await db.select().from(rrpProfiles)
          .where(and(eq(rrpProfiles.code, normalized), eq(rrpProfiles.active, true)))
          .limit(1);
        if (profile) {
          const [assignment] = await db.select().from(eventRrps)
            .where(and(
              eq(eventRrps.eventId, event.id),
              eq(eventRrps.rrpUserId, profile.userId),
              eq(eventRrps.active, true),
            ))
            .limit(1);
          if (assignment) {
            const discountPence = Math.round(originalUnitPrice * assignment.customerDiscountPct / 100);
            unitPrice = Math.max(0, originalUnitPrice - discountPence);
            rrpAttribution = {
              rrpUserId: profile.userId,
              customerDiscountPct: assignment.customerDiscountPct,
              rrpCommissionPct: assignment.rrpCommissionPct,
            };
          }
        }
      }

      const origin = ctx.req.headers.origin || "https://consabor.uk";

      // Determine seller's plan for commission rate (fees computed on discounted price)
      const creatorId = event.creatorId || 0;
      const [creatorRow] = await db.select({ subscriptionPlan: users.subscriptionPlan, stripeAccountId: users.stripeAccountId })
        .from(users).where(eq(users.id, creatorId)).limit(1);

      const fees = calculateCheckoutAmounts(unitPrice, (creatorRow?.subscriptionPlan as any) ?? "starter");

      const eventDateStr = new Date(event.eventDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      const payment_intent_data = creatorRow?.stripeAccountId ? {
        application_fee_amount: fees.platformFeePence + fees.stripeFeePence,
        transfer_data: { destination: creatorRow.stripeAccountId },
      } : undefined;

      const session = await stripe.checkout.sessions.create({
        ...(payment_intent_data ? { payment_intent_data } : {}),
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: `🎉 ${event.title}`,
                description: `Ticket for ${event.title} — ${eventDateStr}`,
                ...(event.imageUrl ? { images: [event.imageUrl] } : {}),
              },
              unit_amount: fees.ticketPricePence,
            },
            quantity: input.quantity,
          },
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: "Processing fee",
                description: "Stripe card processing fee",
              },
              unit_amount: fees.stripeFeePence,
            },
            quantity: input.quantity,
          },
        ],
        mode: "payment",
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/events/${event.id}`,
        client_reference_id: ctx.user.id.toString(),
        customer_email: ctx.user.email || undefined,
        metadata: {
          user_id: ctx.user.id.toString(),
          item_type: "event",
          item_id: event.id.toString(),
          quantity: input.quantity.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
          ticket_price_pence: fees.ticketPricePence.toString(),
          platform_fee_pence: fees.platformFeePence.toString(),
          stripe_fee_pence: fees.stripeFeePence.toString(),
          original_price_pence: originalUnitPrice.toString(),
          ...(rrpAttribution ? {
            rrp_user_id: String(rrpAttribution.rrpUserId),
            rrp_customer_discount_pct: String(rrpAttribution.customerDiscountPct),
            rrp_commission_pct: String(rrpAttribution.rrpCommissionPct),
          } : {}),
        },
      });

      return { checkoutUrl: session.url };
    }),

  /**
   * Create Stripe checkout session for a course
   */
  createCourseCheckout: protectedProcedure
    .input(z.object({
      courseId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get course details
      const [course] = await db.select().from(courses).where(eq(courses.id, input.courseId)).limit(1);
      if (!course) throw new Error("Curso no encontrado");
      if (course.status !== "published") throw new Error("Este curso no está disponible");

      // Check if already purchased
      const existing = await db.select().from(coursePurchases)
        .where(and(eq(coursePurchases.userId, ctx.user.id), eq(coursePurchases.courseId, input.courseId)))
        .limit(1);
      if (existing.length > 0) throw new Error("Ya tienes acceso a este curso");

      const price = Math.round(parseFloat(String(course.price)) * 100);
      const origin = ctx.req.headers.origin || "https://consabor.uk";

      // Get instructor's user to determine seller's plan config
      const [instructorData] = await db.select({ userId: instructors.userId })
        .from(instructors).where(eq(instructors.id, course.instructorId)).limit(1);

      const creatorId = instructorData?.userId || 0;
      const [creatorRow] = await db.select({ subscriptionPlan: users.subscriptionPlan, stripeAccountId: users.stripeAccountId })
        .from(users).where(eq(users.id, creatorId)).limit(1);

      const fees = calculateCheckoutAmounts(price, (creatorRow?.subscriptionPlan as any) ?? "starter", true);

      const payment_intent_data = creatorRow?.stripeAccountId ? {
        application_fee_amount: fees.platformFeePence + fees.stripeFeePence,
        transfer_data: { destination: creatorRow.stripeAccountId },
      } : undefined;

      const session = await stripe.checkout.sessions.create({
        ...(payment_intent_data ? { payment_intent_data } : {}),
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: `📚 ${course.title}`,
                description: `Online course: ${course.title}${course.danceStyle ? ` — ${course.danceStyle}` : ""}`,
                ...(course.imageUrl ? { images: [course.imageUrl] } : {}),
              },
              unit_amount: fees.ticketPricePence,
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: "Processing fee",
                description: "Stripe card processing fee",
              },
              unit_amount: fees.stripeFeePence,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/courses/${course.id}`,
        client_reference_id: ctx.user.id.toString(),
        customer_email: ctx.user.email || undefined,
        metadata: {
          user_id: ctx.user.id.toString(),
          item_type: "course",
          item_id: course.id.toString(),
          quantity: "1",
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
          ticket_price_pence: fees.ticketPricePence.toString(),
          platform_fee_pence: fees.platformFeePence.toString(),
          stripe_fee_pence: fees.stripeFeePence.toString(),
        },
      });

      return { checkoutUrl: session.url };
    }),

  /**
   * Create Stripe checkout session for a class
   */
  createClassCheckout: protectedProcedure
    .input(z.object({
      classId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get class details
      const [classItem] = await db.select().from(classes).where(eq(classes.id, input.classId)).limit(1);
      if (!classItem) throw new Error("Clase no encontrada");
      if (classItem.status !== "published") throw new Error("Esta clase no está disponible");

      // Check capacity
      if (classItem.maxParticipants && classItem.currentParticipants !== null && classItem.currentParticipants >= classItem.maxParticipants) {
        throw new Error("Clase llena - no hay plazas disponibles");
      }

      // Check if already purchased
      const existing = await db.select().from(classPurchases)
        .where(and(eq(classPurchases.userId, ctx.user.id), eq(classPurchases.classId, input.classId)))
        .limit(1);
      if (existing.length > 0) throw new Error("Ya tienes acceso a esta clase");

      const price = Math.round(parseFloat(String(classItem.price)) * 100);
      const origin = ctx.req.headers.origin || "https://consabor.uk";

      const [instructorData] = await db.select({ userId: instructors.userId })
        .from(instructors).where(eq(instructors.id, classItem.instructorId)).limit(1);

      const creatorId = instructorData?.userId || 0;
      const [creatorRow] = await db.select({ subscriptionPlan: users.subscriptionPlan, stripeAccountId: users.stripeAccountId })
        .from(users).where(eq(users.id, creatorId)).limit(1);

      const fees = calculateCheckoutAmounts(price, (creatorRow?.subscriptionPlan as any) ?? "starter");

      const classDateStr = new Date(classItem.classDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      const payment_intent_data = creatorRow?.stripeAccountId ? {
        application_fee_amount: fees.platformFeePence + fees.stripeFeePence,
        transfer_data: { destination: creatorRow.stripeAccountId },
      } : undefined;

      const session = await stripe.checkout.sessions.create({
        ...(payment_intent_data ? { payment_intent_data } : {}),
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: `💃 ${classItem.title}`,
                description: `Class: ${classItem.title} — ${classDateStr}`,
              },
              unit_amount: fees.ticketPricePence,
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: "Processing fee",
                description: "Stripe card processing fee",
              },
              unit_amount: fees.stripeFeePence,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/classes/${classItem.id}`,
        client_reference_id: ctx.user.id.toString(),
        customer_email: ctx.user.email || undefined,
        metadata: {
          user_id: ctx.user.id.toString(),
          item_type: "class",
          item_id: classItem.id.toString(),
          quantity: "1",
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
          ticket_price_pence: fees.ticketPricePence.toString(),
          platform_fee_pence: fees.platformFeePence.toString(),
          stripe_fee_pence: fees.stripeFeePence.toString(),
        },
      });

      return { checkoutUrl: session.url };
    }),

  /**
   * Verify a checkout session and return purchase details
   */
  verifySession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);
        if (session.payment_status !== "paid") {
          return { success: false, message: "Pago no completado" };
        }

        const metadata = session.metadata || {};
        return {
          success: true,
          itemType: metadata.item_type,
          itemId: parseInt(metadata.item_id || "0"),
          amount: (session.amount_total || 0) / 100,
          currency: session.currency?.toUpperCase() || "GBP",
        };
      } catch {
        return { success: false, message: "Sesión no encontrada" };
      }
    }),

  /**
   * Get user's purchase history
   */
  getUserOrders: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(orders)
      .where(eq(orders.userId, ctx.user.id))
      .orderBy(desc(orders.createdAt));

    // Enrich each order with item details (title, image, date)
    const enriched = await Promise.all(
      result.map(async (order) => {
        let itemTitle: string | null = null;
        let itemImageUrl: string | null = null;
        let itemDate: Date | null = null;
        let itemSlug: string | null = null;

        try {
          if (order.itemType === "event") {
            const [item] = await db.select({ title: events.title, imageUrl: events.imageUrl, eventDate: events.eventDate })
              .from(events).where(eq(events.id, order.itemId)).limit(1);
            if (item) { itemTitle = item.title; itemImageUrl = item.imageUrl; itemDate = item.eventDate; itemSlug = `/events/${order.itemId}`; }
          } else if (order.itemType === "course") {
            const [item] = await db.select({ title: courses.title, imageUrl: courses.imageUrl })
              .from(courses).where(eq(courses.id, order.itemId)).limit(1);
            if (item) { itemTitle = item.title; itemImageUrl = item.imageUrl; itemSlug = `/courses/${order.itemId}`; }
          } else if (order.itemType === "class") {
            const [item] = await db.select({ title: classes.title, imageUrl: classes.imageUrl, classDate: classes.classDate })
              .from(classes).where(eq(classes.id, order.itemId)).limit(1);
            if (item) { itemTitle = item.title; itemImageUrl = item.imageUrl; itemDate = item.classDate; itemSlug = `/classes/${order.itemId}`; }
          }
        } catch (e) {
          // Silently ignore if item was deleted
        }

        return { ...order, itemTitle, itemImageUrl, itemDate, itemSlug };
      })
    );

    return enriched;
  }),

  /**
   * Get user's event tickets with event details
   */
  getUserTickets: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const tickets = await db.select().from(eventTickets)
      .where(eq(eventTickets.userId, ctx.user.id));

    // Get event details for each ticket
    const ticketsWithEvents = await Promise.all(
      tickets.map(async (ticket) => {
        const [event] = await db.select().from(events).where(eq(events.id, ticket.eventId)).limit(1);
        return { ...ticket, event };
      })
    );

    return ticketsWithEvents;
  }),

  /**
   * Get user's purchased courses with course details
   */
  getUserCourses: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const purchases = await db.select().from(coursePurchases)
      .where(eq(coursePurchases.userId, ctx.user.id));

    const purchasesWithCourses = await Promise.all(
      purchases.map(async (purchase) => {
        const [course] = await db.select().from(courses).where(eq(courses.id, purchase.courseId)).limit(1);
        return { ...purchase, course };
      })
    );

    return purchasesWithCourses;
  }),

  /**
   * Get user's purchased classes with class details
   */
  getUserClasses: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const purchases = await db.select().from(classPurchases)
      .where(eq(classPurchases.userId, ctx.user.id));

    const purchasesWithClasses = await Promise.all(
      purchases.map(async (purchase) => {
        const [classItem] = await db.select().from(classes).where(eq(classes.id, purchase.classId)).limit(1);
        return { ...purchase, classItem };
      })
    );

    return purchasesWithClasses;
  }),

  /**
   * Resend QR code to user's email
   */
  resendQREmail: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      itemType: z.enum(["event", "class"]),
      itemId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the QR code for this order
      const [qrCode] = await db
        .select()
        .from(qrCodes)
        .where(
          and(
            eq(qrCodes.orderId, input.orderId),
            eq(qrCodes.itemType, input.itemType),
            eq(qrCodes.itemId, input.itemId),
            eq(qrCodes.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!qrCode) throw new Error("QR code not found");

      // Get item details for email
      let itemTitle = "Your Purchase";
      if (input.itemType === "event") {
        const [event] = await db.select().from(events).where(eq(events.id, input.itemId)).limit(1);
        itemTitle = event?.title || "Event";
      } else if (input.itemType === "class") {
        const [classItem] = await db.select().from(classes).where(eq(classes.id, input.itemId)).limit(1);
        itemTitle = classItem?.title || "Class";
      }

      // Send email with QR code
      if (!ctx.user.email) throw new Error("User email not found");
      await sendQRCodeEmail({
        to: ctx.user.email,
        userName: ctx.user.name || "Dancer",
        itemType: input.itemType,
        itemName: itemTitle,
        qrCodeImage: qrCode.qrData,
        ticketCode: input.itemType === "event" ? qrCode.code : undefined,
        accessCode: input.itemType === "class" ? qrCode.code : undefined,
      });

      return { success: true, message: "QR code sent to your email" };
    }),

  /**
   * Generate and return an invoice PDF for a given order (on-demand download).
   * Returns a base64-encoded PDF so the frontend can trigger a browser download.
   */
  downloadInvoice: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify the order belongs to this user
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, input.orderId), eq(orders.userId, ctx.user.id)))
        .limit(1);
      if (!order) throw new Error("Order not found");

      // Fetch item details
      let itemTitle = "Purchase";
      let itemDate: string | undefined;
      let itemVenue: string | undefined;

      if (order.itemType === "event") {
        const [event] = await db.select().from(events).where(eq(events.id, order.itemId)).limit(1);
        if (event) {
          itemTitle = event.title;
          itemDate = new Date(event.eventDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
          itemVenue = event.venue;
        }
      } else if (order.itemType === "course") {
        const [course] = await db.select().from(courses).where(eq(courses.id, order.itemId)).limit(1);
        if (course) itemTitle = course.title;
      } else if (order.itemType === "class") {
        const [classItem] = await db.select().from(classes).where(eq(classes.id, order.itemId)).limit(1);
        if (classItem) {
          itemTitle = classItem.title;
          itemDate = new Date(classItem.classDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
          // classes table does not have a venue column
        }
      }

      const totalGBP = parseFloat(String(order.amount));

      const pdfBuffer = await generateInvoicePdf({
        orderId: String(order.id),
        orderDate: new Date(order.createdAt),
        buyerName: ctx.user.name || "Customer",
        buyerEmail: ctx.user.email || "",
        itemType: order.itemType as "event" | "course" | "class",
        itemTitle,
        itemDate,
        itemVenue,
        quantity: 1,
        unitPriceGBP: totalGBP,
        totalGBP,
        paymentMethod: "Online Payment (Stripe)",
      });

      return {
        base64: pdfBuffer.toString("base64"),
        filename: `invoice-${order.id}.pdf`,
      };
    }),
});

/**
 * Process a completed checkout session (called from webhook)
 */
export async function processCompletedCheckout(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const metadata = session.metadata || {};
  const userId = parseInt(metadata.user_id || "0");
  const itemType = metadata.item_type as "event" | "course" | "class";
  const itemId = parseInt(metadata.item_id || "0");
  const quantity = parseInt(metadata.quantity || "1");

  if (!userId || !itemType || !itemId) {
    console.error("[Webhook] Missing metadata in checkout session:", session.id);
    return;
  }

  const amount = ((session.amount_total || 0) / 100).toFixed(2);

  // Create order record
  const [order] = await db.insert(orders).values({
    userId,
    stripePaymentIntentId: session.payment_intent as string,
    amount: amount as any,
    currency: (session.currency || "gbp").toUpperCase(),
    status: "completed",
    itemType,
    itemId,
  }).returning({ id: orders.id });

  const orderId = order.id;

  // Create specific purchase records
  if (itemType === "event") {
    // Generate 1 unique ticket + 1 unique QR per quantity purchased
    const ticketCodes: string[] = [];
    for (let i = 0; i < quantity; i++) {
      const code = generateTicketCode();
      ticketCodes.push(code);

      await db.insert(eventTickets).values({
        userId,
        eventId: itemId,
        orderId,
        quantity: 1,
        ticketCode: code,
        status: "valid",
      });

      // Generate a unique QR for this specific ticket
      // Payload: TKT-{code} so the scanner knows it's a ticket QR
      const qrPayload = `TKT-${code}`;
      let qrDataUrl = "";
      try {
        qrDataUrl = await QRCode.toDataURL(qrPayload, {
          errorCorrectionLevel: "H" as any,
          margin: 1,
          width: 300,
        });
      } catch (e) {
        console.error(`[Webhook] QR generation failed for ticket ${code}:`, e);
      }

      await db.insert(qrCodes).values({
        itemType: "event",
        itemId,
        userId,
        orderId,
        code: qrPayload,  // unique TKT-{code} payload
        qrData: qrDataUrl,
      });
    }

    // Update tickets sold count
    const [event] = await db.select().from(events).where(eq(events.id, itemId)).limit(1);
    if (event) {
      await db.update(events).set({
        ticketsSold: (event.ticketsSold || 0) + quantity,
      }).where(eq(events.id, itemId));
    }

    // RRP attribution: credit commission if this sale came through an RRP code
    const rrpUserIdRaw = (metadata as any).rrp_user_id;
    const rrpCommissionPctRaw = (metadata as any).rrp_commission_pct;
    const rrpCustomerDiscountPctRaw = (metadata as any).rrp_customer_discount_pct;
    const originalPricePenceRaw = (metadata as any).original_price_pence;
    if (rrpUserIdRaw && rrpCommissionPctRaw && originalPricePenceRaw) {
      try {
        const { attributeRrpSale } = await import("./rrp");
        const originalPrice = parseInt(originalPricePenceRaw) / 100;
        for (let i = 0; i < quantity; i++) {
          await attributeRrpSale({
            rrpUserId: parseInt(rrpUserIdRaw),
            eventId: itemId,
            orderId,
            buyerUserId: userId,
            ticketPrice: originalPrice,
            customerDiscountPct: parseInt(rrpCustomerDiscountPctRaw || "0"),
            rrpCommissionPct: parseInt(rrpCommissionPctRaw),
          });
        }
      } catch (e) {
        console.error("[Webhook] RRP attribution failed:", e);
      }
    }

  } else if (itemType === "course") {
    await db.insert(coursePurchases).values({
      userId,
      courseId: itemId,
      orderId,
      progress: 0,
      completed: false,
    });
  } else if (itemType === "class") {
    await db.insert(classPurchases).values({
      userId,
      classId: itemId,
      orderId,
      accessCode: generateAccessCode(),
      status: "active",
    });
    // Update participants count
    const [classItem] = await db.select().from(classes).where(eq(classes.id, itemId)).limit(1);
    if (classItem) {
      await db.update(classes).set({
        currentParticipants: (classItem.currentParticipants || 0) + 1,
      }).where(eq(classes.id, itemId));
    }
  }

  // Generate QR codes and send emails for events and classes
  if (itemType === "event" || itemType === "class") {
    try {
      // Get user info
      const [userRecord] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const userEmail = userRecord?.email || "";
      const userName = userRecord?.name || "Customer";

      // Get item info
      let itemName = itemType;
      let eventDate: string | undefined;
      let eventTime: string | undefined;

      if (itemType === "event") {
        const [eventRecord] = await db.select().from(events).where(eq(events.id, itemId)).limit(1);
        if (eventRecord) {
          itemName = eventRecord.title as any;
          const d = new Date(eventRecord.eventDate);
          eventDate = d.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
          eventTime = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        }
      } else if (itemType === "class") {
        const [classRecord] = await db.select().from(classes).where(eq(classes.id, itemId)).limit(1);
        if (classRecord) {
          itemName = classRecord.title as any;
          const d = new Date(classRecord.classDate);
          eventDate = d.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
          eventTime = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        }
      }

      // Generate invoice PDF once for the whole order
      let invoicePdf: Buffer | undefined;
      try {
        const ticketPricePence = parseInt(metadata.ticket_price_pence || "0");
        const platformFeePence = parseInt(metadata.platform_fee_pence || "0");
        const stripeFeePence = parseInt(metadata.stripe_fee_pence || "0");
        invoicePdf = await generateInvoicePdf({
          orderId: `${orderId}`,
          orderDate: new Date(),
          buyerName: userName,
          buyerEmail: userEmail,
          itemType: itemType as "event" | "class",
          itemTitle: itemName,
          itemDate: eventDate,
          quantity,
          unitPriceGBP: ticketPricePence / 100,
          platformFeeGBP: platformFeePence > 0 ? platformFeePence / 100 : undefined,
          processingFeeGBP: stripeFeePence > 0 ? stripeFeePence / 100 : undefined,
          totalGBP: parseFloat(amount),
        });
      } catch (invoiceError) {
        console.error("[Webhook] Error generating invoice PDF:", invoiceError);
      }

      if (userEmail) {
        if (itemType === "event") {
          // Send ONE email per ticket so each attendee can be forwarded their
          // own QR. Each ticket was already stored in eventTickets with a
          // unique ticketCode, and a matching TKT-{code} QR row was created
          // in qrCodes. We just need to pull each one, render its QR image,
          // and send it.
          const ticketsForOrder = await db.select()
            .from(eventTickets)
            .where(eq(eventTickets.orderId, orderId));

          for (let i = 0; i < ticketsForOrder.length; i++) {
            const t = ticketsForOrder[i];
            if (!t.ticketCode) continue;
            const qrPayload = `TKT-${t.ticketCode}`;
            let qrDataUrl = "";
            try {
              qrDataUrl = await QRCode.toDataURL(qrPayload, {
                errorCorrectionLevel: "H" as any,
                margin: 1,
                width: 300,
              });
            } catch (qrErr) {
              console.error(`[Webhook] QR render failed for ticket ${t.ticketCode}:`, qrErr);
              continue;
            }

            const multiSuffix = ticketsForOrder.length > 1
              ? ` (ticket ${i + 1}/${ticketsForOrder.length})`
              : "";

            await sendQRCodeEmail({
              to: userEmail,
              userName,
              itemType: "event",
              itemName: `${itemName}${multiSuffix}`,
              qrCodeImage: qrDataUrl,
              ticketCode: t.ticketCode,
              eventDate,
              eventTime,
            });
          }
          console.log(`[Webhook] Sent ${ticketsForOrder.length} QR email(s) to ${userEmail} for event ${itemId}`);
        } else {
          // Classes: one purchase per order, use the accessCode + a class-level QR
          const [classPurchase] = await db.select().from(classPurchases)
            .where(eq(classPurchases.orderId, orderId)).limit(1);
          const accessCode = classPurchase?.accessCode || undefined;

          const qrValue = `class-${itemId}-user-${userId}-order-${orderId}`;
          const qrCodeImage = await QRCode.toDataURL(qrValue, {
            errorCorrectionLevel: "H" as any,
            margin: 1,
            width: 300,
          });
          await db.insert(qrCodes).values({
            itemType: "class",
            itemId,
            userId,
            orderId,
            code: qrValue,
            qrData: qrCodeImage,
          });
          await sendQRCodeEmail({
            to: userEmail,
            userName,
            itemType: "class",
            itemName,
            qrCodeImage,
            accessCode,
            eventDate,
            eventTime,
          });
          console.log(`[Webhook] Sent class QR email to ${userEmail} for class ${itemId}`);
        }

        // Send order confirmation with invoice PDF (just one per order)
        await sendOrderConfirmationEmail({
          to: userEmail,
          userName,
          orderId,
          itemType: itemType as "event" | "class",
          itemName,
          amount: (session.amount_total || 0),
          currency: (session.currency || "gbp").toUpperCase(),
          invoicePdf,
        });
        console.log(`[Webhook] Order confirmation email sent to ${userEmail} for order ${orderId}`);
      }
    } catch (emailError) {
      console.error("[Webhook] Error generating QR code or sending email:", emailError);
    }
  }

  // For courses: send order confirmation with invoice
  if (itemType === "course") {
    try {
      const [userRecord] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const userEmail = userRecord?.email || "";
      const userName = userRecord?.name || "Customer";

      const [courseRecord] = await db.select().from(courses).where(eq(courses.id, itemId)).limit(1);
      const itemName = courseRecord?.title || "Online Course";

      if (userEmail) {
        // Generate invoice PDF for course
        let invoicePdf: Buffer | undefined;
        try {
          const ticketPricePence = parseInt(metadata.ticket_price_pence || "0");
          const platformFeePence = parseInt(metadata.platform_fee_pence || "0");
          const stripeFeePence = parseInt(metadata.stripe_fee_pence || "0");
          invoicePdf = await generateInvoicePdf({
            orderId: `${orderId}`,
            orderDate: new Date(),
            buyerName: userName,
            buyerEmail: userEmail,
            itemType: "course",
            itemTitle: itemName,
            quantity: 1,
            unitPriceGBP: ticketPricePence / 100,
            platformFeeGBP: platformFeePence > 0 ? platformFeePence / 100 : undefined,
            processingFeeGBP: stripeFeePence > 0 ? stripeFeePence / 100 : undefined,
            totalGBP: parseFloat(amount),
          });
        } catch (invoiceError) {
          console.error("[Webhook] Error generating course invoice PDF:", invoiceError);
        }

        await sendOrderConfirmationEmail({
          to: userEmail,
          userName,
          orderId,
          itemType: "course",
          itemName,
          amount: (session.amount_total || 0),
          currency: (session.currency || "gbp").toUpperCase(),
          invoicePdf,
        });
        console.log(`[Webhook] Course confirmation email sent to ${userEmail} for order ${orderId}`);
      }
    } catch (courseEmailError) {
      console.error("[Webhook] Error sending course confirmation email:", courseEmailError);
    }
  }

  console.log(`[Webhook] Processed ${itemType} purchase for user ${userId}, order ${orderId}`);
}
