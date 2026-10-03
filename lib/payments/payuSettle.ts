import { db } from '@/lib/db';
import { recharges, accessoryOrders, customers } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { verifyPayuResponseHash } from '@/lib/payments/payu';
import { sendPushToAdmin } from '@/lib/push';
import { clearDue } from '@/lib/payments/clearDue';

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
        sendPushToAdmin({
          title: '📦 Payment Received — Verify & Deliver',
          body: `${customer[0].name} ne ₹${(order.amount / 100).toFixed(0)} ka ${order.accessory_name} PayU se pay kiya. Deliver karein.`,
          url: '/admin/deliveries',
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
      sendPushToAdmin({
        title: '💳 Payment Received — Verify & Activate',
        body: `${customer[0].name} ne ₹${(recharge.amount / 100).toFixed(0)} ka ${recharge.plan_name} PayU se pay kiya. Activate karein.`,
        url: '/admin/pending',
      });
    }
  }
  return true;
}
