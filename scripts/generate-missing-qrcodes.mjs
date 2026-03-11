/**
 * Script to generate QR codes for all existing purchases that are missing them.
 * Run with: node scripts/generate-missing-qrcodes.mjs
 */
import mysql from 'mysql2/promise';
import QRCode from 'qrcode';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('=== Generating QR codes for all existing purchases ===\n');

// Process class purchases
const [classPurchases] = await conn.query('SELECT id, userId, classId, orderId, accessCode FROM classPurchases ORDER BY id');
console.log(`Found ${classPurchases.length} class purchases`);

for (const purchase of classPurchases) {
  // Check if QR already exists for this order
  const [existing] = await conn.query(
    'SELECT id FROM qrCodes WHERE orderId = ? AND itemType = ? AND userId = ?',
    [purchase.orderId, 'class', purchase.userId]
  );
  
  if (existing.length > 0) {
    console.log(`  [SKIP] Class purchase ${purchase.id} (order ${purchase.orderId}) - QR already exists`);
    continue;
  }

  const qrValue = `class-${purchase.classId}-user-${purchase.userId}-order-${purchase.orderId}`;
  
  try {
    const qrDataUrl = await QRCode.toDataURL(qrValue, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
    });

    await conn.query(
      'INSERT INTO qrCodes (code, itemType, itemId, userId, orderId, qrData) VALUES (?, ?, ?, ?, ?, ?)',
      [qrValue, 'class', purchase.classId, purchase.userId, purchase.orderId, qrDataUrl]
    );
    console.log(`  [OK] Generated QR for class purchase ${purchase.id} (user ${purchase.userId}, class ${purchase.classId}, order ${purchase.orderId})`);
  } catch (err) {
    console.error(`  [ERROR] Failed for class purchase ${purchase.id}:`, err.message);
  }
}

// Process event tickets
const [eventTickets] = await conn.query('SELECT id, userId, eventId, orderId, ticketCode FROM eventTickets ORDER BY id');
console.log(`\nFound ${eventTickets.length} event tickets`);

for (const ticket of eventTickets) {
  // Check if QR already exists for this order
  const [existing] = await conn.query(
    'SELECT id FROM qrCodes WHERE orderId = ? AND itemType = ? AND userId = ?',
    [ticket.orderId, 'event', ticket.userId]
  );
  
  if (existing.length > 0) {
    console.log(`  [SKIP] Event ticket ${ticket.id} (order ${ticket.orderId}) - QR already exists`);
    continue;
  }

  const qrValue = `event-${ticket.eventId}-user-${ticket.userId}-order-${ticket.orderId}`;
  
  try {
    const qrDataUrl = await QRCode.toDataURL(qrValue, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
    });

    await conn.query(
      'INSERT INTO qrCodes (code, itemType, itemId, userId, orderId, qrData) VALUES (?, ?, ?, ?, ?, ?)',
      [qrValue, 'event', ticket.eventId, ticket.userId, ticket.orderId, qrDataUrl]
    );
    console.log(`  [OK] Generated QR for event ticket ${ticket.id} (user ${ticket.userId}, event ${ticket.eventId}, order ${ticket.orderId})`);
  } catch (err) {
    console.error(`  [ERROR] Failed for event ticket ${ticket.id}:`, err.message);
  }
}

// Verify
const [allQRs] = await conn.query('SELECT id, code, itemType, itemId, userId, orderId FROM qrCodes ORDER BY id');
console.log(`\n=== Done! Total QR codes in database: ${allQRs.length} ===`);
allQRs.forEach(qr => {
  console.log(`  QR #${qr.id}: ${qr.itemType} ${qr.itemId} | user ${qr.userId} | order ${qr.orderId}`);
});

await conn.end();
