# 🚀 Koyeb Deployment Checklist

## ✅ Complete These Steps in Order

### **Step 1: Add Encryption Key to Koyeb**

1. Go to https://app.koyeb.com/
2. Click on your app: `uk-sabor-web`
3. Click **"Settings"**
4. Scroll to **"Environment variables"**
5. Click **"+ Add variable"**
6. Add:
   - **Name:** `BANK_ENCRYPTION_KEY`
   - **Value:** `b48191ab65bb97bd8e5f78bfc48cea8c7f903bfd95a0e072f7a9981d6d070cee`
7. Click **"Save"**

⚠️ **CRITICAL:** Save this key somewhere safe (1Password, Bitwarden, etc.)

---

### **Step 2: Fix Email Domain Configuration**

1. Still in **Settings → Environment variables**
2. Find `RESEND_FROM_EMAIL`
3. Click **"Edit"** on that variable
4. Change value to: `UK Sabor <onboarding@resend.dev>`
5. Click **"Save"**

**Why:** Your custom domain `noreply@consabor.uk` is not verified in Resend.
`onboarding@resend.dev` is pre-verified and works immediately.

---

### **Step 3: Redeploy Application**

1. Click **"Redeploy"** button (top right)
2. Wait 2-3 minutes for deployment to complete
3. ✅ Environment variables are now active

---

### **Step 4: Run Database Migration**

You need to add the new bank details columns to your production database.

**Option A: Using Koyeb Console**
1. Go to your Koyeb app
2. Click **"Console"** tab
3. Run:
```bash
psql $DATABASE_URL -c "
ALTER TABLE users ADD COLUMN IF NOT EXISTS \"bankAccountHolderName\" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS \"bankSortCode\" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS \"bankAccountNumber\" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS \"bankDetailsVerified\" BOOLEAN DEFAULT false;
ALTER TABLE \"withdrawalRequests\" ADD COLUMN IF NOT EXISTS \"paymentProofUrl\" TEXT;
"
```

**Option B: Using Local psql** (if you have DATABASE_URL)
```bash
psql YOUR_DATABASE_URL < server/migrations/add-bank-details.sql
```

---

### **Step 5: Verify Deployment**

**Test Registration Emails:**
1. Visit https://www.consabor.uk
2. Register a new test account with your personal email
3. ✅ You should receive welcome email

**Test Email Configuration:**
```bash
curl https://www.consabor.uk/api/email-config
```

Expected output:
```json
{
  "hasResendApiKey": true,
  "apiKeyPreview": "re_bDESrsM...",
  "hasResendFromEmail": true,
  "fromEmail": "UK Sabor <onboarding@resend.dev>",
  "nodeEnv": "production"
}
```

---

### **Step 6: Test Payout System (Optional)**

**As Instructor:**
1. Login to instructor account
2. Go to Settings → Bank Details
3. Add test bank details:
   - Account Holder: Your Name
   - Sort Code: 12-34-56
   - Account Number: 12345678
4. ✅ Should see masked details: `**-**-56`, `****5678`

**As Admin:**
1. Login to admin account
2. Go to Admin Dashboard → Withdrawals
3. ✅ Should see new endpoints available

---

## 📋 Summary of Changes

✅ **Environment Variables Added:**
- `BANK_ENCRYPTION_KEY` - For encrypting bank details

✅ **Environment Variables Updated:**
- `RESEND_FROM_EMAIL` - Changed to verified domain

✅ **Database Columns Added:**
- `users.bankAccountHolderName`
- `users.bankSortCode` (encrypted)
- `users.bankAccountNumber` (encrypted)
- `users.bankDetailsVerified`
- `withdrawalRequests.paymentProofUrl`

---

## 🐛 Troubleshooting

### **Problem: Emails still not working**
**Solution:**
1. Check `RESEND_FROM_EMAIL` is set to `UK Sabor <onboarding@resend.dev>`
2. Verify `RESEND_API_KEY` is set (starts with `re_`)
3. Redeploy the app
4. Test with `/api/email-config`

### **Problem: Cannot decrypt bank details**
**Solution:**
1. Verify `BANK_ENCRYPTION_KEY` is set correctly in Koyeb
2. Key must be exactly: `b48191ab65bb97bd8e5f78bfc48cea8c7f903bfd95a0e072f7a9981d6d070cee`
3. Redeploy after adding key

### **Problem: Database migration failed**
**Solution:**
1. Check DATABASE_URL is accessible
2. Run each ALTER TABLE command individually
3. Verify columns exist: `\d users` in psql

---

## 📄 Documentation Files

- **PAYOUT_SYSTEM_GUIDE.md** - Complete payout system documentation
- **ENCRYPTION_KEY_SETUP.md** - Encryption key details (DO NOT COMMIT)
- **FIX_EMAIL_FROM_ADDRESS.md** - Email domain fix explanation

---

## ✅ Deployment Complete!

Once all steps are done:
- ✅ Registration emails will work
- ✅ Instructors can add bank details (encrypted)
- ✅ Admins can process withdrawals
- ✅ Payout confirmation emails sent automatically

**Next:** Build admin UI for withdrawal approval and proof upload.
