# Stripe Balance Fix - Orders #35 & #36

## Problem

Admin account showed £9.60 available for withdrawal, but Stripe showed £9.44. This created a £0.16 discrepancy.

## Root Cause

Orders #35 and #36 were placed **BEFORE** we added Stripe processing fees to the checkout flow. This meant:

- Customers only paid £5.00 per ticket
- Stripe deducted their fees (£0.28 per ticket) from this amount
- But the database calculated earnings as if the full £5.00 was received

## The Math

### Before Fix (WRONG):
```
Customer paid: £5.00
Platform fee (4%): £0.20
Instructor earnings: £4.80
---
Total for 2 tickets: £9.60 ← This is what DB showed
```

### After Fix (CORRECT):
```
Customer paid: £5.00
Stripe fee (1.5% + 20p): £0.28
Net after Stripe: £4.72
Platform fee (4% of £4.72): £0.19
Instructor earnings: £4.53
---
Total for 2 tickets: £9.06 ← This is correct
```

## Current State

All database tables now show consistent values:

| Table | Amount | Description |
|-------|--------|-------------|
| **eventTickets** | £9.06 | £4.53 per ticket × 2 |
| **ledgerTransactions** | £9.06 | £4.53 per earning × 2 |
| **balances.currentBalance** | £9.06 | Total available for withdrawal |
| **balances.totalEarned** | £9.06 | Lifetime earnings |
| **Stripe Balance** | £9.44 | Gross before platform fees |

## Why Stripe Shows £9.44

The £0.38 difference between Stripe (£9.44) and Database (£9.06) represents the **platform fees**:

```
Customers paid: £10.00 (2 × £5.00)
Stripe fees: -£0.56
Stripe balance: £9.44 ← What you see in Stripe
Platform fees: -£0.38 (2 × £0.19)
Instructor earnings: £9.06 ← What instructor can withdraw
```

**This is CORRECT behavior:**
- Stripe shows money before platform fees are deducted
- Database shows money after platform fees (what instructor actually gets)
- The platform keeps £0.38 as commission

## Files Modified

### Scripts Created:
1. `scripts/fix-stripe-fee-discrepancy.ts` - Fixed ticket earnings
2. `scripts/fix-balance-complete.ts` - Fixed ledger and balance tables
3. `scripts/check-balance-discrepancy.ts` - Verification script

### Database Changes:
```sql
-- Updated event tickets
UPDATE eventTickets SET
  platformFee = '0.19',
  instructorEarnings = '4.53'
WHERE id IN (9, 10);

-- Updated ledger transactions
UPDATE ledgerTransactions SET
  amount = '4.53',
  description = 'Sale: SABOR (Order #35) - Adjusted for Stripe fees'
WHERE orderId IN (35, 36);

-- Updated balance
UPDATE balances SET
  currentBalance = '9.06',
  totalEarned = '9.06'
WHERE userId = 2;
```

## Future Prevention

This issue is now prevented because:
1. ✅ Customers now pay Stripe fees in checkout (added in recent commit)
2. ✅ Webhook correctly calculates earnings after Stripe fees
3. ✅ All future transactions will be accurate

## Summary

✅ **Database balance now matches reality**: £9.06 can be safely withdrawn
✅ **Stripe balance**: £9.44 (includes £0.38 platform commission)
✅ **Platform earned**: £0.38 in commission (2 × £0.19)
✅ **All tables consistent**: eventTickets, ledgerTransactions, balances

The discrepancy is **RESOLVED**. Admin can withdraw £9.06, and Stripe will have sufficient funds (£9.44 - £0.38 = £9.06).
