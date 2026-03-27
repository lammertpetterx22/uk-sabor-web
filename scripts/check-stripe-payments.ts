import Stripe from "stripe";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq } from "drizzle-orm";
import * as schema from "../server/db/schema.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function checkStripePayments() {
  console.log("🔍 Checking Stripe Payments vs Database\n");

  // Get orders from database
  const orders = await db.query.orders.findMany({
    orderBy: (orders, { desc }) => [desc(orders.id)],
    limit: 10,
  });

  console.log(`Found ${orders.length} recent orders\n`);

  for (const order of orders) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Order #${order.id}`);
    console.log(`User ID: ${order.userId}`);
    console.log(`Stripe Session: ${order.stripeSessionId}`);
    console.log(`Total: £${order.totalAmount}`);
    console.log(`Status: ${order.status}`);
    
    if (order.stripeSessionId) {
      try {
        // Get Stripe session
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId, {
          expand: ['line_items', 'payment_intent'],
        });

        console.log(`\n💳 STRIPE SESSION DATA:`);
        console.log(`Amount Total: £${(session.amount_total || 0) / 100}`);
        console.log(`Amount Subtotal: £${(session.amount_subtotal || 0) / 100}`);
        console.log(`Payment Status: ${session.payment_status}`);
        
        // Get payment intent
        if (session.payment_intent && typeof session.payment_intent !== 'string') {
          const pi = session.payment_intent as Stripe.PaymentIntent;
          console.log(`\n💰 PAYMENT INTENT:`);
          console.log(`Amount: £${pi.amount / 100}`);
          console.log(`Amount Received: £${pi.amount_received / 100}`);
          
          if (pi.charges && pi.charges.data.length > 0) {
            const charge = pi.charges.data[0];
            console.log(`\n⚡ CHARGE DETAILS:`);
            console.log(`Amount: £${charge.amount / 100}`);
            console.log(`Amount Captured: £${charge.amount_captured / 100}`);
            console.log(`Amount Refunded: £${charge.amount_refunded / 100}`);
            
            if (charge.balance_transaction && typeof charge.balance_transaction !== 'string') {
              const bt = charge.balance_transaction as Stripe.BalanceTransaction;
              console.log(`\n💵 BALANCE TRANSACTION:`);
              console.log(`Gross: £${bt.amount / 100}`);
              console.log(`Fee: £${bt.fee / 100}`);
              console.log(`Net: £${bt.net / 100}`);
              console.log(`\nFee Details:`);
              bt.fee_details.forEach(fee => {
                console.log(`  - ${fee.description}: £${fee.amount / 100} (${fee.type})`);
              });
            }
          }
        }
        
        // Show line items
        if (session.line_items) {
          console.log(`\n📦 LINE ITEMS:`);
          session.line_items.data.forEach((item, idx) => {
            console.log(`  ${idx + 1}. ${item.description}`);
            console.log(`     Quantity: ${item.quantity}`);
            console.log(`     Unit Amount: £${(item.price?.unit_amount || 0) / 100}`);
            console.log(`     Total: £${(item.amount_total || 0) / 100}`);
          });
        }
        
      } catch (err: any) {
        console.log(`❌ Error fetching Stripe data: ${err.message}`);
      }
    }
    console.log();
  }

  await pool.end();
}

checkStripePayments().catch(console.error);
