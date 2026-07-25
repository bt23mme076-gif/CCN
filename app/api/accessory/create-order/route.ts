import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { accessories, accessoryOrders, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createOrderSchema = z.object({
  accessoryId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();
    const body = await request.json();
    const { accessoryId } = createOrderSchema.parse(body);

    // Get accessory details
    const accessory = await db
      .select()
      .from(accessories)
      .where(eq(accessories.id, accessoryId))
      .limit(1);

    if (accessory.length === 0 || !accessory[0].is_active) {
      return NextResponse.json(
        { error: 'Accessory not found or inactive' },
        { status: 404 }
      );
    }

    const price = accessory[0].price;

    // Get customer details
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

    // Check if Cashfree is configured
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact administrator.' },
        { status: 503 }
      );
    }

    // Create unique order ID for accessory order
    const orderId = generateOrderId();
    
    // Create Cashfree order using REST API
    const cashfreeApiUrl = process.env.CASHFREE_ENV === 'production'
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    const orderData = {
      order_id: orderId,
      order_amount: (price / 100).toFixed(2), // Convert paise to rupees
      order_currency: 'INR',
      customer_details: {
        customer_id: user.customerId,
        customer_phone: customer[0].mobile,
        customer_name: customer[0].name,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/buy?order_id=${orderId}&type=accessory`,
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

    // Save accessory order record
    await db.insert(accessoryOrders).values({
      id: orderId,
      customer_id: user.customerId,
      accessory_id: accessory[0].id,
      accessory_name: accessory[0].name,
      amount: price,
      status: 'pending',
      cashfree_order_id: cashfreeOrder.order_id || orderId,
    });

    return NextResponse.json({
      orderId: orderId,
      cashfreeOrderId: cashfreeOrder.order_id,
      paymentSessionId: cashfreeOrder.payment_session_id,
      amount: price,
      currency: 'INR',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Create accessory order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
