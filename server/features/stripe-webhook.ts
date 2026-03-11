import { Request, Response } from "express";
import Stripe from "stripe";
import { processCompletedCheckout } from "./payments";
import { processSubscriptionWebhook } from "./subscriptions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          await processCompletedCheckout(session);
        }
        break;
      }

      case "payment_intent.succeeded": {
        console.log(`[Webhook] PaymentIntent succeeded: ${(event.data.object as any).id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        console.log(`[Webhook] PaymentIntent failed: ${(event.data.object as any).id}`);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await processSubscriptionWebhook(event.type, subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Invoice paid: ${invoice.id} for subscription ${(invoice as any).subscription}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Invoice payment failed: ${invoice.id}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error(`[Webhook] Error processing ${event.type}:`, err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
