import { randomInt, randomUUID } from 'crypto';
import { and, desc, eq, gte, inArray, isNull, lt, lte, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { accessoryOrders, customers, recharges, streamAdBookings, upiCredits, upiPaymentIntents } from '@/lib/db/schema';
import { buildUpiLink } from '@/lib/payments/upi';
import { parseCreditMessage } from '@/lib/payments/smsParser';
import { clearDue } from '@/lib/payments/clearDue';
import { notifyAdmin } from '@/lib/push';
import { sendPaymentAlertEmail } from '@/lib/email';

// Direct-UPI auto-verification.
//
// 1. createUpiPayment() gives each UPI checkout a unique amount (price + 1–99
//    paise) and returns the upi:// link for it.
// 2. An SMS-forwarder app on the operator's phone posts the bank credit SMS /
//    PhonePe Business notification to /api/upi/sms → recordUpiCredit().
// 3. The credited amount identifies exactly one pending order, which is
//    marked paid with the bank's UTR — no customer-typed UTR, no manual check.
//
// If the tables aren't migrated yet, checkout falls back to a plain UPI link
// so payments never break.

export type UpiOrderKind = 'recharge' | 'accessory' | 'stream_ad';
type Intent = typeof upiPaymentIntents.$inferSelect;

const MATCH_WINDOW_MS = Number(process.env.UPI_MATCH_WINDOW_MINUTES || 60) * 60_000;
const ALLOWED_SENDERS = (process.env.UPI_SMS_ALLOWED_SENDERS || '')
  .split(',')
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);
const AUTO_REFERENCE = 'UPI-AUTO-VERIFIED'; // used when the notification carries no UTR
// Stored for every customer "I've paid" claim until verified. Its bundled due is
// NOT cleared yet — confirmRechargeClaim() clears it once the money is confirmed.
export const CLAIM_PLACEHOLDER = 'CLAIMED-UNVERIFIED';
// What claims stored before this change. Those already had their due cleared
// at claim time, so they must never be "confirmed" (cleared) a second time.
export const LEGACY_CLAIM = 'N/A';
export const ADMIN_VERIFIED_REFERENCE = 'ADMIN-VERIFIED'; // admin checked PhonePe Business and confirmed

const windowStart = () => new Date(Date.now() - MATCH_WINDOW_MS);
const rupees = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; cause?: { code?: string } } | null;
  return err?.code === '23505' || err?.cause?.code === '23505';
}

/** Creates the payment intent for an order and returns the UPI link with its unique amount. */
export async function createUpiPayment(opts: {
  kind: UpiOrderKind;
  orderId: string;
  amountPaise: number;
  note: string;
}): Promise<{ upiLink: string; payAmountPaise: number }> {
  const { kind, orderId, amountPaise, note } = opts;
  try {
    await db
      .update(upiPaymentIntents)
      .set({ status: 'expired' })
      .where(and(eq(upiPaymentIntents.status, 'pending'), lt(upiPaymentIntents.created_at, windowStart())));

    // Retry on the rare race where two checkouts pick the same paise at once
    // (the partial unique index rejects the second insert).
    for (let attempt = 0; attempt < 5; attempt++) {
      const taken = await db
        .select({ amount: upiPaymentIntents.pay_amount_paise })
        .from(upiPaymentIntents)
        .where(
          and(
            eq(upiPaymentIntents.status, 'pending'),
            gte(upiPaymentIntents.pay_amount_paise, amountPaise + 1),
            lte(upiPaymentIntents.pay_amount_paise, amountPaise + 99),
          ),
        );
      const used = new Set(taken.map((t) => t.amount));
      const free = Array.from({ length: 99 }, (_, i) => amountPaise + i + 1).filter((a) => !used.has(a));
      if (free.length === 0) break;
      const payAmountPaise = free[randomInt(free.length)];

      try {
        await db.insert(upiPaymentIntents).values({
          id: randomUUID(),
          order_kind: kind,
          order_id: orderId,
          amount_paise: amountPaise,
          pay_amount_paise: payAmountPaise,
        });
        return { upiLink: buildUpiLink(payAmountPaise, note), payAmountPaise };
      } catch (e) {
        if (!isUniqueViolation(e)) throw e;
      }
    }
    console.warn('UPI auto-verify: no free paise slot for', orderId);
  } catch (e) {
    console.error('UPI auto-verify unavailable, using plain UPI link:', e);
  }
  return { upiLink: buildUpiLink(amountPaise, note), payAmountPaise: amountPaise };
}

/** 'paid' once the bank credit for this order has been seen. */
export async function getUpiPaymentStatus(orderId: string): Promise<'paid' | 'pending' | 'none'> {
  const [intent] = await db
    .select({ status: upiPaymentIntents.status })
    .from(upiPaymentIntents)
    .where(eq(upiPaymentIntents.order_id, orderId))
    .orderBy(desc(upiPaymentIntents.created_at))
    .limit(1);
  if (!intent) return 'none';
  return intent.status === 'matched' ? 'paid' : 'pending';
}

