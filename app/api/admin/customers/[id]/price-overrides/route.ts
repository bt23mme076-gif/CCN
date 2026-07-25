import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customerPriceOverrides, plans } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

// GET — list all overrides for a customer
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const overrides = await db
      .select({
        id: customerPriceOverrides.id,
        plan_id: customerPriceOverrides.plan_id,
        custom_price: customerPriceOverrides.custom_price,
        note: customerPriceOverrides.note,
        created_at: customerPriceOverrides.created_at,
        plan_name: plans.name,
        plan_price: plans.price,
      })
      .from(customerPriceOverrides)
      .leftJoin(plans, eq(customerPriceOverrides.plan_id, plans.id))
      .where(eq(customerPriceOverrides.customer_id, params.id));

    return NextResponse.json({ overrides });
  } catch (error) {
    console.error('Get price overrides error:', error);
    return NextResponse.json({ error: 'Failed to fetch overrides' }, { status: 500 });
  }
}

// POST — set/update a price override
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const { plan_id, custom_price, note } = await request.json();

    if (!plan_id || typeof custom_price !== 'number' || custom_price <= 0) {
      return NextResponse.json({ error: 'Invalid plan or price' }, { status: 400 });
    }

    const customPricePaise = Math.round(custom_price * 100);

    // Upsert — update if exists, insert if not
    const existing = await db
      .select()
      .from(customerPriceOverrides)
      .where(and(
        eq(customerPriceOverrides.customer_id, params.id),
        eq(customerPriceOverrides.plan_id, plan_id)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(customerPriceOverrides)
        .set({ custom_price: customPricePaise, note: note || null })
        .where(eq(customerPriceOverrides.id, existing[0].id));
    } else {
      await db.insert(customerPriceOverrides).values({
        id: `cpo_${nanoid(12)}`,
        customer_id: params.id,
        plan_id,
        custom_price: customPricePaise,
        note: note || null,
      });
    }

    return NextResponse.json({ success: true, message: 'Price override saved!' });
  } catch (error) {
    console.error('Set price override error:', error);
    return NextResponse.json({ error: 'Failed to save override' }, { status: 500 });
  }
}

// DELETE — remove a price override
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const { plan_id } = await request.json();

    await db
      .delete(customerPriceOverrides)
      .where(and(
        eq(customerPriceOverrides.customer_id, params.id),
        eq(customerPriceOverrides.plan_id, plan_id)
      ));

    return NextResponse.json({ success: true, message: 'Price override removed' });
  } catch (error) {
    console.error('Delete price override error:', error);
    return NextResponse.json({ error: 'Failed to remove override' }, { status: 500 });
  }
}
