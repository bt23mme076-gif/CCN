import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers, recharges } from '@/lib/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { sendPushToCustomer } from '@/lib/push';
import { clearDue } from '@/lib/payments/clearDue';

export const dynamic = 'force-dynamic';

const schema = z.object({ action: z.enum(['not_received', 'received']) });

// QR payments are only "marked as paid" by the customer, so an admin can
// activate one that never actually arrived. `not_received` moves it to
// 'payment_due': it stops counting as revenue or an active plan, and the
// customer sees a pay-now banner regardless of what the MSO portal shows.
// `received` undoes that if the money turns up after all.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminAuth();
    const id = (await params).id;
    const { action } = schema.parse(await request.json());

    const scope = and(eq(recharges.id, id), eq(recharges.operator_id, admin.operatorId));
    const amountLabel = (paise: number) => `₹${(paise / 100).toFixed(0)}`;

    if (action === 'not_received') {
      // Guarded on status so a double click can't restore the bundled due twice.
      const [row] = await db.update(recharges)
        .set({ status: 'payment_due' })
        .where(and(scope, inArray(recharges.status, ['paid', 'activated'])))
        .returning();
      if (!row) return NextResponse.json({ error: 'Only paid or activated recharges can be marked' }, { status: 409 });

      // Any old due bundled into this payment wasn't really paid either.
      if (row.due_amount_paise && row.due_amount_paise > 0) {
        await db.update(customers)
          .set({ outstanding_balance: sql`${customers.outstanding_balance} + ${Math.round(row.due_amount_paise / 100)}` })
          .where(eq(customers.id, row.customer_id));
      }

      await sendPushToCustomer(row.customer_id, {
        title: '⚠️ Payment not received',
        body: `We did not receive your ${amountLabel(row.amount)} payment for ${row.plan_name}. Please complete the payment to keep your service.`,
        url: '/dashboard',
      });
      return NextResponse.json({ success: true });
    }

    const [existing] = await db.select().from(recharges).where(scope).limit(1);
    if (!existing) return NextResponse.json({ error: 'Recharge not found' }, { status: 404 });

    const restored = existing.activated_at && existing.expires_at ? 'activated' : 'paid';
    const [row] = await db.update(recharges)
      .set({ status: restored })
      .where(and(scope, eq(recharges.status, 'payment_due')))
      .returning();
    if (!row) return NextResponse.json({ error: 'This recharge is not marked as unpaid' }, { status: 409 });

    await clearDue(row.customer_id, row.due_amount_paise);
    return NextResponse.json({ success: true, status: restored });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error('Payment status error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