function isTrustedSender(sender: string) {
  const s = sender.trim().toUpperCase();
  // A customer could text a fake "credited" SMS from their own number — only
  // trust alphanumeric bank sender IDs (VM-HDFCBK) or app names.
  if (!s || /^\+?[\d\s-]+$/.test(s)) return false;
  return ALLOWED_SENDERS.length === 0 || ALLOWED_SENDERS.some((a) => s.includes(a));
}

/** Handles one forwarded SMS / notification. Non-credit or untrusted messages are dropped. */
export async function recordUpiCredit(
  text: string,
  sender: string,
): Promise<{ stored: boolean; reason?: string; matchedOrder?: string | null }> {
  if (!isTrustedSender(sender)) return { stored: false, reason: 'untrusted sender' };
  const parsed = parseCreditMessage(text);
  if (!parsed) return { stored: false, reason: 'not a credit message' };
  const raw = text.slice(0, 500);

  if (!parsed.utr) {
    // Notifications carry no UTR — an identical message within 10 min is a re-forward.
    const dup = await db
      .select({ id: upiCredits.id })
      .from(upiCredits)
      .where(and(eq(upiCredits.raw, raw), gte(upiCredits.received_at, new Date(Date.now() - 10 * 60_000))))
      .limit(1);
    if (dup.length > 0) return { stored: false, reason: 'duplicate' };
  }

  const creditId = randomUUID();
  try {
    await db.insert(upiCredits).values({
      id: creditId,
      amount_paise: parsed.amountPaise,
      utr: parsed.utr ?? null,
      sender: sender.slice(0, 100),
      raw,
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { stored: false, reason: 'duplicate' };
    throw e;
  }

  // Atomic claim: at most one pending intent can have this amount (partial unique index).
  const [intent] = await db
    .update(upiPaymentIntents)
    .set({ status: 'matched', utr: parsed.utr ?? null, matched_at: new Date() })
    .where(
      and(
        eq(upiPaymentIntents.status, 'pending'),
        eq(upiPaymentIntents.pay_amount_paise, parsed.amountPaise),
        gte(upiPaymentIntents.created_at, windowStart()),
      ),
    )
    .returning();

  if (!intent) {
    await notifyAdmin({
      title: '💰 UPI Payment Received — No Matching Order',
      body: `${rupees(parsed.amountPaise)} received${parsed.utr ? ` (UTR ${parsed.utr})` : ''}. The customer may have changed the amount or paid late — find their order in Pending and activate it.`,
      url: '/admin/pending',
      tag: `upi-credit-${creditId}`,
    });
    return { stored: true, matchedOrder: null };
  }

  await db.update(upiCredits).set({ intent_id: intent.id }).where(eq(upiCredits.id, creditId));
  await settleIntent(intent, parsed.utr || AUTO_REFERENCE);
  return { stored: true, matchedOrder: intent.order_id };
}

// Orders still awaiting payment. 'failed' is included so a customer whose
// PayU attempt failed but who then paid by UPI still gets credited;
// 'payment_due' is a recharge the admin marked "not received" (its due is outstanding).
const UNPAID = ['pending', 'failed', 'payment_due'];

async function settleIntent(intent: Intent, reference: string) {
  const paid = { status: 'paid', upi_reference: reference, paid_at: new Date() };
  const amount = rupees(intent.pay_amount_paise);

  if (intent.order_kind === 'accessory') {
    const [order] = await db
      .update(accessoryOrders)
      .set(paid)
      .where(and(eq(accessoryOrders.id, intent.order_id), inArray(accessoryOrders.status, UNPAID)))
      .returning();
    if (!order) return verifyEarlierClaim(intent, reference);

    const [c] = await db.select().from(customers).where(eq(customers.id, order.customer_id)).limit(1);
    if (c) {
      await notifyAdmin({
        title: '✅ UPI Payment Verified — Deliver',
        body: `${c.name} paid ${amount} for ${order.accessory_name} via UPI (bank-verified, ref ${reference}). Please deliver.`,
        url: '/admin/deliveries',
        tag: `accessory-${order.id}`,
      });
      await sendPaymentAlertEmail({
        item: order.accessory_name,
        amountPaise: intent.pay_amount_paise,
        orderId: order.id,
        payuId: `UPI ${reference}`,
        customerId: c.id,
        customerName: c.name,
        mobile: c.mobile,
        stbNumber: c.stb_number,
      });
    }
    return;
  }

  if (intent.order_kind === 'stream_ad') {
    const [booking] = await db
      .update(streamAdBookings)
      .set(paid)
      .where(and(eq(streamAdBookings.id, intent.order_id), inArray(streamAdBookings.status, UNPAID)))
      .returning();
    if (!booking) return verifyEarlierClaim(intent, reference);

    await notifyAdmin({
      title: '✅ Live Ad Booking — UPI Payment Verified',
      body: `${booking.advertiser_name} paid ${amount} for the ${booking.package_name} ad via UPI (bank-verified, ref ${reference}). Please review the banner and approve.`,
      url: '/admin/stream-ads',
      tag: `stream-ad-${booking.id}`,
    });
    await sendPaymentAlertEmail({
      item: `Live Ad - ${booking.package_name}`,
      amountPaise: intent.pay_amount_paise,
      orderId: booking.id,
      payuId: `UPI ${reference}`,
      customerId: '-',
      customerName: booking.business_name ? `${booking.advertiser_name} (${booking.business_name})` : booking.advertiser_name,
      mobile: booking.phone,
      stbNumber: '-',
    });
    return;
  }

  // recharge, due, à-la-carte, fast-recharge and guest orders all live in `recharges`.
  const [recharge] = await db
    .update(recharges)
    .set(paid)
    .where(and(eq(recharges.id, intent.order_id), inArray(recharges.status, UNPAID)))
    .returning();
  if (!recharge) return verifyEarlierClaim(intent, reference);

  await clearDue(recharge.customer_id, recharge.due_amount_paise);
  const [c] = await db.select().from(customers).where(eq(customers.id, recharge.customer_id)).limit(1);
  if (c) {
    await notifyAdmin({
      title: '✅ UPI Payment Verified — Activate',
      body: `${c.name} paid ${amount} for ${recharge.plan_name} via UPI (bank-verified, ref ${reference}). Please activate.`,
      url: '/admin/pending',
      tag: `recharge-${recharge.id}`,
    });
    await sendPaymentAlertEmail({
      item: recharge.plan_name,
      amountPaise: intent.pay_amount_paise,
      orderId: recharge.id,
      payuId: `UPI ${reference}`,
      customerId: c.id,
      customerName: c.name,
      mobile: c.mobile,
      stbNumber: c.stb_number,
    });
  }
}

/**
 * Confirms a customer's unverified "I've paid" recharge claim exactly once —
 * by the bank (SMS match) or by an admin — and only then clears the due that
 * was bundled into it. Returns false if it wasn't an open claim.
 */
export async function confirmRechargeClaim(rechargeId: string, reference: string): Promise<boolean> {
  const [recharge] = await db
    .update(recharges)
    .set({ upi_reference: reference })
    .where(and(eq(recharges.id, rechargeId), eq(recharges.upi_reference, CLAIM_PLACEHOLDER)))
    .returning();
  if (!recharge) return false;
  await clearDue(recharge.customer_id, recharge.due_amount_paise);
  return true;
}

// The customer already tapped "I've paid" (order is 'paid' with an unverified
// reference) — attach the bank's reference so the admin can see it's genuine.
async function verifyEarlierClaim(intent: Intent, reference: string) {
  const set = { upi_reference: reference };
  const id = intent.order_id;
  const confirmedClaim = intent.order_kind === 'recharge' && (await confirmRechargeClaim(id, reference));
  // Otherwise only fill a missing/placeholder reference — never replace a real PayU or bank one.
  const updated = confirmedClaim
    ? [{ id }]
    : intent.order_kind === 'accessory'
      ? await db.update(accessoryOrders).set(set)
          .where(and(eq(accessoryOrders.id, id), or(isNull(accessoryOrders.upi_reference), inArray(accessoryOrders.upi_reference, [CLAIM_PLACEHOLDER, LEGACY_CLAIM]))))
          .returning({ id: accessoryOrders.id })
      : intent.order_kind === 'stream_ad'
        ? await db.update(streamAdBookings).set(set)
            .where(and(eq(streamAdBookings.id, id), or(isNull(streamAdBookings.upi_reference), inArray(streamAdBookings.upi_reference, [CLAIM_PLACEHOLDER, LEGACY_CLAIM]))))
            .returning({ id: streamAdBookings.id })
        : await db.update(recharges).set(set)
            .where(and(eq(recharges.id, id), or(isNull(recharges.upi_reference), inArray(recharges.upi_reference, [CLAIM_PLACEHOLDER, LEGACY_CLAIM]))))
            .returning({ id: recharges.id });
  if (updated.length === 0) return;
  await notifyAdmin({
    title: '✅ UPI Payment Verified',
    body: `Order ${intent.order_id}: ${rupees(intent.pay_amount_paise)} confirmed by the bank (ref ${reference}).`,
    url: intent.order_kind === 'accessory' ? '/admin/deliveries' : intent.order_kind === 'stream_ad' ? '/admin/stream-ads' : '/admin/pending',
    tag: `upi-verified-${intent.order_id}`,
  });
}
