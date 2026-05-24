# 🚀 Quick Fix: Razorpay Authentication Error

## ❌ Current Error
```
Create order error: {statusCode: 401, error: { description: 'Authentication failed' }}
```

## ✅ Solution (5 Minutes)

### Step 1: Get Razorpay Keys
1. Go to: **https://dashboard.razorpay.com/app/keys**
2. Login or Sign Up
3. Copy your **Key ID** (starts with `rzp_test_` or `rzp_live_`)
4. Click "Generate Secret" and copy **Key Secret**

### Step 2: Update `.env` File
Open `c:\CCN\.env` and replace:

```env
# Replace these lines:
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx

# With your actual keys:
RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_HERE
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_SECRET_HERE
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_HERE
```

### Step 3: Restart Server
```bash
# Press Ctrl+C to stop
# Then start again:
npm run dev
```

### Step 4: Test
1. Login as customer
2. Select a plan
3. Click "Recharge Now"
4. Payment modal should open
5. Use test card: `4111 1111 1111 1111`

---

## 🔗 Useful Links

- **Get API Keys**: https://dashboard.razorpay.com/app/keys
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details/
- **Full Guide**: See `RAZORPAY_SETUP_GUIDE.md`

---

## 💡 Don't Have Razorpay Account?

**Temporary Workaround**:
1. Customers contact you via WhatsApp: +91 93999 74696
2. They pay via UPI/Bank transfer
3. You manually activate in Admin Panel → Pending Activations

**This works until you set up Razorpay!**

---

## 📞 Need Help?

- **Razorpay Support**: support@razorpay.com
- **Phone**: +91-80-61159600
- **Your WhatsApp**: +91 93999 74696

