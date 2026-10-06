import { db } from '@/lib/db';
import { recharges, accessoryOrders, customers } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { verifyPayuResponseHash } from '@/lib/payments/payu';
import { notifyAdmin } from '@/lib/push';
import { clearDue } from '@/lib/payments/clearDue';
import { sendPaymentAlertEmail } from '@/lib/email';

// Applies a hash-verified PayU result to its order. Shared by the browser
// callback (surl/furl) and the server-to-server webhook, which can both
// arrive for the same txn — the status='pending' guard on the UPDATE makes
// sure only the first one marks it, clears dues and notifies the admin.
// Returns false if the payload failed hash verification.
export async function settlePayuResult(fields: Record<string, string>): Promise<boolean> {
  const { txnid, udf1, status } = fields;
  if (!txnid || !verifyPayuResponseHash(fields)) {
    console.error('PayU: invalid hash or missing txnid', { txnid, udf1 });
    return false;
  }

  const success = status === 'success';
  const reference = fields.mihpayid || txnid;
  const update = { status: success ? 'paid' : 'failed', upi_reference: reference, paid_at: success ? new Date() : null };

  if (udf1 === 'accessory') {
    const updated = await db
      .update(accessoryOrders)
      .set(update)
      .where(and(eq(accessoryOrders.id, txnid), eq(accessoryOrders.status, 'pending')))
      .returning();

    if (success && updated.length > 0) {
      const order = updated[0];
      const customer = await db.select().from(customers).where(eq(customers.id, order.customer_id)).limit(1);
      if (customer.length > 0) {
        await notifyAdmin({
          title: '📦 Payment Received — Verify & Deliver',
          body: `${customer[0].name} ne ₹${(order.amount / 100).toFixed(0)} ka ${order.accessory_name} PayU se pay kiya. Deliver karein.`,
          url: '/admin/deliveries',
          tag: `accessory-${order.id}`,
        });
        await sendPaymentAlertEmail({
          item: order.accessory_name,
          amountPaise: order.amount,
          orderId: order.id,
          payuId: reference,
          customerId: customer[0].id,
          customerName: customer[0].name,
          mobile: customer[0].mobile,
          stbNumber: customer[0].stb_number,
        });
      }
    }
    return true;
  }

  // Everything else (recharge, due, alacarte, fast-recharge, guest) lives in `recharges`.
  const updated = await db
    .update(recharges)
    .set(update)
    .where(and(eq(recharges.id, txnid), eq(recharges.status, 'pending')))
    .returning();

  if (success && updated.length > 0) {
    const recharge = updated[0];
    await clearDue(recharge.customer_id, recharge.due_amount_paise);

    const customer = await db.select().from(customers).where(eq(customers.id, recharge.customer_id)).limit(1);
    if (customer.length > 0) {
      await notifyAdmin({
        title: '💳 Payment Received — Verify & Activate',
        body: `${customer[0].name} ne ₹${(recharge.amount / 100).toFixed(0)} ka ${recharge.plan_name} PayU se pay kiya. Activate karein.`,
        url: '/admin/pending',
        tag: `recharge-${recharge.id}`,
      });
      await sendPaymentAlertEmail({
        item: recharge.plan_name,
        amountPaise: recharge.amount,
        orderId: recharge.id,
        payuId: reference,
        customerId: customer[0].id,
        customerName: customer[0].name,
        mobile: customer[0].mobile,
        stbNumber: customer[0].stb_number,
      });
    }
  }
  return true;
}

// Where to send the customer after a PayU result — shared by the browser
// callback and the bolt.js confirm endpoint so both land on the same screen.
// /dashboard?order_id= shows the "activation in progress" timer for a paid
// recharge; /recharge-status does the same for the no-login guest flow.
export async function payuReturnPath(fields: Record<string, string>, valid: boolean): Promise<string> {
  const { txnid = '', udf1, udf2, status } = fields;
  const id = encodeURIComponent(txnid);
  const failed = !valid || status !== 'success';

  if (udf2 === 'guest') {
    return failed ? `/recharge-status?order_id=${id}&payment=failed` : `/recharge-status?order_id=${id}`;
  }
  if (failed) return '/dashboard?payment=failed';
  if (udf1 === 'accessory') return '/dashboard?payment=success&type=accessory';

  const [recharge] = await db.select({ plan_name: recharges.plan_name }).from(recharges).where(eq(recharges.id, txnid)).limit(1);
  return recharge?.plan_name === 'Due Payment' ? `/dashboard?order_id=${id}&type=due` : `/dashboard?order_id=${id}`;
}
