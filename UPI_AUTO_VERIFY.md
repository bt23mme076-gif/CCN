# UPI Auto-Verify (zero-fee payments, no manual checking)

Customers pay straight to the PhonePe Business UPI ID (`UPI_VPA`). The website confirms each payment
automatically from the bank SMS / PhonePe Business notification, so PayU fees can be switched off.

## Customer flow
1. Customer taps **Pay** on any plan, à-la-carte, due, guest recharge, accessory or live-ad booking.
2. **Android:** the UPI app opens by itself with the amount filled in. **iPhone:** tap GPay / PhonePe.
   **Computer:** scan the QR.
3. The amount has a few unique paise added (₹699 → ₹699.87). This identifies the order — the customer
   types nothing.
4. The popup turns to **✓ Payment received** within seconds and goes to the usual activation screen.
   If nothing arrives in 2 minutes, an **"I've already paid"** button appears (the old manual-check flow).

## Admin
- Push + email: **"✅ UPI Payment Verified — Activate"** with the bank reference. Activate as usual.
- Pending page shows **✅ UPI bank-verified** or **⚠ not verified yet** (customer tapped "I've paid" —
  check PhonePe Business before activating).
- An "I've paid" claim **never clears a customer's due by itself**. The due is cleared when the bank
  message confirms the payment, when you **Activate** the order, or when you tap **Mark payment received**
  (for due-only payments, which have nothing to activate). Whatever the customer types is not trusted.
- Accessory and live-ad claims are flagged "not bank-verified yet" in the alert — check before delivering/approving.
- **"💰 UPI Payment Received — No Matching Order"**: money arrived but the customer edited the amount or
  paid more than 60 minutes later. Find their pending order and activate it manually.

## One-time setup
1. **Create the tables** — Superadmin → Run migrations (or `npm run add-upi-auto-verify-tables`).
   Adds `upi_payment_intents` and `upi_credits`; existing tables are untouched.
2. **Set env vars** on the server (Dokploy/Vercel) and redeploy:
   - `SMS_WEBHOOK_SECRET` — a long random string
   - optional `UPI_SMS_ALLOWED_SENDERS` — e.g. `HDFCBK,PhonePe` to trust only those senders
3. **On the operator's Android phone** (the one that gets the bank SMS / has PhonePe Business), install an
   SMS + notification forwarder app (e.g. "SMS Forwarder" / "Notification Forwarder" from the Play Store):
   - URL: `https://ccn.atyant.in/api/upi/sms?key=<SMS_WEBHOOK_SECRET>`
   - Method `POST`, JSON body: `{"from":"%sender%","message":"%text%"}` (placeholder names vary by app;
     accepted keys: `message|msg|text|body|content|sms|notification` and `from|sender|address|app|title`)
   - Forward: bank credit SMS **and/or** PhonePe Business "Received ₹…" notifications.
   - Disable battery optimisation for the app so it keeps running.
4. **Turn PayU off** — Superadmin → Settings → PayU off. Everyone then pays by direct UPI (0% fee).
5. **Test with ₹1–₹10** using the test plan: pay from another person's UPI and watch the popup confirm.

## Security
- Only SMS from bank sender IDs / app names are trusted. SMS from ordinary phone numbers are ignored
  (a customer could otherwise text a fake "credited" message to the operator's phone).
- A credit must match the exact unique amount of an order created in the last 60 minutes.
- The same UTR / identical notification is never counted twice.
- If the tables are missing or all 99 paise slots for a price are busy, checkout falls back to the old
  plain-UPI + "Confirm Payment" flow — payments never break.

## Code
- `lib/payments/upiAuto.ts` — unique amounts, matching, marking orders paid
- `lib/payments/smsParser.ts` — reads SBI/HDFC/ICICI/Axis/Kotak SMS and PhonePe notifications
  (`npx tsx --test lib/payments/smsParser.test.ts`)
- `app/api/upi/sms` — forwarder webhook · `app/api/upi/status/[orderId]` — popup polling
- `components/UpiPaymentModal.tsx` — the popup
