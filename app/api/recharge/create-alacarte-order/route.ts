import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { plans, recharges, customers, channels as channelsTable, operators } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { createCashfreeOrder } from '@/lib/payments/cashfreeOrder';

export const dynamic = 'force-dynamic';

const createAlacarteOrderSchema = z.object({
  channelIds: z.array(z.number()).min(1, 'Select at least one channel'),
});

interface Channel {
  id: number;
  name: string;
  hd_sd: string;
  genre: string;
  epg: number;
  type: string;
  mrp: number;
  price: number;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();
    const body = await request.json();
    const { channelIds } = createAlacarteOrderSchema.parse(body);

    // 1. Get customer details
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, user.customerId))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (customer[0].outstanding_balance > 0) {
      return NextResponse.json(
        { error: `Recharge blocked. Please clear your outstanding due of ₹${customer[0].outstanding_balance} first.` },
        { status: 403 }
      );
    }

    // 2. Hard Prerequisite Validation: Customer must have an active base bundle (not expired, not A La Carte)
    const customerRecharges = await db
      .select()
      .from(recharges)
      .where(
        and(
          eq(recharges.customer_id, user.customerId),
          eq(recharges.status, 'activated')
        )
      );

    const hasActiveBaseBundle = customerRecharges.some((r) => {
      const isExpired = r.expires_at ? new Date(r.expires_at) <= new Date() : true;
      const isAlacarte = r.plan_name.toUpperCase().startsWith('ALA CARTE');
      return !isExpired && !isAlacarte;
    });

    if (!hasActiveBaseBundle) {
      return NextResponse.json(
        {
          error: 'Prerequisite Required: You must have an active base plan (e.g. Basic, Silver, Royal) before you can buy A La Carte channels.',
        },
        { status: 400 }
      );
    }

    // 3. Load selected channels from database channels table
    const dbChannels = await db
      .select()
      .from(channelsTable)
      .where(inArray(channelsTable.id, channelIds));

    if (dbChannels.length !== channelIds.length) {
      return NextResponse.json(
        { error: 'One or more selected channels are invalid or inactive' },
        { status: 400 }
      );
    }

    let totalAmountPaise = 0;
    const selectedChannelNames: string[] = [];

    for (const channel of dbChannels) {
      totalAmountPaise += channel.price; // prices are already in paise in DB
      selectedChannelNames.push(`${channel.name} (${channel.hd_sd})`);
    }

    if (totalAmountPaise <= 0) {
      return NextResponse.json(
        { error: 'Total price must be greater than 0' },
        { status: 400 }
      );
    }

    // 4. Round up pricing to next whole rupee to prevent fractional losses
    // E.g., if total is 286 paise (2.86 Rs), we charge 300 paise (3.00 Rs)
    const roundedAmountPaise = Math.ceil(totalAmountPaise / 100) * 100;

    // Resolve operator for split payments
    const operator = customer[0].operator_id
      ? await db.select().from(operators).where(eq(operators.id, customer[0].operator_id)).limit(1).then(r => r[0] ?? null)
      : null;

    // Create a dynamic plan record scoped to this operator
    const dynamicPlanId = `plan_alacarte_${randomBytes(8).toString('hex')}`;
    await db.insert(plans).values({
      id: dynamicPlanId,
      operator_id: customer[0].operator_id,
      name: 'ALA CARTE',
      price: roundedAmountPaise,
      duration_days: 30,
      channels: selectedChannelNames,
      is_popular: false,
      is_active: false,
    });

    const rechargeId = generateOrderId();

    let cfResult;
    try {
      cfResult = await createCashfreeOrder({
        orderId: rechargeId,
        amountPaise: roundedAmountPaise,
        customerId: user.customerId,
        customerPhone: customer[0].mobile,
        customerName: customer[0].name,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?order_id=${rechargeId}`,
        operator,
      });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 503 });
    }

    await db.insert(recharges).values({
      id: rechargeId,
      operator_id: customer[0].operator_id,
      customer_id: user.customerId,
      plan_id: dynamicPlanId,
      plan_name: `ALA CARTE: ${selectedChannelNames.join(', ')}`,
      amount: roundedAmountPaise,
      status: 'pending',
      cashfree_order_id: cfResult.cashfreeOrderId,
    });

    return NextResponse.json({
      orderId: rechargeId,
      cashfreeOrderId: cfResult.cashfreeOrderId,
      paymentSessionId: cfResult.paymentSessionId,
      amount: roundedAmountPaise,
      currency: 'INR',
      planName: 'ALA CARTE',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Create alacarte order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
