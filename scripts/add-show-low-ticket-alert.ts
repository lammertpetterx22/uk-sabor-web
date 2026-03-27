#!/usr/bin/env tsx

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres.yajztkmoqhhtbgyogldb:UkSabor_SecureDB_2026!@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function addShowLowTicketAlert() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🚀 Adding showLowTicketAlert column to events table...\n');
    await client.connect();

    await client.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS "showLowTicketAlert" BOOLEAN DEFAULT false;
    `);

    console.log('✅ Column added successfully!');
    console.log('\nℹ️  Default value: false (alert hidden by default)');
    console.log('   Instructors can enable it in event settings\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addShowLowTicketAlert();
