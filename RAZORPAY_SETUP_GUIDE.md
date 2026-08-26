# Razorpay Setup Guide - Fix Payment Authentication Error

## 🚨 Current Issue

You're seeing this error in your logs:
```
Create order error: {statusCode: 401, error: { description: 'Authentication failed', code: 'BAD_REQUEST_ERROR' }}
```

**Reason**: The Razorpay API keys in your `.env` file are placeholder/test values, not real keys.

---

## ✅ Solution: Get Real Razorpay API Keys

### Step 1: Create/Login to Razorpay Account

1. **Go to Razorpay Dashboard**:
   - Visit: https://dashboard.razorpay.com/
   
2. **Sign Up or Login**:
   - If you don't have an account, sign up with your business details
   - If you have an account, login with your credentials

3. **Complete KYC** (if required):
   - Razorpay may require business verification
   - Submit required documents
   - Wait for approval (usually 24-48 hours)

### Step 2: Get API Keys

1. **Navigate to API Keys Section**:
   - Go to: https://dashboard.razorpay.com/app/keys
   - Or: Dashboard → Settings → API Keys

2. **Generate Keys**:
   - You'll see two types of keys:
     - **Test Mode Keys**: For testing (starts with `rzp_test_`)
     - **Live Mode Keys**: For production (starts with `rzp_live_`)

3. **Copy Your Keys**:
   - **Key ID**: Looks like `rzp_test_1234567890abcd` or `rzp_live_1234567890abcd`
   - **Key Secret**: Click "Generate Secret" or "Regenerate" to see it
   - **⚠️ IMPORTANT**: Copy the secret immediately - you can't see it again!

### Step 3: Update Your `.env` File

1. **Open** `c:\CCN\.env` file

2. **Replace** the placeholder values:

```env
# OLD (Placeholder values - DON'T USE THESE)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx

# NEW (Your actual keys from Razorpay Dashboard)
RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_SECRET_KEY_HERE
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_ID_HERE
```

