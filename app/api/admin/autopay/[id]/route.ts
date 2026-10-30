import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { autopaySubscriptions, recharges } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { generateOrderId } from '@/lib/utils';
import { sendPushToCustomer } from '@/lib/push';
import { autopayDateLabel, nextMonthlyDebit } from '@/lib/autopay';

export const dynamic = 'force-dynamic';

const MAX_QR_CHARS = 3 * 1024 * 1024; // base64 data URL

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('upload_qr'), qrData: z.string().startsWith('data:image/').max(MAX_QR_CHARS) }),
  z.object({ action: z.literal('confirm') }),
  z.object({ action: z.literal('received') }),
  z.object({ action: z.literal('failed') }),
  z.object({ action: z.literal('cancel') }),
]);

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminAuth();
    const [row] = await db
      .select({ qr_data: autopaySubscriptions.qr_data })
      .from(autopaySubscriptions)
      .where(and(eq(autopaySubscriptions.id, (await params).id), eq(autopaySubscriptions.operator_id, admin.operatorId)))
      .limit(1);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ qr_data: row.qr_data });
  } catch (error) {
    console.error('Get autopay QR error:', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminAuth();
    const id = (await params).id;
    const input = schema.parse(await request.json());

    const [row] = await db.select().from(autopaySubscriptions)
      .where(and(eq(autopaySubscriptions.id, id), eq(autopaySubscriptions.operator_id, admin.operatorId)))
      .limit(1);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (row.status === 'cancelled') return NextResponse.json({ error: 'This AutoPay is cancelled' }, { status: 409 });

    const amountLabel = `₹${(row.amount / 100).toFixed(0)}`;

    if (input.action === 'upload_qr') {
      await db.update(autopaySubscriptions)
        .set({ qr_data: input.qrData, status: row.status === 'requested' ? 'qr_ready' : row.status, updated_at: new Date() })
        .where(eq(autopaySubscriptions.id, id));
      if (row.status === 'requested') {
        await sendPushToCustomer(row.customer_id, {
          title: '🔁 Your AutoPay QR is ready',
          body: `Open your dashboard and scan it with any UPI app to turn on AutoPay for ${row.plan_name} (${amountLabel}/month).`,
          url: '/dashboard',
        });
      }
    } else if (input.action === 'confirm') {
      await db.update(autopaySubscriptions).set({ status: 'active', updated_at: new Date() }).where(eq(autopaySubscriptions.id, id));
      await sendPushToCustomer(row.customer_id, {
        title: '✅ AutoPay is ON',
        body: `${row.plan_name} (${amountLabel}/month) will renew automatically. First debit around ${autopayDateLabel(row.next_debit_date)}.`,
        url: '/dashboard',
      });
    } else if (input.action === 'received' || input.action === 'failed') {
      if (row.status !== 'active') return NextResponse.json({ error: 'AutoPay is not active yet' }, { status: 409 });

      // Moving the due date first (guarded on the old date) means a double
      // click can't record the same month's debit twice.
      const moved = await db.update(autopaySubscriptions)
        .set({
          next_debit_date: nextMonthlyDebit(row.next_debit_date),
          last_debit_at: input.action === 'received' ? new Date() : row.last_debit_at,
          updated_at: new Date(),
        })
        .where(and(eq(autopaySubscriptions.id, id), eq(autopaySubscriptions.next_debit_date, row.next_debit_date)))
        .returning({ id: autopaySubscriptions.id });
      if (moved.length === 0) return NextResponse.json({ error: 'Already recorded' }, { status: 409 });

      if (input.action === 'received') {
        await db.insert(recharges).values({
          id: generateOrderId(),
          operator_id: row.operator_id,
          customer_id: row.customer_id,
          connection_id: row.connection_id,
          plan_id: row.plan_id,
          plan_name: row.plan_name,
          duration_days: row.duration_days,
          amount: row.amount,
          status: 'paid',
          upi_reference: 'AutoPay',
          paid_at: new Date(),
        });
        await sendPushToCustomer(row.customer_id, {
          title: '🔁 AutoPay received',
          body: `We received ${amountLabel} for ${row.plan_name}. Your recharge will be activated shortly.`,
          url: '/dashboard',
        });
      } else {
        await sendPushToCustomer(row.customer_id, {
          title: '⚠️ AutoPay payment failed',
          body: `This month's ${amountLabel} AutoPay for ${row.plan_name} did not go through. Please recharge now to keep watching.`,
          url: '/plans',
        });
      }
    } else {
      await db.update(autopaySubscriptions).set({ status: 'cancelled', updated_at: new Date() }).where(eq(autopaySubscriptions.id, id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error('Update autopay error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
