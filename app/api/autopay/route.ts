import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { autopaySubscriptions, customers, customerPriceOverrides, plans } from '@/lib/db/schema';
import { and, desc, eq, isNull, ne } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { resolveConnection } from '@/lib/connections';
import { notifyAdmin } from '@/lib/push';
import { autopayDateLabel, firstDebitDate } from '@/lib/autopay';

export const dynamic = 'force-dynamic';

function connFilter(connectionId: string | null) {
  return connectionId ? eq(autopaySubscriptions.connection_id, connectionId) : isNull(autopaySubscriptions.connection_id);
}

async function currentFor(customerId: string, connectionId: string | null) {
  const [row] = await db
    .select()
    .from(autopaySubscriptions)
    .where(and(eq(autopaySubscriptions.customer_id, customerId), connFilter(connectionId), ne(autopaySubscriptions.status, 'cancelled')))
    .orderBy(desc(autopaySubscriptions.created_at))
    .limit(1);
  return row ?? null;
}

// The customer's AutoPay for the active connection (?cid=), if any.
export async function GET(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();
    const conn = await resolveConnection(user.customerId, request.nextUrl.searchParams.get('cid') || undefined);
    if (!conn) return NextResponse.json({ error: 'Invalid connection' }, { status: 400 });
    const autopay = await currentFor(user.customerId, conn.connectionId);
    if (autopay) return NextResponse.json({ autopay });

    // Nothing set up yet — hand the sign-up form its defaults.
    const [customer] = await db
      .select({ name: customers.name, mobile: customers.mobile })
      .from(customers)
      .where(eq(customers.id, user.customerId))
      .limit(1);
    const suggested = await firstDebitDate(user.customerId, conn.connectionId);
    return NextResponse.json({
      autopay: null,
      defaults: {
        name: customer?.name ?? '',
        mobile: customer?.mobile ?? '',
        startDate: suggested.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
      },
    });
  } catch (error) {
    console.error('Get autopay error:', error);
    return NextResponse.json({ autopay: null });
  }
}

const AUTOPAY_MONTHS = [6, 12, 24] as const;

const requestSchema = z.object({
  planId: z.string(),
  connectionId: z.string().optional(),
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please choose a start date'),
  months: z.number().refine((m) => (AUTOPAY_MONTHS as readonly number[]).includes(m), 'Please choose how long AutoPay should run'),
});

// Customer signs up with the details the mandate needs; the admin enters them
// into Collect and uploads the QR it generates.
export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();
    const { planId, connectionId, name, mobile, startDate, months } = requestSchema.parse(await request.json());

    if (startDate < new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })) {
      return NextResponse.json({ error: 'Start date cannot be in the past' }, { status: 400 });
    }

    const conn = await resolveConnection(user.customerId, connectionId);
    if (!conn) return NextResponse.json({ error: 'Invalid connection' }, { status: 400 });
    if (await currentFor(user.customerId, conn.connectionId)) {
      return NextResponse.json({ error: 'AutoPay is already set up for this connection' }, { status: 409 });
    }

    const [[plan], [customer], [override]] = await Promise.all([
      db.select().from(plans).where(eq(plans.id, planId)).limit(1),
      db.select().from(customers).where(eq(customers.id, user.customerId)).limit(1),
      db.select().from(customerPriceOverrides)
        .where(and(eq(customerPriceOverrides.customer_id, user.customerId), eq(customerPriceOverrides.plan_id, planId)))
        .limit(1),
    ]);
    if (!plan || !plan.is_active) return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const amount = override ? override.custom_price : plan.price;
    const debitDate = new Date(`${startDate}T00:00:00+05:30`);

    const [row] = await db.insert(autopaySubscriptions).values({
      id: `ap_${randomBytes(8).toString('hex')}`,
      operator_id: customer.operator_id,
      customer_id: user.customerId,
      connection_id: conn.connectionId,
      plan_id: plan.id,
      plan_name: plan.name,
      amount,
      duration_days: plan.duration_days,
      mandate_name: name,
      mandate_mobile: mobile,
      mandate_months: months,
      status: 'requested',
      next_debit_date: debitDate,
    }).returning();

    await notifyAdmin({
      title: '🔁 New AutoPay request',
      body: `Make a QR in Collect:\nName: ${name}\nMobile: ${mobile}\nAmount: ₹${(amount / 100).toFixed(0)}\nFrequency: Monthly\nStart: ${autopayDateLabel(debitDate)}\nDuration: ${months} months\n(STB ${conn.stb_number}, ${plan.name})\nThen upload the QR in the admin panel.`,
      url: '/admin/autopay',
      tag: `autopay-${row.id}`,
    });

    return NextResponse.json({ autopay: row });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error('Create autopay error:', error);
    return NextResponse.json({ error: 'Could not request AutoPay. Please try again.' }, { status: 500 });
  }
}

const updateSchema = z.object({ id: z.string(), action: z.enum(['registered', 'cancel']) });

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();
    const { id, action } = updateSchema.parse(await request.json());

    const [row] = await db.select().from(autopaySubscriptions)
      .where(and(eq(autopaySubscriptions.id, id), eq(autopaySubscriptions.customer_id, user.customerId)))
      .limit(1);
    if (!row || row.status === 'cancelled') return NextResponse.json({ error: 'AutoPay not found' }, { status: 404 });

    const [customer] = await db.select({ name: customers.name }).from(customers).where(eq(customers.id, user.customerId)).limit(1);
    const who = customer?.name ?? 'A customer';

    if (action === 'registered') {
      if (row.status !== 'qr_ready') return NextResponse.json({ error: 'Nothing to confirm yet' }, { status: 409 });
      await db.update(autopaySubscriptions).set({ status: 'registered', updated_at: new Date() }).where(eq(autopaySubscriptions.id, id));
      await notifyAdmin({
        title: '🔁 AutoPay registered',
        body: `${who} says they scanned the AutoPay QR (₹${(row.amount / 100).toFixed(0)}). Check it in Collect, then confirm in the admin panel.`,
        url: '/admin/autopay',
        tag: `autopay-${id}`,
      });
    } else {
      await db.update(autopaySubscriptions).set({ status: 'cancelled', updated_at: new Date() }).where(eq(autopaySubscriptions.id, id));
      await notifyAdmin({
        title: '🔁 AutoPay cancelled',
        body: `${who} cancelled AutoPay (₹${(row.amount / 100).toFixed(0)}). Stop this mandate in Collect too.`,
        url: '/admin/autopay',
        tag: `autopay-${id}`,
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error('Update autopay error:', error);
    return NextResponse.json({ error: 'Could not update AutoPay' }, { status: 500 });
  }
}
