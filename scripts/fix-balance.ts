#!/usr/bin/env tsx

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres.yajztkmoqhhtbgyogldb:UkSabor_SecureDB_2026!@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function fixBalance() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('🔧 Arreglando balance de Lammert Petter (userId: 2)...\n');

    // Return the £9.06 to the balance
    const result = await client.query(`
      UPDATE balances
      SET "currentBalance" = "currentBalance" + 9.06,
          "updatedAt" = NOW()
      WHERE "userId" = 2
      RETURNING *
    `);

    if (result.rows.length > 0) {
      const balance = result.rows[0];
      console.log('✅ Balance actualizado!');
      console.log(`   Current Balance: £${balance.currentBalance}`);
      console.log(`   Total Earned: £${balance.totalEarned}`);
      console.log(`   Total Withdrawn: £${balance.totalWithdrawn}\n`);
      console.log('✅ Los £9.06 han sido devueltos al balance.');
    } else {
      console.log('❌ No se pudo actualizar el balance');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

fixBalance();
