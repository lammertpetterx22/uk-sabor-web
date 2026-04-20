/**
 * Multi-item checkout router for shopping cart functionality
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { events, courses, classes, discountCodes, eventTicketTiers, classTicketTiers } from "../../drizzle/schema";
import { eq, sql, and } from "drizzle-orm";
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
  // For event items with multi-tier pricing: which tier the buyer picked
  tierId: z.number().optional(),
});

export const checkoutRouter = router({
  /**
   * Create a Stripe checkout session for multiple items from the cart
   */
  createMultiItemSession: protectedProcedure
    .input(z.object({
      items: z.array(cartItemSchema).min(1, "Cart must have at least one item"),
      discountCode: z.string().optional(),
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

            const qty = item.quantity || 1;

            // Multi-tier path: if an item specifies a tierId, validate it and
            // use the tier's price + maxQuantity instead of the flat event fields.
            if (item.tierId) {
              const [tier] = await db.select()
                .from(eventTicketTiers)
                .where(and(
                  eq(eventTicketTiers.id, item.tierId),
                  eq(eventTicketTiers.eventId, event.id),
                  eq(eventTicketTiers.active, true),
                )).limit(1);
              if (!tier) throw new Error(`Ticket type for "${event.title}" is no longer available`);
              if (tier.maxQuantity != null && tier.soldCount + qty > tier.maxQuantity) {
                throw new Error(`"${tier.name}" tickets for "${event.title}" are sold out`);
              }
              return {
                ...item,
                price: parseFloat(String(tier.price)),
                title: `${event.title} — ${tier.name}`,
                imageUrl: event.imageUrl || undefined,
                tierId: tier.id,
              };
            }

            // Flat (single-price) path — original behavior
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

            const qty = item.quantity || 1;

            // Multi-tier path for classes — mirrors the event logic.
            if (item.tierId) {
              const [tier] = await db.select()
                .from(classTicketTiers)
                .where(and(
                  eq(classTicketTiers.id, item.tierId),
                  eq(classTicketTiers.classId, classItem.id),
                  eq(classTicketTiers.active, true),
                )).limit(1);
              if (!tier) throw new Error(`Ticket type for "${classItem.title}" is no longer available`);
              if (tier.maxQuantity != null && tier.soldCount + qty > tier.maxQuantity) {
                throw new Error(`"${tier.name}" spots for "${classItem.title}" are sold out`);
              }
              return {
                ...item,
                price: parseFloat(String(tier.price)),
                title: `${classItem.title} — ${tier.name}`,
                imageUrl: classItem.imageUrl || undefined,
                tierId: tier.id,
              };
            }

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

      // ── Discount code validation ──────────────────────────────────
      let discountRecord: typeof discountCodes.$inferSelect | null = null;
      let totalDiscountPence = 0;
      const itemDiscounts = new Map<string, number>(); // "type-id" -> discount pence per unit

      if (input.discountCode) {
        const normalized = input.discountCode.trim().toUpperCase();
        const [dc] = await db.select().from(discountCodes)
          .where(eq(discountCodes.code, normalized)).limit(1);

        if (!dc) throw new Error("Invalid discount code");
        if (!dc.active) throw new Error("This discount code is no longer active");
        if (dc.expiresAt && new Date(dc.expiresAt) < new Date()) throw new Error("This discount code has expired");
        if (dc.maxUses && dc.usesCount >= dc.maxUses) throw new Error("This discount code has reached its usage limit");

        // Check item scoping
        if (dc.eventId && !validatedItems.some(i => i.type === "event" && i.id === dc.eventId))
          throw new Error("This discount code is for a specific event only");
        if (dc.classId && !validatedItems.some(i => i.type === "class" && i.id === dc.classId))
          throw new Error("This discount code is for a specific class only");
        if (dc.courseId && !validatedItems.some(i => i.type === "course" && i.id === dc.courseId))
          throw new Error("This discount code is for a specific course only");

        // Atomically claim usage
        const [updated] = await db.update(discountCodes)
          .set({ usesCount: sql`${discountCodes.usesCount} + 1` })
          .where(and(
            eq(discountCodes.id, dc.id),
            dc.maxUses ? sql`${discountCodes.usesCount} < ${dc.maxUses}` : sql`1=1`
          ))
          .returning();

        if (!updated) throw new Error("Discount code is no longer available");

        discountRecord = dc;
        const discountValue = parseFloat(String(dc.discountValue));

        if (dc.discountType === "percentage") {
          for (const item of validatedItems) {
            const perUnit = Math.round(item.price * 100 * discountValue / 100);
            itemDiscounts.set(`${item.type}-${item.id}`, perUnit);
            totalDiscountPence += perUnit * (item.quantity || 1);
          }
        } else {
          // Fixed: distribute proportionally
          const totalPence = validatedItems.reduce((s, i) => s + Math.round(i.price * 100) * (i.quantity || 1), 0);
          const fixedPence = Math.min(Math.round(discountValue * 100), totalPence);
          for (const item of validatedItems) {
            const itemTotal = Math.round(item.price * 100) * (item.quantity || 1);
            const share = Math.round(fixedPence * (itemTotal / totalPence));
            const perUnit = Math.round(share / (item.quantity || 1));
            itemDiscounts.set(`${item.type}-${item.id}`, perUnit);
            totalDiscountPence += perUnit * (item.quantity || 1);
          }
        }
      }

      // Create Stripe line items (product + processing fee per item)
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

      for (const item of validatedItems) {
        // Build description - only include if we have actual content
        let description = "";
        if (item.instructorName) {
          description = `by ${item.instructorName}`;
          if (item.danceStyle) {
            description += ` • ${item.danceStyle}`;
          }
        } else if (item.danceStyle) {
          description = item.danceStyle;
        }

        const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData = {
          name: `${item.type === "event" ? "🎉" : item.type === "class" ? "💃" : "📚"} ${item.title}`,
          ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
        };

        // Only add description if it's not empty
        if (description) {
          productData.description = description;
        }

        const originalPricePence = Math.round(item.price * 100);
        const discountPerUnit = itemDiscounts.get(`${item.type}-${item.id}`) || 0;
        const itemPricePence = Math.max(0, originalPricePence - discountPerUnit);
        const quantity = item.quantity || 1;

        // Calculate Stripe fee using GROSS-UP formula on the discounted price
        const totalPence = Math.round((itemPricePence + 20) / 0.985);
        const stripeFeePence = totalPence - itemPricePence;

        // Add product line item
        lineItems.push({
          price_data: {
            currency: "gbp",
            product_data: productData,
            unit_amount: itemPricePence,
          },
          quantity: quantity,
        });

        // Add processing fee line item (customer pays Stripe fee)
        lineItems.push({
          price_data: {
            currency: "gbp",
            product_data: {
              name: "Processing fee",
              description: `Stripe card processing fee for ${item.title}`,
            },
            unit_amount: stripeFeePence,
          },
          quantity: quantity,
        });
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart`,
        client_reference_id: ctx.user.id.toString(),
        customer_email: ctx.user.email || undefined,
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
          cart_items: JSON.stringify(
            validatedItems.map((item) => {
              const originalPricePence = Math.round(item.price * 100);
              const discPerUnit = itemDiscounts.get(`${item.type}-${item.id}`) || 0;
              const adjustedPricePence = Math.max(0, originalPricePence - discPerUnit);
              const totalPence = Math.round((adjustedPricePence + 20) / 0.985);
              const stripeFeePence = totalPence - adjustedPricePence;

              return {
                type: item.type,
                id: item.id,
                title: item.title,
                price: adjustedPricePence / 100,
                quantity: item.quantity || 1,
                stripe_fee_pence: stripeFeePence,
                ...(item.tierId ? { tier_id: item.tierId } : {}),
              };
            })
          ),
          is_multi_item_cart: "true",
          ...(discountRecord ? {
            discount_code: discountRecord.code,
            discount_amount_pence: String(totalDiscountPence),
          } : {}),
        },
      });

      return { url: session.url };
    }),
});
