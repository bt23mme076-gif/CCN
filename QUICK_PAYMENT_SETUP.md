# 🚀 Quick Payment Setup - Start Collecting Payments NOW!

## ⚡ 5-Minute Setup

### Step 1: Get Cashfree Credentials (2 minutes)

1. **Go to**: https://merchant.cashfree.com/merchants/signup
2. **Sign up** with:
   - Business Email
   - Phone Number
   - Business Name
3. **Verify** email and phone
4. **Login** to dashboard
5. **Go to**: Developers → API Keys
6. **Copy**:
   - App ID (looks like: `12345abcdef67890`)
   - Secret Key (long string)

### Step 2: Update .env File (1 minute)

Open `c:\CCN\.env` and replace:

```env
# Replace these lines:
CASHFREE_APP_ID=your_app_id_here
CASHFREE_SECRET_KEY=your_secret_key_here

# With your actual credentials:
CASHFREE_APP_ID=12345abcdef67890
CASHFREE_SECRET_KEY=your_actual_secret_key_from_dashboard
```

### Step 3: Run Database Migration (1 minute)

```bash
# Option 1: Using psql
psql postgresql://postgres.rsvetmwgqhxisloklsau:123456789nitinrai22082004@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres -f drizzle/migrate-to-cashfree.sql

# Option 2: Using Supabase Dashboard
# 1. Go to: https://supabase.com/dashboard/project/rsvetmwgqhxisloklsau/sql
# 2. Copy content from drizzle/migrate-to-cashfree.sql
# 3. Paste and click "Run"
```

### Step 4: Restart Server (30 seconds)

```bash
# Press Ctrl+C to stop
npm run dev
```

### Step 5: Test Payment (1 minute)

1. **Login** as customer
2. **Select** a plan
3. **Click** "Recharge Now"
4. **Use test card**:
   - Card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: `12/25`
   - OTP: `123456`

---

## 🎯 Current Status

### ✅ What's Working
- Customer registration
- Plan selection
- Payment modal
- Admin panel
- Manual activation

### ⚠️ What Needs Setup
- Cashfree credentials (5 minutes)
- Database migration (1 minute)

---

## 💰 Alternative: Manual Payment Collection

If you want to start collecting payments RIGHT NOW without Cashfree setup:

### Option 1: UPI Payment Link

1. **Customer contacts you** via WhatsApp
2. **You send** UPI payment link or QR code
3. **Customer pays** via any UPI app
4. **You activate** manually in admin panel

### Option 2: Bank Transfer

1. **Share bank details** with customer
2. **Customer transfers** money
3. **You verify** payment
4. **You activate** in admin panel

### How to Activate Manually:

1. **Login**: http://localhost:3000/admin/login
2. **Go to**: Pending Activations
3. **Find** customer's recharge
4. **Click**: Activate button
5. **Done**: Customer's plan is active!

---

## 🔧 Troubleshooting

### "Payment gateway not configured"

**Cause**: Cashfree credentials not set

**Fix**:
```env
# Check .env file has:
CASHFREE_APP_ID=your_actual_app_id
CASHFREE_SECRET_KEY=your_actual_secret_key
CASHFREE_ENV=sandbox
```

### "Failed to create order"

**Cause**: Database migration not run

**Fix**: Run the migration SQL file (see Step 3 above)

### Payment modal not opening

**Cause**: Frontend environment variable missing

**Fix**:
```env
# Add to .env:
NEXT_PUBLIC_CASHFREE_ENV=sandbox
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📞 Quick Links

- **Cashfree Signup**: https://merchant.cashfree.com/merchants/signup
- **Cashfree Login**: https://merchant.cashfree.com/merchants/login
- **Supabase SQL Editor**: https://supabase.com/dashboard/project/rsvetmwgqhxisloklsau/sql
- **Admin Panel**: http://localhost:3000/admin/login

---

## 🎉 You're Almost There!

Just 5 minutes to start collecting online payments!

**Next Step**: Get Cashfree credentials from the signup link above.

