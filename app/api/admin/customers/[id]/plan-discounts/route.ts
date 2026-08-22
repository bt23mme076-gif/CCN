import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customerPlanDiscounts, customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

const VALID_MONTHS = [3, 6, 12];

async function verifyCustomerOwnership(customerId: string, operatorId: string) {
  const [c] = await db.select({ id: customers.id }).from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.operator_id, operatorId))).limit(1);
  return !!c;
}

// GET — list all plan discounts for a customer
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    if (!await verifyCustomerOwnership((await params).id, admin.operatorId))
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    const discounts = await db
      .select({
        plan_id: customerPlanDiscounts.plan_id,
        months: customerPlanDiscounts.months,
        discount_percent: customerPlanDiscounts.discount_percent,
      })
      .from(customerPlanDiscounts)
      .where(eq(customerPlanDiscounts.customer_id, (await params).id));

    return NextResponse.json({ discounts });
  } catch (error) {
    console.error('Get plan discounts error:', error);
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

// PUT — bulk-replace all plan discounts for a customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const customerId = (await params).id;
    if (!await verifyCustomerOwnership(customerId, admin.operatorId))
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    const { discounts } = await request.json();

    if (!Array.isArray(discounts)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const cleaned = discounts
      .filter((d: any) =>
        typeof d.planId === 'string' &&
        VALID_MONTHS.includes(Number(d.months)) &&
        Number(d.percent) > 0
      )
      .map((d: any) => ({
        id: `cpd_${nanoid(12)}`,
        customer_id: customerId,
        plan_id: d.planId,
        months: Number(d.months),
        discount_percent: Math.max(1, Math.min(100, Math.round(Number(d.percent)))),
      }));

    await db.delete(customerPlanDiscounts).where(eq(customerPlanDiscounts.customer_id, customerId));

    if (cleaned.length > 0) {
      await db.insert(customerPlanDiscounts).values(cleaned);
    }

    return NextResponse.json({ success: true, message: 'Discounts saved!' });
  } catch (error) {
    console.error('Save plan discounts error:', error);
    return NextResponse.json({ error: 'Failed to save discounts' }, { status: 500 });
  }
}
