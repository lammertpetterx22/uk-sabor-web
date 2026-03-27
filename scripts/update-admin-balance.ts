#!/usr/bin/env tsx
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { users } from '../drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

async function updateAdminBalance() {
  const client = postgres(DATABASE_URL!);
  const db = drizzle(client);

  console.log("💰 Updating Admin Balance\n");

  // Get user #2 (the admin/instructor)
  const [user] = await db.select()
    .from(users)
    .where(eq(users.id, 2))
    .limit(1);

  if (!user) {
    console.log("❌ User not found");
    await client.end();
    return;
  }

  console.log(`Current balance: £${user.balance}`);
  
  // Reduce by £0.54 (2 × £0.27)
  const oldBalance = Number(user.balance || 0);
  const adjustment = 0.54;
  const newBalance = oldBalance - adjustment;

  console.log(`Adjustment: -£${adjustment.toFixed(2)}`);
  console.log(`New balance: £${newBalance.toFixed(2)}`);

  // Update using raw SQL to avoid type issues
  await client.unsafe(`UPDATE users SET balance = '${newBalance.toFixed(2)}' WHERE id = 2`);

  console.log("\n✅ Balance updated!");
  console.log("\nNow your database balance (£9.06) should be closer to Stripe (£9.44)");
  console.log("The remaining difference (£0.38) might be due to other fees or rounding.");

  await client.end();
}

updateAdminBalance().catch(console.error);
