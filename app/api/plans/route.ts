import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { plans, customerPriceOverrides } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const activePlans = await db
      .select()
      .from(plans)
      .where(eq(plans.is_active, true))
      .orderBy(plans.price);

    // Check if there is a logged in customer
    const user = await getCurrentUser();
    let customizedPlans = [...activePlans];

    if (user && user.role === 'customer') {
      // Fetch customer price overrides
      const overrides = await db
        .select()
        .from(customerPriceOverrides)
        .where(eq(customerPriceOverrides.customer_id, user.customerId));

      // Create a map for easy lookup
      const overrideMap = new Map(overrides.map(o => [o.plan_id, o.custom_price]));

      // Override prices for plans that have custom prices set for this specific customer
      customizedPlans = activePlans.map(plan => {
        if (overrideMap.has(plan.id)) {
          return {
            ...plan,
            price: overrideMap.get(plan.id)!,
            isCustomPrice: true, // Flag to show it's a customized price on the frontend
          };
        }
        return plan;
      });
    }

    return NextResponse.json(
      { plans: customizedPlans },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Get plans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

