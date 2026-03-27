import { db } from "../server/db/index.js";
import { eq, sql } from "drizzle-orm";
import { users } from "../server/db/schema.js";

async function analyzeAdminBalance() {
  console.log("🔍 Analyzing Admin Balance\n");

  // Find admin user (assuming user ID 2 based on earnings)
  const adminUser = await db.query.users.findFirst({
    where: eq(users.id, 2),
  });

  if (!adminUser) {
    console.log("❌ Admin user not found");
    return;
  }

  console.log(`👤 User #${adminUser.id}`);
  console.log(`Name: ${adminUser.name}`);
  console.log(`Email: ${adminUser.email}`);
  console.log(`Role: ${adminUser.role}`);
  console.log(`\n💰 BALANCE: £${adminUser.balance || 0}`);
  console.log(`💸 WITHDRAWN: £${adminUser.totalWithdrawn || 0}`);
  console.log(`📊 TOTAL EARNED: £${(adminUser.balance || 0) + (adminUser.totalWithdrawn || 0)}\n`);

  // Get all event tickets for this instructor
  const tickets = await db.query.eventTickets.findMany({
    where: eq(db.schema.eventTickets.instructorId, 2),
    with: {
      order: true,
      event: true,
    },
  });

  console.log(`🎫 EVENT TICKETS SOLD: ${tickets.length}\n`);

  let totalInstructorEarnings = 0;
  let totalPlatformFees = 0;
  let totalPricePaid = 0;

  tickets.forEach((ticket, idx) => {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Ticket #${ticket.id} (Order #${ticket.orderId})`);
    console.log(`Event: ${ticket.event?.title || 'N/A'}`);
    console.log(`Price Paid: £${ticket.pricePaid}`);
    console.log(`Platform Fee: £${ticket.platformFee || 0}`);
    console.log(`Instructor Earnings: £${ticket.instructorEarnings || 0}`);
    console.log(`Livemode: ${ticket.order?.livemode ? 'LIVE' : 'TEST'}`);
    
    totalPricePaid += Number(ticket.pricePaid);
    totalPlatformFees += Number(ticket.platformFee || 0);
    totalInstructorEarnings += Number(ticket.instructorEarnings || 0);
  });

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 TOTALS:`);
  console.log(`Total Price Paid by Customers: £${totalPricePaid.toFixed(2)}`);
  console.log(`Total Platform Fees: £${totalPlatformFees.toFixed(2)}`);
  console.log(`Total Instructor Earnings: £${totalInstructorEarnings.toFixed(2)}`);
  console.log(`\n💰 Database Balance: £${adminUser.balance || 0}`);
  console.log(`📊 Calculated Earnings: £${totalInstructorEarnings.toFixed(2)}`);
  
  if (Math.abs((adminUser.balance || 0) - totalInstructorEarnings) > 0.01) {
    console.log(`\n⚠️  MISMATCH DETECTED!`);
    console.log(`Difference: £${Math.abs((adminUser.balance || 0) - totalInstructorEarnings).toFixed(2)}`);
  } else {
    console.log(`\n✅ Balance matches earnings`);
  }

  console.log(`\n🔍 IMPORTANT NOTE:`);
  console.log(`The balance shows £${adminUser.balance || 0} because that's what the database calculated.`);
  console.log(`But we need to check if customers paid the Stripe fees or not.`);
  console.log(`\nIf customers didn't pay Stripe fees, then Stripe deducted them from the gross amount.`);
  console.log(`This would explain why Stripe shows less than the database.`);
}

analyzeAdminBalance().catch(console.error);
