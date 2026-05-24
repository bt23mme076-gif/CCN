# Cashfree Payment Gateway Setup Guide

## 🎉 Migration Complete: Razorpay → Cashfree

Your application has been successfully migrated from Razorpay to Cashfree payment gateway!

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Cashfree Account

1. **Visit**: https://merchant.cashfree.com/merchants/signup
2. **Sign Up** with your business details
3. **Complete KYC** (if required for production)
4. **Verify** your email and phone number

### Step 2: Get API Credentials

1. **Login** to Cashfree Dashboard: https://merchant.cashfree.com/merchants/login
2. **Navigate** to: Developers → API Keys
3. **Copy** your credentials:
   - **App ID**: Starts with your merchant ID
   - **Secret Key**: Long alphanumeric string

### Step 3: Update Environment Variables

Open `c:\CCN\.env` and update:

```env
# Cashfree Credentials
CASHFREE_APP_ID=your_actual_app_id_here
CASHFREE_SECRET_KEY=your_actual_secret_key_here
CASHFREE_ENV=sandbox

# Public Environment
NEXT_PUBLIC_CASHFREE_ENV=sandbox
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Run Database Migration

```bash
# Connect to your database and run the migration
psql $DATABASE_URL -f drizzle/migrate-to-cashfree.sql

# Or use your preferred database client to execute:
# drizzle/migrate-to-cashfree.sql
```

### Step 5: Restart Application

```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

---

## 🧪 Testing

### Sandbox Mode (Development)

Cashfree provides a sandbox environment for testing:

**Test Cards**:
- **Card Number**: 4111 1111 1111 1111
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **OTP**: 123456

**Test UPI**:
- **UPI ID**: success@upi
- **Status**: Will show success

**Test Netbanking**:
- Select any bank
- Use test credentials provided on payment page

### Production Mode

Once testing is complete:

1. **Complete KYC** on Cashfree dashboard
2. **Get Production Keys** from API Keys section
3. **Update `.env`**:
   ```env
   CASHFREE_ENV=production
   NEXT_PUBLIC_CASHFREE_ENV=production
   NEXT_PUBLIC_APP_URL=https://ccn.atyant.in
   ```
4. **Restart** application

---

## 📊 What Changed?

### Database Schema
```sql
-- Old (Razorpay)
razorpay_order_id
razorpay_payment_id
razorpay_signature

-- New (Cashfree)
cashfree_order_id
cashfree_payment_id
cashfree_signature
```

### API Endpoints
- ✅ `/api/recharge/create-order` - Updated to Cashfree
- ✅ `/api/recharge/verify-payment` - Updated to Cashfree
- ✅ `/api/cashfree/webhook` - New webhook endpoint (was `/api/razorpay/webhook`)

### Frontend Components
- ✅ `PaymentModal.tsx` - Now uses Cashfree JS SDK
- ✅ Payment button text: "Pay with Cashfree"
- ✅ Home page: "Secured with Cashfree payment gateway"

### Dependencies
```json
// Removed
"razorpay": "^2.9.4"

// Added
"cashfree-pg": "^2.x.x"
"@cashfreepayments/cashfree-js": "^1.x.x"
```

---

## 🔧 Configuration Details

### Environment Variables

#### Required Variables:
```env
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_ENV=sandbox|production
```

#### Public Variables:
```env
NEXT_PUBLIC_CASHFREE_ENV=sandbox|production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Other Variables (unchanged):
```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

### Webhook Configuration

1. **Login** to Cashfree Dashboard
2. **Navigate** to: Developers → Webhooks
3. **Add Webhook URL**:
   - **Sandbox**: `http://your-domain.com/api/cashfree/webhook`
   - **Production**: `https://ccn.atyant.in/api/cashfree/webhook`
4. **Select Events**:
   - ✅ PAYMENT_SUCCESS_WEBHOOK
   - ✅ PAYMENT_FAILED_WEBHOOK (optional)
5. **Save** configuration

---

## 💡 Key Features

### Cashfree Advantages

1. **Lower Transaction Fees**
   - Competitive pricing compared to Razorpay
   - No setup fees
   - No annual maintenance charges

2. **Better Success Rates**
   - Multiple payment routing
   - Smart retry mechanism
   - Optimized for Indian payments

3. **More Payment Methods**
   - UPI (all apps)
   - Cards (Visa, Mastercard, Amex, Rupay)
   - Net Banking (all major banks)
   - Wallets (Paytm, PhonePe, etc.)
   - EMI options
   - Pay Later options

4. **Instant Settlements**
   - Same-day settlements available
   - Faster than most competitors

5. **Better Dashboard**
   - Real-time analytics
   - Detailed transaction reports
   - Easy refund management

---

## 🔐 Security

### PCI DSS Compliance
- Cashfree is PCI DSS Level 1 certified
- All card data is encrypted
- No card details stored on your server

