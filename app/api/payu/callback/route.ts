import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recharges, accessoryOrders, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPayuResponseHash } from '@/lib/payments/payu';
import { sendPushToAdmin } from '@/lib/push';
import { clearDue } from '@/lib/payments/clearDue';

export const dynamic = 'force-dynamic';

// PayU posts here for both success (surl) and failure (furl) — same endpoint,
// differentiated by the `status` field. This is the authoritative, hash-verified
// confirmation; any client-side responseHandler in bolt.js is just UI, not state.
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectTo = (path: string) => NextResponse.redirect(`${origin}${path}`, { status: 303 });

  let fields: Record<string, string> = {};
  try {
    const formData = await request.formData();
    formData.forEach((value, key) => { fields[key] = String(value); });
  } catch {
    return redirectTo('/');
  }

  const { txnid, udf1, udf2, status } = fields;
  const isGuest = udf2 === 'guest';

  if (!txnid || !verifyPayuResponseHash(fields)) {
    console.error('PayU callback: invalid hash or missing txnid', { txnid, udf1 });
    return redirectTo(isGuest ? `/recharge-status?order_id=${txnid || ''}` : '/dashboard');
  }

  const success = status === 'success';
  const reference = fields.mihpayid || txnid;

  if (udf1 === 'accessory') {
    const order = await db.select().from(accessoryOrders).where(eq(accessoryOrders.id, txnid)).limit(1);
    if (order.length > 0 && order[0].status === 'pending') {
      await db
        .update(accessoryOrders)
        .set({ status: success ? 'paid' : 'failed', upi_reference: reference, paid_at: success ? new Date() : null })
        .where(eq(accessoryOrders.id, txnid));

      if (success) {
        const customer = await db.select().from(customers).where(eq(customers.id, order[0].customer_id)).limit(1);
        if (customer.length > 0) {
          sendPushToAdmin({
            title: '📦 Payment Received — Verify & Deliver',
            body: `${customer[0].name} ne ₹${(order[0].amount / 100).toFixed(0)} ka ${order[0].accessory_name} PayU se pay kiya. Deliver karein.`,
            url: '/admin/deliveries',
          });
        }
      }
    }
    return redirectTo(`/dashboard?order_id=${txnid}`);
  }

  // Everything else (recharge, due, alacarte, fast-recharge, guest) lives in `recharges`.
  const recharge = await db.select().from(recharges).where(eq(recharges.id, txnid)).limit(1);
  if (recharge.length === 0) {
    return redirectTo(isGuest ? `/recharge-status?order_id=${txnid}` : '/dashboard');
  }

  if (recharge[0].status === 'pending') {
    await db
      .update(recharges)
      .set({ status: success ? 'paid' : 'failed', upi_reference: reference, paid_at: success ? new Date() : null })
      .where(eq(recharges.id, txnid));

    if (success) {
      await clearDue(recharge[0].customer_id, recharge[0].due_amount_paise);

      const customer = await db.select().from(customers).where(eq(customers.id, recharge[0].customer_id)).limit(1);
      if (customer.length > 0) {
        sendPushToAdmin({
          title: '💳 Payment Received — Verify & Activate',
          body: `${customer[0].name} ne ₹${(recharge[0].amount / 100).toFixed(0)} ka ${recharge[0].plan_name} PayU se pay kiya. Activate karein.`,
          url: '/admin/pending',
        });
      }
    }
  }

  return redirectTo(isGuest ? `/recharge-status?order_id=${txnid}` : `/dashboard?order_id=${txnid}`);
}
