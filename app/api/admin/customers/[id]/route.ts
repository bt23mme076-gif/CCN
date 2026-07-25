import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers, recharges, plans } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();

    const customerId = params.id;

    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    const rechargeHistory = await db
      .select({
        recharge: recharges,
        plan: plans,
      })
      .from(recharges)
      .leftJoin(plans, eq(recharges.plan_id, plans.id))
      .where(eq(recharges.customer_id, customerId))
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
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const customerId = params.id;
    const body = await request.json();

    const { name, mobile, stb_number, area } = body;
    if (!name || !mobile || !stb_number || !area) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }
    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ error: 'Mobile must be 10 digits' }, { status: 400 });
    }

    await db.update(customers).set({ name, mobile, stb_number, area }).where(eq(customers.id, customerId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();

    const customerId = params.id;

    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (existingCustomer.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Delete all recharges first (foreign key constraint)
    await db.delete(recharges).where(eq(recharges.customer_id, customerId));

    // Delete the customer
    await db.delete(customers).where(eq(customers.id, customerId));

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
