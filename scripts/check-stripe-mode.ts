#!/usr/bin/env tsx
/**
 * Script to check if Stripe is in Test or Production mode
 * Run: npx tsx scripts/check-stripe-mode.ts
 */

import 'dotenv/config';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

console.log('\n🔍 Stripe Configuration Check\n');
console.log('━'.repeat(50));

if (!STRIPE_SECRET_KEY) {
  console.log('❌ STRIPE_SECRET_KEY is not set!');
  console.log('   Please configure it in your .env file or Koyeb');
  process.exit(1);
}

if (!STRIPE_WEBHOOK_SECRET) {
  console.log('⚠️  STRIPE_WEBHOOK_SECRET is not set!');
  console.log('   Webhooks will not work without this');
}

// Check if using test or live keys
const isTestMode = STRIPE_SECRET_KEY.startsWith('sk_test_');
const isLiveMode = STRIPE_SECRET_KEY.startsWith('sk_live_');

console.log('\n📊 Current Configuration:\n');

if (isTestMode) {
  console.log('🟠 MODE: TEST');
  console.log('   ├─ Secret Key: sk_test_***' + STRIPE_SECRET_KEY.slice(-8));
  console.log('   ├─ Real payments: ❌ NO');
  console.log('   ├─ Test cards: ✅ YES (4242 4242 4242 4242)');
  console.log('   └─ Money deposited: ❌ NO\n');
  console.log('⚠️  You are in TEST mode. Payments are simulated.\n');
} else if (isLiveMode) {
  console.log('🟢 MODE: PRODUCTION (LIVE)');
  console.log('   ├─ Secret Key: sk_live_***' + STRIPE_SECRET_KEY.slice(-8));
  console.log('   ├─ Real payments: ✅ YES');
  console.log('   ├─ Test cards: ❌ NO');
  console.log('   └─ Money deposited: ✅ YES\n');
  console.log('✅ You are in PRODUCTION mode. Real payments enabled.\n');
} else {
  console.log('❓ MODE: UNKNOWN');
  console.log('   ├─ Secret Key: ' + STRIPE_SECRET_KEY.slice(0, 10) + '***');
  console.log('   └─ Format: Invalid (should start with sk_test_ or sk_live_)\n');
  console.log('❌ Invalid Stripe key format!\n');
  process.exit(1);
}

if (STRIPE_WEBHOOK_SECRET) {
  const isTestWebhook = STRIPE_WEBHOOK_SECRET.startsWith('whsec_test_');
  const isLiveWebhook = !isTestWebhook && STRIPE_WEBHOOK_SECRET.startsWith('whsec_');

  console.log('🔗 Webhook Configuration:\n');
  console.log('   ├─ Secret: whsec_***' + STRIPE_WEBHOOK_SECRET.slice(-8));

  if (isTestWebhook) {
    console.log('   └─ Type: TEST webhook\n');
  } else if (isLiveWebhook) {
    console.log('   └─ Type: PRODUCTION webhook\n');
  }

  // Check if keys match
  if (isTestMode && !isTestWebhook && isLiveWebhook) {
    console.log('⚠️  WARNING: You have a TEST secret key but a LIVE webhook secret!');
    console.log('   This configuration is incorrect.\n');
  } else if (isLiveMode && isTestWebhook) {
    console.log('⚠️  WARNING: You have a LIVE secret key but a TEST webhook secret!');
    console.log('   This configuration is incorrect.\n');
  } else {
    console.log('✅ Keys are consistent (both test or both live)\n');
  }
}

console.log('━'.repeat(50));

// Check environment
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`\n🌍 Environment: ${nodeEnv.toUpperCase()}`);

if (nodeEnv === 'production' && isTestMode) {
  console.log('\n⚠️  ALERT: Running in PRODUCTION environment with TEST Stripe keys!');
  console.log('   This is OK for testing, but switch to LIVE keys before launch.\n');
}

if (nodeEnv === 'production' && isLiveMode) {
  console.log('\n✅ Perfect! Production environment with LIVE Stripe keys.\n');
}

console.log('\n📚 Next Steps:\n');

if (isTestMode) {
  console.log('To switch to PRODUCTION mode:');
  console.log('1. Go to https://dashboard.stripe.com/');
  console.log('2. Toggle to "Production" mode (top right)');
  console.log('3. Get your sk_live_... key from Developers → API Keys');
  console.log('4. Create a production webhook at Developers → Webhooks');
  console.log('5. Update STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Koyeb');
  console.log('\nSee STRIPE_PRODUCTION_SETUP.md for detailed instructions.\n');
} else {
  console.log('✅ You\'re ready to accept real payments!');
  console.log('   Make sure you\'ve tested the checkout flow.\n');
}

console.log('━'.repeat(50) + '\n');