### Webhook Security
- Signature verification implemented
- Timestamp validation
- HTTPS required for production

### Best Practices
- ✅ Never expose Secret Key in frontend
- ✅ Always verify payment on server-side
- ✅ Use HTTPS in production
- ✅ Validate webhook signatures
- ✅ Log all transactions

---

## 📱 Payment Flow

### Customer Journey:

```
1. Customer selects plan
   ↓
2. Clicks "Recharge Now"
   ↓
3. Payment modal opens
   ↓
4. Clicks "Pay with Cashfree"
   ↓
5. Cashfree checkout opens
   ↓
6. Customer selects payment method (UPI/Card/NetBanking)
   ↓
7. Completes payment
   ↓
8. Redirected back to dashboard
   ↓
9. Payment verified automatically
   ↓
10. Recharge marked as "Paid"
   ↓
11. Admin activates from pending list
   ↓
12. Customer's plan activated
```

---

## 🛠️ Troubleshooting

### Issue 1: "Payment gateway not configured"

**Solution**:
- Check if `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` are set in `.env`
- Verify no extra spaces in environment variables
- Restart the server after updating `.env`

### Issue 2: Payment modal not opening

**Solution**:
- Check browser console for errors
- Verify `NEXT_PUBLIC_CASHFREE_ENV` is set
- Clear browser cache
- Try in incognito mode

### Issue 3: Payment success but not reflecting

**Solution**:
- Check webhook configuration
- Verify webhook URL is accessible
- Check server logs for webhook errors
- Manually verify payment in admin panel

### Issue 4: Database migration failed

**Solution**:
```sql
-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'recharges';

-- If old columns still exist, run migration again
-- If new columns exist, migration was successful
```

---

## 📞 Support

### Cashfree Support
- **Email**: care@cashfree.com
- **Phone**: +91-80-61160000
- **Docs**: https://docs.cashfree.com/
- **Dashboard**: https://merchant.cashfree.com/

### Common Questions

**Q: Do I need to pay to use Cashfree?**
A: No signup fees. Cashfree charges a small percentage per transaction (usually 1.5-2% + GST).

**Q: Can I test without real keys?**
A: Yes! Use sandbox mode with test credentials.

**Q: How long does KYC take?**
A: Usually 24-48 hours for business verification.

**Q: Can I use sandbox keys in production?**
A: No! Sandbox keys are for testing only. Use production keys for live transactions.

**Q: What happens to old Razorpay payments?**
A: Old payment records remain in database. Only new payments will use Cashfree.

---

## ✅ Migration Checklist

### Pre-Migration (Completed ✅)
- [x] Uninstalled Razorpay package
- [x] Installed Cashfree packages
- [x] Updated database schema
- [x] Updated API routes
- [x] Updated frontend components
- [x] Updated environment variables
- [x] Created migration SQL file

### Post-Migration (Your Tasks)
- [ ] Create Cashfree account
- [ ] Get API credentials
- [ ] Update `.env` file with real keys
- [ ] Run database migration
- [ ] Restart application
- [ ] Test payment flow in sandbox
- [ ] Configure webhooks
- [ ] Complete KYC (for production)
- [ ] Switch to production mode
- [ ] Test live payment

---

## 🎯 Quick Reference

### Cashfree Dashboard URLs
- **Signup**: https://merchant.cashfree.com/merchants/signup
- **Login**: https://merchant.cashfree.com/merchants/login
- **API Keys**: Dashboard → Developers → API Keys
- **Webhooks**: Dashboard → Developers → Webhooks
- **Transactions**: Dashboard → Transactions
- **Settlements**: Dashboard → Settlements

### Test Credentials (Sandbox)
```
Card: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
OTP: 123456

UPI: success@upi
```

### Environment Variables Template
```env
# Cashfree
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_ENV=sandbox
NEXT_PUBLIC_CASHFREE_ENV=sandbox
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (unchanged)
DATABASE_URL=your_database_url

# JWT (unchanged)
JWT_SECRET=your_jwt_secret
```

---

## 📈 Next Steps

1. **Immediate** (Today):
   - [ ] Get Cashfree credentials
   - [ ] Update `.env` file
   - [ ] Run migration
   - [ ] Test in sandbox

2. **Short Term** (This Week):
   - [ ] Complete KYC
   - [ ] Configure webhooks
   - [ ] Test all payment methods
   - [ ] Train team on new dashboard

3. **Before Production**:
   - [ ] Get production keys
   - [ ] Update production environment variables
   - [ ] Test with small amounts
   - [ ] Monitor first few transactions

---

**Migration Date**: 2024  
**Status**: ✅ Code Migration Complete  
**Next**: Configure Cashfree Account & Test

**Need Help?** Check the troubleshooting section or contact Cashfree support!

