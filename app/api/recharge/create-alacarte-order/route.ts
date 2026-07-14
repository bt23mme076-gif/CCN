import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { plans, recharges, customers, channels as channelsTable } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import { z } from 'zod';
import { randomBytes } from 'crypto';

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

    // Check if Cashfree is configured
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact administrator.' },
        { status: 503 }
      );
    }

    // Create a dynamic plan record first
    const dynamicPlanId = `plan_alacarte_${randomBytes(8).toString('hex')}`;
    
    await db.insert(plans).values({
      id: dynamicPlanId,
      name: 'ALA CARTE',
      price: roundedAmountPaise, // store the rounded amount
      duration_days: 30,
      channels: selectedChannelNames,
      is_popular: false,
      is_active: false,
    });

    // Create recharge record
    const rechargeId = generateOrderId();
    
    // Create Cashfree order using REST API
    const cashfreeApiUrl = process.env.CASHFREE_ENV === 'production'
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    const orderData = {
      order_id: rechargeId,
      order_amount: (roundedAmountPaise / 100).toFixed(2), // Pass the rounded amount
      order_currency: 'INR',
      customer_details: {
        customer_id: user.customerId,
        customer_phone: customer[0].mobile,
        customer_name: customer[0].name,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?order_id=${rechargeId}`,
      },
    };

    const cashfreeResponse = await fetch(cashfreeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify(orderData),
    });

    const responseText = await cashfreeResponse.text();

    if (!cashfreeResponse.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      console.error('Cashfree API error:', errorData);
      return NextResponse.json(
        { error: `Payment gateway error: ${errorData.message || 'Unknown error'}` },
        { status: 503 }
      );
    }

    const cashfreeOrder = JSON.parse(responseText);

    if (!cashfreeOrder.payment_session_id) {
      console.error('Missing payment_session_id in Cashfree response:', cashfreeOrder);
      return NextResponse.json(
        { error: 'Payment gateway error: Missing payment session ID' },
        { status: 503 }
      );
    }

    // Save recharge record with rounded amount
    await db.insert(recharges).values({
      id: rechargeId,
      customer_id: user.customerId,
      plan_id: dynamicPlanId,
      plan_name: `ALA CARTE: ${selectedChannelNames.join(', ')}`,
      amount: roundedAmountPaise,
      status: 'pending',
      cashfree_order_id: cashfreeOrder.order_id || rechargeId,
    });

    return NextResponse.json({
      orderId: rechargeId,
      cashfreeOrderId: cashfreeOrder.order_id,
      paymentSessionId: cashfreeOrder.payment_session_id,
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
