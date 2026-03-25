/**
 * Multi-item checkout router for shopping cart functionality
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { events, courses, classes } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any,
});

// Cart item schema
const cartItemSchema = z.object({
  type: z.enum(["course", "class", "event"]),
  id: z.number(),
  title: z.string(),
  price: z.number(),
  imageUrl: z.string().optional(),
  instructorName: z.string().optional(),
  danceStyle: z.string().optional(),
  date: z.string().optional(),
  location: z.string().optional(),
  quantity: z.number().int().min(1).optional(),
});

export const checkoutRouter = router({
  /**
   * Create a Stripe checkout session for multiple items from the cart
   */
  createMultiItemSession: protectedProcedure
    .input(z.object({
      items: z.array(cartItemSchema).min(1, "Cart must have at least one item"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const origin = ctx.req.headers.origin || "https://consabor.uk";
      const { items } = input;

      // Validate all items exist and are purchasable
      const validatedItems = await Promise.all(
        items.map(async (item) => {
          if (item.type === "course") {
            const [course] = await db.select().from(courses).where(eq(courses.id, item.id)).limit(1);
            if (!course) throw new Error(`Course ${item.id} not found`);
            if (course.status !== "published") throw new Error(`Course "${course.title}" is not available`);

            // Use actual price from DB (price snapshot validation)
            return {
              ...item,
              price: parseFloat(String(course.price)),
              title: course.title,
              imageUrl: course.imageUrl || undefined,
            };
          }

          if (item.type === "event") {
            const [event] = await db.select().from(events).where(eq(events.id, item.id)).limit(1);
            if (!event) throw new Error(`Event ${item.id} not found`);
            if (event.status !== "published") throw new Error(`Event "${event.title}" is not available`);

            // Check ticket availability
            if (event.maxTickets && event.ticketsSold !== null && event.ticketsSold >= event.maxTickets) {
              throw new Error(`Tickets for "${event.title}" are sold out`);
            }

            return {
              ...item,
              price: parseFloat(String(event.ticketPrice)),
              title: event.title,
              imageUrl: event.imageUrl || undefined,
            };
          }

          if (item.type === "class") {
            const [classItem] = await db.select().from(classes).where(eq(classes.id, item.id)).limit(1);
            if (!classItem) throw new Error(`Class ${item.id} not found`);
            if (classItem.status !== "published") throw new Error(`Class "${classItem.title}" is not available`);

            return {
              ...item,
              price: parseFloat(String(classItem.price)),
              title: classItem.title,
              imageUrl: classItem.imageUrl || undefined,
            };
          }

          throw new Error(`Invalid item type: ${item.type}`);
        })
      );

      // Create Stripe line items
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = validatedItems.map((item) => ({
        price_data: {
          currency: "gbp",
          product_data: {
            name: `${item.type === "event" ? "🎉" : item.type === "class" ? "💃" : "📚"} ${item.title}`,
            description: item.instructorName
              ? `by ${item.instructorName}${item.danceStyle ? ` • ${item.danceStyle}` : ""}`
              : item.danceStyle || "",
            ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
          },
          unit_amount: Math.round(item.price * 100), // Convert to pence
        },
        quantity: item.quantity || 1,
      }));

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart`,
        client_reference_id: ctx.user.id.toString(),
        customer_email: ctx.user.email || undefined,
        allow_promotion_codes: true,
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
          // Store cart items as JSON for webhook processing
          cart_items: JSON.stringify(
            validatedItems.map((item) => ({
              type: item.type,
              id: item.id,
              title: item.title,
              price: item.price,
            }))
          ),
          is_multi_item_cart: "true",
        },
      });

      return { url: session.url };
    }),
});
