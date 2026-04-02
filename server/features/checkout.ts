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

        const itemPricePence = Math.round(item.price * 100);
        const quantity = item.quantity || 1;

        // Calculate Stripe fee using GROSS-UP formula (correct method)
        // We want the seller to receive exactly itemPricePence after Stripe takes their fee
        // Stripe charges: 1.5% + 20p on the TOTAL amount charged
        // Formula: totalPence = (itemPricePence + 20) / 0.985
        // Then: stripeFee = totalPence - itemPricePence
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
        allow_promotion_codes: true,
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
          // Store cart items as JSON for webhook processing
          cart_items: JSON.stringify(
            validatedItems.map((item) => {
              const itemPricePence = Math.round(item.price * 100);
              // Use GROSS-UP formula for accurate Stripe fee
              const totalPence = Math.round((itemPricePence + 20) / 0.985);
              const stripeFeePence = totalPence - itemPricePence;

              return {
                type: item.type,
                id: item.id,
                title: item.title,
                price: item.price,
                quantity: item.quantity || 1,
                stripe_fee_pence: stripeFeePence,
              };
            })
          ),
          is_multi_item_cart: "true",
        },
      });

      return { url: session.url };
    }),
});
