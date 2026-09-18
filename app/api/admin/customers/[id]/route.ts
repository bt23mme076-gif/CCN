import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers, recharges, plans } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();

    const customerId = (await params).id;

    const customer = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.operator_id, admin.operatorId)))
      .limit(1);

    const rechargeHistory = customer.length === 0 ? [] : await db
      .select({
        recharge: recharges,
        plan: plans,
      })
      .from(recharges)
      .leftJoin(plans, eq(recharges.plan_id, plans.id))
      .where(and(eq(recharges.customer_id, customerId), eq(recharges.operator_id, admin.operatorId)))
      .orderBy(desc(recharges.created_at));

    return NextResponse.json({
      customer: customer[0] || null,
      recharges: rechargeHistory,
    });
  } catch (error) {
    console.error('Get customer details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const customerId = (await params).id;
    const body = await request.json();

    const { name, mobile, stb_number, area } = body;
    if (!name || !mobile || !stb_number || !area) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }
    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ error: 'Mobile must be 10 digits' }, { status: 400 });
    }

    await db.update(customers).set({ name, mobile, stb_number, area }).where(and(eq(customers.id, customerId), eq(customers.operator_id, admin.operatorId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();

    const customerId = (await params).id;

    // Check if customer exists and belongs to this operator
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.operator_id, admin.operatorId)))
      .limit(1);

    if (existingCustomer.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Soft delete — recoverable by a super admin until they choose to purge
    // it permanently. Cascades to the customer's recharges too, so their
    // history disappears from admin views along with the account.
    const now = new Date();
    await db.update(recharges).set({ deleted_at: now }).where(eq(recharges.customer_id, customerId));
    await db.update(customers).set({ deleted_at: now }).where(eq(customers.id, customerId));

    return NextResponse.json({
      success: true,
      message: 'Customer and all associated recharges deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