**Example with real format** (don't use these exact values):
```env
RAZORPAY_KEY_ID=rzp_test_1A2b3C4d5E6f7G8h
RAZORPAY_KEY_SECRET=9i0J1k2L3m4N5o6P7q8R9s0T
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_1A2b3C4d5E6f7G8h
```

3. **Save** the file

### Step 4: Restart Your Application

```bash
# Stop the current server (Ctrl+C)

# Start again
npm run dev
```

---

## 🧪 Testing vs Production

### Test Mode (Development)
- **Use**: Test mode keys (`rzp_test_...`)
- **When**: During development and testing
- **Payments**: Use test cards (no real money)
- **Test Cards**: 
  - Card: `4111 1111 1111 1111`
  - CVV: Any 3 digits
  - Expiry: Any future date

### Live Mode (Production)
- **Use**: Live mode keys (`rzp_live_...`)
- **When**: After testing, when going live
- **Payments**: Real money transactions
- **Requirements**: 
  - KYC completed
  - Business verified
  - Bank account linked

---

## 📋 Complete `.env` File Example

Here's what your complete `.env` should look like:

```env
# Database Connection (Already Working ✅)
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres

# Razorpay Credentials (UPDATE THESE ⚠️)
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY_HERE

# JWT Secret (Already Set ✅)
JWT_SECRET=244ac9d587dd9414de9b7ace484cfec224e0bc4d2490bc162c898c8220467a18

# Public Razorpay Key (UPDATE THIS ⚠️)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
```

---

## 🔍 How to Verify It's Working

### 1. Check Server Logs
After updating keys and restarting, the error should disappear:
```
✅ No more "Authentication failed" errors
✅ Orders created successfully
```

### 2. Test Payment Flow
1. Login as a customer
2. Go to Plans page
3. Select a plan
4. Click "Recharge Now"
5. Payment modal should open with Razorpay checkout
6. Use test card to complete payment
7. Check if recharge appears in "Pending Activations"

### 3. Check Razorpay Dashboard
- Go to: https://dashboard.razorpay.com/app/payments
- You should see test payments appearing
- Verify order amounts match

---

## 🚨 Important Security Notes

### 1. Keep Keys Secret
- ❌ **NEVER** commit `.env` file to Git
- ❌ **NEVER** share keys publicly
- ❌ **NEVER** expose keys in frontend code
- ✅ Only use `NEXT_PUBLIC_*` for frontend (Key ID only)
- ✅ Keep Secret Key server-side only

### 2. `.env` is Already in `.gitignore`
Your `.gitignore` already includes `.env`, so it won't be committed:
```
.env
.env.local
.env.production.local
```

### 3. Use Environment Variables in Production
When deploying to Dokploy:
- Don't copy `.env` file
- Set environment variables in Dokploy dashboard
- Use production (live) keys for production deployment

---

## 🔄 Switching from Test to Live Mode

### When You're Ready for Production:

1. **Get Live Keys**:
   - Complete KYC on Razorpay
   - Get business verification
   - Generate live mode keys

2. **Update Production Environment**:
   ```env
   # Production .env (on Dokploy)
   RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
   RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET_KEY
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
   ```

3. **Test Thoroughly**:
   - Test with small amounts first
   - Verify webhooks are working
   - Check payment confirmations
   - Test refund process

---

## 🛠️ Troubleshooting

### Issue 1: Still Getting 401 Error
**Solutions**:
- ✅ Verify you copied the correct keys
- ✅ Check for extra spaces in `.env` file
- ✅ Ensure you restarted the server
- ✅ Verify keys are from the correct mode (test/live)
- ✅ Check if keys are active in Razorpay dashboard

### Issue 2: Payment Modal Not Opening
**Solutions**:
- ✅ Check browser console for errors
- ✅ Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
- ✅ Clear browser cache
- ✅ Try in incognito mode

### Issue 3: Payment Success but Not Reflecting
**Solutions**:
- ✅ Check webhook configuration
- ✅ Verify database connection
- ✅ Check admin panel → Pending Activations
- ✅ Look for errors in server logs

### Issue 4: Can't Find API Keys in Dashboard
**Solutions**:
- ✅ Complete account setup first
- ✅ Verify email address
- ✅ Check if account is activated
- ✅ Contact Razorpay support

---

## 📞 Getting Help

### Razorpay Support
- **Email**: support@razorpay.com
- **Phone**: +91-80-61159600
- **Docs**: https://razorpay.com/docs/
- **Dashboard**: https://dashboard.razorpay.com/

### Common Questions

**Q: Do I need to pay to use Razorpay?**
A: No signup fees. Razorpay charges a small percentage per transaction (usually 2% + GST).

**Q: Can I test without real keys?**
A: The app will work, but payments will fail. You need at least test mode keys for testing payments.

**Q: How long does KYC take?**
A: Usually 24-48 hours for business verification.

**Q: Can I use test keys in production?**
A: No! Test keys are for development only. Use live keys for production.

---

## ✅ Quick Checklist

Before going live, ensure:

- [ ] Razorpay account created
- [ ] KYC completed (for live mode)
- [ ] Test mode keys obtained
- [ ] Keys updated in `.env` file
- [ ] Server restarted
- [ ] Test payment completed successfully
- [ ] Payment appears in Razorpay dashboard
- [ ] Recharge appears in admin panel
- [ ] Webhook configured (for automatic activation)
- [ ] Live keys ready for production
- [ ] Production environment variables set

---

## 🎯 Current Status

### What's Working ✅
- Database connection
- User registration
- Admin panel
- Plan management
- Manual recharge activation
- WhatsApp integration
- Mobile responsive design
- Hindi language support

### What Needs Razorpay Keys ⚠️
- Online payment processing
- Automatic payment verification
- Razorpay checkout modal
- Payment webhooks

### Workaround Until Keys Are Set Up
Customers can:
1. Register on the website
2. Select a plan
3. Contact you via WhatsApp (+91 93999 74696)
4. Pay via UPI/Bank transfer
5. You manually activate their recharge in admin panel

---

## 📝 Next Steps

1. **Immediate** (Today):
   - [ ] Create Razorpay account
   - [ ] Get test mode keys
   - [ ] Update `.env` file
   - [ ] Test payment flow

2. **Short Term** (This Week):
   - [ ] Complete KYC
   - [ ] Get live mode keys
   - [ ] Test with real small amounts
   - [ ] Configure webhooks

3. **Before Production**:
   - [ ] Update production environment variables
   - [ ] Switch to live mode keys
   - [ ] Test end-to-end flow
   - [ ] Monitor first few transactions

---

**Last Updated**: 2024  
**Status**: Action Required - Get Razorpay Keys  
**Priority**: High (Required for online payments)

