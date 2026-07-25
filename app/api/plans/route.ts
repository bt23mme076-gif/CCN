import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { plans, customerPriceOverrides, customerPlanDiscounts } from '@/lib/db/schema';
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

    // Check if customer is logged in — apply price overrides + multi-month discounts if any
    const user = await getCurrentUser();
    if (user && user.role === 'customer') {
      const [overrides, discounts] = await Promise.all([
        db.select().from(customerPriceOverrides).where(eq(customerPriceOverrides.customer_id, user.customerId)),
        db.select().from(customerPlanDiscounts).where(eq(customerPlanDiscounts.customer_id, user.customerId)),
      ]);

      const discountsByPlan = new Map<string, Record<number, number>>();
      for (const d of discounts) {
        const existing = discountsByPlan.get(d.plan_id) || {};
        existing[d.months] = d.discount_percent;
        discountsByPlan.set(d.plan_id, existing);
      }

      if (overrides.length > 0 || discounts.length > 0) {
        const overrideMap = new Map(overrides.map((o) => [o.plan_id, o.custom_price]));
        const plansWithExtras = activePlans.map((plan) => ({
          ...plan,
          price: overrideMap.has(plan.id) ? overrideMap.get(plan.id)! : plan.price,
          has_custom_price: overrideMap.has(plan.id),
          original_price: plan.price,
          discounts: discountsByPlan.get(plan.id) || {},
        }));
        return NextResponse.json(
          { plans: plansWithExtras },
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
