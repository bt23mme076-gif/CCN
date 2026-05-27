import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customerPriceOverrides, customers, plans } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const overrideSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  customPrice: z.number().positive('Price must be positive'), // In Rupees, we'll convert to paise
  note: z.string().optional(),
});

// GET /api/admin/customers/[id]/price-overrides
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const customerId = params.id;

    // Check if customer exists
    const customerExists = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customerExists.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const overrides = await db
      .select({
        id: customerPriceOverrides.id,
        customerId: customerPriceOverrides.customer_id,
        planId: customerPriceOverrides.plan_id,
        customPrice: customerPriceOverrides.custom_price,
        note: customerPriceOverrides.note,
        createdAt: customerPriceOverrides.created_at,
        planName: plans.name,
        originalPrice: plans.price,
      })
      .from(customerPriceOverrides)
      .innerJoin(plans, eq(customerPriceOverrides.plan_id, plans.id))
      .where(eq(customerPriceOverrides.customer_id, customerId));

    return NextResponse.json({ overrides });
  } catch (error) {
    console.error('Fetch price overrides error:', error);
    return NextResponse.json({ error: 'Failed to fetch price overrides' }, { status: 500 });
  }
}

// POST /api/admin/customers/[id]/price-overrides
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const customerId = params.id;

    const body = await request.json();
    const validated = overrideSchema.parse(body);

    // Verify customer exists
    const customerExists = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customerExists.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Verify plan exists
    const planExists = await db
      .select()
      .from(plans)
      .where(eq(plans.id, validated.planId))
      .limit(1);

    if (planExists.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const priceInPaise = Math.round(validated.customPrice * 100);

    // Check if override already exists
    const existing = await db
      .select()
      .from(customerPriceOverrides)
      .where(
        and(
          eq(customerPriceOverrides.customer_id, customerId),
          eq(customerPriceOverrides.plan_id, validated.planId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update
      await db
        .update(customerPriceOverrides)
        .set({
          custom_price: priceInPaise,
          note: validated.note || null,
        })
        .where(eq(customerPriceOverrides.id, existing[0].id));
    } else {
      // Insert
      const id = `cpo_${randomBytes(8).toString('hex')}`;
      await db.insert(customerPriceOverrides).values({
        id,
        customer_id: customerId,
        plan_id: validated.planId,
        custom_price: priceInPaise,
        note: validated.note || null,
      });
    }

    return NextResponse.json({ success: true, message: 'Price override saved successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Save price override error:', error);
    return NextResponse.json({ error: 'Failed to save price override' }, { status: 500 });
  }
}

// DELETE /api/admin/customers/[id]/price-overrides
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const customerId = params.id;
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (planId) {
      await db
        .delete(customerPriceOverrides)
        .where(
          and(
            eq(customerPriceOverrides.customer_id, customerId),
            eq(customerPriceOverrides.plan_id, planId)
          )
        );
    } else {
      await db
        .delete(customerPriceOverrides)
        .where(eq(customerPriceOverrides.customer_id, customerId));
    }

    return NextResponse.json({ success: true, message: 'Price override deleted successfully' });
  } catch (error) {
    console.error('Delete price override error:', error);
    return NextResponse.json({ error: 'Failed to delete price override' }, { status: 500 });
  }
}
