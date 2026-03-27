#!/usr/bin/env tsx

// Script to run withdrawal bank details migration
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres.yajztkmoqhhtbgyogldb:UkSabor_SecureDB_2026!@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🚀 Conectando a la base de datos...');
    await client.connect();
    console.log('✅ Conectado!\n');

    // Migration 1: accountHolderName
    console.log('📝 Agregando columna accountHolderName...');
    await client.query(`
      ALTER TABLE "withdrawalRequests"
      ADD COLUMN IF NOT EXISTS "accountHolderName" VARCHAR(255);
    `);
    console.log('✅ accountHolderName agregada\n');

    // Migration 2: sortCode
    console.log('📝 Agregando columna sortCode...');
    await client.query(`
      ALTER TABLE "withdrawalRequests"
      ADD COLUMN IF NOT EXISTS "sortCode" VARCHAR(20);
    `);
    console.log('✅ sortCode agregada\n');

    // Migration 3: accountNumber
    console.log('📝 Agregando columna accountNumber...');
    await client.query(`
      ALTER TABLE "withdrawalRequests"
      ADD COLUMN IF NOT EXISTS "accountNumber" VARCHAR(20);
    `);
    console.log('✅ accountNumber agregada\n');

    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('  1. Descomentando campos en el código...');
    console.log('  2. Build + Push');
    console.log('  3. ✅ Sistema completo funcional');

  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
