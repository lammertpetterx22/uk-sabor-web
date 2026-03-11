/**
 * Recovery script: manually insert all missed purchases into the database
 * Run with: node scripts/recover-missed-payments.mjs
 */
import mysql from 'mysql2/promise';
import crypto from 'crypto';

function generateTicketCode() {
  return 'UK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}
function generateAccessCode() {
  return 'CLS-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// All missed payments from Stripe events that were NOT processed (webhook was pointing to wrong URL)
// Format: { userId, itemType, itemId, amount, currency, paymentIntentId, email }
const missedPayments = [
  // Alejandro - class 30002 (free, £0)  - 2 duplicate purchases, only insert once
  { userId: 720172, itemType: 'class', itemId: 30002, amount: '0.00', currency: 'GBP', paymentIntentId: 'pi_alejandro_class30002_free', email: 'alexperezmoreno00@gmail.com' },
  // Alejandro - class 30001 (£12)
  { userId: 720172, itemType: 'class', itemId: 30001, amount: '12.00', currency: 'GBP', paymentIntentId: 'pi_3T7mbiK7YrO9vFuu0wcrSE2h', email: 'alexperezmoreno00@gmail.com' },
  // Lammert (60310) - course 30001 (£69)
  { userId: 60310, itemType: 'course', itemId: 30001, amount: '69.00', currency: 'GBP', paymentIntentId: 'pi_3T7m3QK7YrO9vFuu14IShYG8', email: 'lammertpetterx22@gmail.com' },
  // Lammert (60310) - class 7 (£10)
  { userId: 60310, itemType: 'class', itemId: 7, amount: '10.00', currency: 'GBP', paymentIntentId: 'pi_3T7m2rK7YrO9vFuu1dJZz1sQ', email: 'lammertpetterx22@gmail.com' },
  // Admin (17) - event 30001 (£1) - 4 purchases, insert all
  { userId: 17, itemType: 'event', itemId: 30001, amount: '1.00', currency: 'GBP', paymentIntentId: 'pi_3T7UyZK7YrO9vFuu0PuBI4lC', email: 'petterlammert@gmail.com' },
  { userId: 17, itemType: 'event', itemId: 30001, amount: '1.00', currency: 'GBP', paymentIntentId: 'pi_3T7Un1K7YrO9vFuu0Tu1qfOJ', email: 'petterlammert@gmail.com' },
  { userId: 17, itemType: 'event', itemId: 30001, amount: '1.00', currency: 'GBP', paymentIntentId: 'pi_3T7UlQK7YrO9vFuu02l82P5G', email: 'petterlammert@gmail.com' },
  { userId: 17, itemType: 'event', itemId: 30001, amount: '1.00', currency: 'GBP', paymentIntentId: 'pi_3T7UjzK7YrO9vFuu1F58QO0G', email: 'petterlammert@gmail.com' },
  // Admin (17) - course 60001 (£150)
  { userId: 17, itemType: 'course', itemId: 60001, amount: '150.00', currency: 'GBP', paymentIntentId: 'pi_3T7P60K7YrO9vFuu0wNQ4DDc', email: 'petterlammert@gmail.com' },
];

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Check existing orders to avoid duplicates
  const [existingOrders] = await conn.query('SELECT stripePaymentIntentId FROM orders');
  const existingPIs = new Set(existingOrders.map(o => o.stripePaymentIntentId));
  
  // Check existing class purchases to avoid duplicates
  const [existingClasses] = await conn.query('SELECT userId, classId FROM classPurchases');
  const existingClassKeys = new Set(existingClasses.map(c => `${c.userId}-${c.classId}`));
  
  // Check existing course purchases
  const [existingCourses] = await conn.query('SELECT userId, courseId FROM coursePurchases');
  const existingCourseKeys = new Set(existingCourses.map(c => `${c.userId}-${c.courseId}`));
  
  // Check existing event tickets
  const [existingTickets] = await conn.query('SELECT userId, eventId FROM eventTickets');
  const existingTicketKeys = new Set(existingTickets.map(t => `${t.userId}-${t.eventId}`));
  
  console.log('Existing payment intents in DB:', [...existingPIs]);
  
  let processed = 0;
  let skipped = 0;
  
  for (const payment of missedPayments) {
    // Skip if payment intent already exists
    if (existingPIs.has(payment.paymentIntentId)) {
      console.log(`SKIP: ${payment.paymentIntentId} already in DB`);
      skipped++;
      continue;
    }
    
    // For classes: skip if user already has this class
    if (payment.itemType === 'class') {
      const key = `${payment.userId}-${payment.itemId}`;
      if (existingClassKeys.has(key)) {
        console.log(`SKIP: User ${payment.userId} already has class ${payment.itemId}`);
        skipped++;
        continue;
      }
    }
    
    // For courses: skip if user already has this course
    if (payment.itemType === 'course') {
      const key = `${payment.userId}-${payment.itemId}`;
      if (existingCourseKeys.has(key)) {
        console.log(`SKIP: User ${payment.userId} already has course ${payment.itemId}`);
        skipped++;
        continue;
      }
    }
    
    try {
      // Insert order
      const [orderResult] = await conn.query(
        'INSERT INTO orders (userId, stripePaymentIntentId, amount, currency, status, itemType, itemId) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [payment.userId, payment.paymentIntentId, payment.amount, payment.currency, 'completed', payment.itemType, payment.itemId]
      );
      const orderId = orderResult.insertId;
      console.log(`Created order ${orderId} for user ${payment.userId}, ${payment.itemType} ${payment.itemId}`);
      
      // Insert specific purchase record
      if (payment.itemType === 'event') {
        const ticketKey = `${payment.userId}-${payment.itemId}`;
        if (!existingTicketKeys.has(ticketKey)) {
          const ticketCode = generateTicketCode();
          await conn.query(
            'INSERT INTO eventTickets (userId, eventId, orderId, quantity, ticketCode, status) VALUES (?, ?, ?, 1, ?, "valid")',
            [payment.userId, payment.itemId, orderId, ticketCode]
          );
          existingTicketKeys.add(ticketKey);
          console.log(`  → Created event ticket ${ticketCode}`);
        }
        // Update tickets sold
        await conn.query('UPDATE events SET ticketsSold = COALESCE(ticketsSold, 0) + 1 WHERE id = ?', [payment.itemId]);
        
      } else if (payment.itemType === 'class') {
        const accessCode = generateAccessCode();
        await conn.query(
          'INSERT INTO classPurchases (userId, classId, orderId, accessCode, status) VALUES (?, ?, ?, ?, "active")',
          [payment.userId, payment.itemId, orderId, accessCode]
        );
        existingClassKeys.add(`${payment.userId}-${payment.itemId}`);
        console.log(`  → Created class purchase ${accessCode}`);
        // Update participants
        await conn.query('UPDATE classes SET currentParticipants = COALESCE(currentParticipants, 0) + 1 WHERE id = ?', [payment.itemId]);
        
      } else if (payment.itemType === 'course') {
        await conn.query(
          'INSERT INTO coursePurchases (userId, courseId, orderId, progress, completed) VALUES (?, ?, ?, 0, false)',
          [payment.userId, payment.itemId, orderId]
        );
        existingCourseKeys.add(`${payment.userId}-${payment.itemId}`);
        console.log(`  → Created course purchase`);
      }
      
      existingPIs.add(payment.paymentIntentId);
      processed++;
    } catch (err) {
      console.error(`ERROR processing ${payment.paymentIntentId}:`, err.message);
    }
  }
  
  console.log(`\nDone! Processed: ${processed}, Skipped: ${skipped}`);
  
  // Verify final state
  const [finalOrders] = await conn.query('SELECT userId, itemType, itemId, amount FROM orders ORDER BY id DESC');
  console.log('\nFinal orders:', JSON.stringify(finalOrders, null, 2));
  
  await conn.end();
}

run().catch(console.error);
