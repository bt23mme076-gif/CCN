import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { accessories, accessoryOrders, customers, operators } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import { z } from 'zod';
import { createCashfreeOrder } from '@/lib/payments/cashfreeOrder';

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

    const operator = customer[0].operator_id
      ? await db.select().from(operators).where(eq(operators.id, customer[0].operator_id)).limit(1).then(r => r[0] ?? null)
      : null;

    const orderId = generateOrderId();

    let cfResult;
    try {
      cfResult = await createCashfreeOrder({
        orderId,
        amountPaise: price,
        customerId: user.customerId,
        customerPhone: customer[0].mobile,
        customerName: customer[0].name,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/buy?order_id=${orderId}&type=accessory`,
        operator,
      });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 503 });
    }

    await db.insert(accessoryOrders).values({
      id: orderId,
      operator_id: customer[0].operator_id,
      customer_id: user.customerId,
      accessory_id: accessory[0].id,
      accessory_name: accessory[0].name,
      amount: price,
      status: 'pending',
      cashfree_order_id: cfResult.cashfreeOrderId,
    });

    return NextResponse.json({
      orderId,
      cashfreeOrderId: cfResult.cashfreeOrderId,
      paymentSessionId: cfResult.paymentSessionId,
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
