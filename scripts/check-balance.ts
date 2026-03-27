#!/usr/bin/env tsx

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres.yajztkmoqhhtbgyogldb:UkSabor_SecureDB_2026!@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function checkBalance() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('📊 Verificando withdrawal request de £9.06...\n');

    // Find the withdrawal request
    const withdrawal = await client.query(`
      SELECT
        wr.*,
        u.name as user_name,
        u.email as user_email
      FROM "withdrawalRequests" wr
      LEFT JOIN users u ON wr."userId" = u.id
      WHERE wr.amount = '9.06'
      ORDER BY wr."requestedAt" DESC
      LIMIT 1
    `);

    if (withdrawal.rows.length === 0) {
      console.log('❌ No withdrawal request found for £9.06');
      return;
    }

    const request = withdrawal.rows[0];
    console.log('📝 Withdrawal Request:');
    console.log(`   ID: #${request.id}`);
    console.log(`   User: ${request.user_name} (${request.user_email})`);
    console.log(`   Amount: £${request.amount}`);
    console.log(`   Status: ${request.status}`);
    console.log(`   Requested: ${request.requestedAt}\n`);

    // Check user's current balance
    const balance = await client.query(`
      SELECT * FROM balances WHERE "userId" = $1
    `, [request.userId]);

    if (balance.rows.length > 0) {
      const bal = balance.rows[0];
      console.log('💰 User Balance:');
      console.log(`   Current Balance: £${bal.currentBalance}`);
      console.log(`   Total Earned: £${bal.totalEarned}`);
      console.log(`   Total Withdrawn: £${bal.totalWithdrawn}\n`);
    } else {
      console.log('❌ No balance found for user\n');
    }

    // Check ledger transactions
    const ledger = await client.query(`
      SELECT * FROM "ledgerTransactions"
      WHERE "userId" = $1
      AND description LIKE '%#${request.id}%'
      ORDER BY "createdAt" DESC
    `, [request.userId]);

    console.log('📚 Ledger Transactions:');
    if (ledger.rows.length === 0) {
      console.log('   No ledger entries found');
    } else {
      ledger.rows.forEach((tx, i) => {
        console.log(`   ${i + 1}. ${tx.description}`);
        console.log(`      Amount: £${tx.amount}`);
        console.log(`      Type: ${tx.type}`);
        console.log(`      Status: ${tx.status}`);
        console.log(`      Date: ${tx.createdAt}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkBalance();
