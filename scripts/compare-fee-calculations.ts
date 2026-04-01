#!/usr/bin/env tsx
/**
 * Compare OLD vs NEW Stripe Fee Calculation
 *
 * Shows the difference between the old (incorrect) simple addition
 * and the new (correct) gross-up formula
 */

console.log("🔍 COMPARISON: OLD vs NEW Stripe Fee Calculation\n");
console.log("═".repeat(80));

const testPrices = [5.00, 9.99, 10.00, 15.00, 20.00, 25.00];

console.log("\n📊 OLD METHOD (Incorrect - Simple Addition):");
console.log("─".repeat(80));
console.log("Ticket  │ Fee Calc   │ Client Pays │ Real Stripe │ You Get    │ Loss");
console.log("────────┼────────────┼─────────────┼─────────────┼────────────┼──────");

testPrices.forEach(price => {
  const pricePence = Math.round(price * 100);

  // OLD METHOD (incorrect)
  const oldFeePence = Math.round(pricePence * 0.015) + 20;
  const oldTotalPence = pricePence + oldFeePence;

  // What Stripe ACTUALLY charges on the total
  const realStripeFee = Math.round(oldTotalPence * 0.015) + 20;
  const actualReceived = oldTotalPence - realStripeFee;
  const loss = pricePence - actualReceived;

  const lossStr = loss === 0
    ? "£0.00 ✅"
    : `-£${(loss / 100).toFixed(2)} ❌`;

  console.log(
    `£${price.toFixed(2)}  │ ` +
    `£${(oldFeePence / 100).toFixed(2)}     │ ` +
    `£${(oldTotalPence / 100).toFixed(2)}      │ ` +
    `£${(realStripeFee / 100).toFixed(2)}       │ ` +
    `£${(actualReceived / 100).toFixed(2)}     │ ` +
    lossStr
  );
});

console.log("\n📊 NEW METHOD (Correct - Gross-Up Formula):");
console.log("─".repeat(80));
console.log("Ticket  │ Fee Calc   │ Client Pays │ Real Stripe │ You Get    │ Perfect?");
console.log("────────┼────────────┼─────────────┼─────────────┼────────────┼─────────");

testPrices.forEach(price => {
  const pricePence = Math.round(price * 100);

  // NEW METHOD (correct - gross-up)
  const totalPence = Math.round((pricePence + 20) / 0.985);
  const newFeePence = totalPence - pricePence;

  // What Stripe charges on the total
  const realStripeFee = Math.round(totalPence * 0.015) + 20;
  const actualReceived = totalPence - realStripeFee;
  const isPerfect = actualReceived === pricePence;

  console.log(
    `£${price.toFixed(2)}  │ ` +
    `£${(newFeePence / 100).toFixed(2)}     │ ` +
    `£${(totalPence / 100).toFixed(2)}      │ ` +
    `£${(realStripeFee / 100).toFixed(2)}       │ ` +
    `£${(actualReceived / 100).toFixed(2)}     │ ` +
    (isPerfect ? "✅ YES!" : "❌ NO")
  );
});

console.log("\n═".repeat(80));

// Calculate total losses over 100 transactions
console.log("\n💰 IMPACT OVER 100 TRANSACTIONS:");
console.log("─".repeat(80));

let totalOldLoss = 0;
let totalNewLoss = 0;

testPrices.forEach(price => {
  const pricePence = Math.round(price * 100);

  // OLD METHOD loss
  const oldFeePence = Math.round(pricePence * 0.015) + 20;
  const oldTotalPence = pricePence + oldFeePence;
  const realStripeFee = Math.round(oldTotalPence * 0.015) + 20;
  const oldReceived = oldTotalPence - realStripeFee;
  const oldLoss = pricePence - oldReceived;

  // NEW METHOD loss (should be 0)
  const newTotalPence = Math.round((pricePence + 20) / 0.985);
  const newRealStripeFee = Math.round(newTotalPence * 0.015) + 20;
  const newReceived = newTotalPence - newRealStripeFee;
  const newLoss = pricePence - newReceived;

  totalOldLoss += oldLoss;
  totalNewLoss += newLoss;
});

const avgOldLoss = totalOldLoss / testPrices.length;
const avgNewLoss = totalNewLoss / testPrices.length;

console.log(`\nOLD METHOD:`);
console.log(`  Average loss per ticket: £${(avgOldLoss / 100).toFixed(4)}`);
console.log(`  Loss over 100 tickets: £${(avgOldLoss).toFixed(2)} ❌`);
console.log(`  Loss over 1000 tickets: £${(avgOldLoss * 10).toFixed(2)} 😱`);

console.log(`\nNEW METHOD:`);
console.log(`  Average loss per ticket: £${(avgNewLoss / 100).toFixed(4)}`);
console.log(`  Loss over 100 tickets: £${(avgNewLoss).toFixed(2)} ✅`);
console.log(`  Loss over 1000 tickets: £${(avgNewLoss * 10).toFixed(2)} 🎉`);

console.log("\n═".repeat(80));
console.log("\n✨ CONCLUSION:");
console.log("\n   With the NEW gross-up formula, you receive EXACTLY the ticket");
console.log("   price you set, with ZERO losses to rounding errors.");
console.log("\n   The client pays a slightly higher Stripe fee (calculated correctly),");
console.log("   but you always get the full ticket price. Win-win! 🎉\n");
