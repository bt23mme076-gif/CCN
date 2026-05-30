import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { plans, customerPriceOverrides } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activePlans = await db
      .select()
      .from(plans)
      .where(eq(plans.is_active, true))
      .orderBy(plans.price);

    // Check if customer is logged in — apply price overrides if any
    const user = await getCurrentUser();
    if (user && user.role === 'customer') {
      const overrides = await db
        .select()
        .from(customerPriceOverrides)
        .where(eq(customerPriceOverrides.customer_id, user.customerId));

      if (overrides.length > 0) {
        const overrideMap = new Map(overrides.map((o) => [o.plan_id, o.custom_price]));
        const plansWithOverrides = activePlans.map((plan) => ({
          ...plan,
          price: overrideMap.has(plan.id) ? overrideMap.get(plan.id)! : plan.price,
          has_custom_price: overrideMap.has(plan.id),
          original_price: plan.price,
        }));
        return NextResponse.json(
          { plans: plansWithOverrides },
          { headers: { 'Cache-Control': 'no-store' } }
        );
      }
    }

    return NextResponse.json(
      { plans: activePlans },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Get plans error:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}
