import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, plans, customers, customerPriceOverrides } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminAuth();
    const customerId = params.id;

    const { planId, customExpiryDate } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // 1. Verify customer exists
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // 2. Fetch plan details
    const planList = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (planList.length === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const plan = planList[0];

    // 3. Determine the price (checking for custom overrides)
    let amount = plan.price;
    const override = await db
      .select()
      .from(customerPriceOverrides)
      .where(
        and(
          eq(customerPriceOverrides.customer_id, customerId),
          eq(customerPriceOverrides.plan_id, planId)
        )
      )
      .limit(1);

    if (override.length > 0) {
      amount = override[0].custom_price;
    }

    // 4. Calculate expiry date in IST (UTC+5:30)
    let expiresAt: Date;
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    const isAlacarte = plan.name.toUpperCase().startsWith('ALA CARTE');

    if (customExpiryDate) {
      const parsedDate = new Date(customExpiryDate);
      const helper = new Date(parsedDate.getTime() + IST_OFFSET_MS);
      helper.setUTCHours(0, 0, 0, 0);
      expiresAt = new Date(helper.getTime() - IST_OFFSET_MS);
    } else if (isAlacarte) {
      // Find customer's active base plan (not expired, not ala carte)
      const activeBaseRecharges = await db
        .select()
        .from(recharges)
        .where(
          and(
            eq(recharges.customer_id, customerId),
            eq(recharges.status, 'activated')
          )
        );

      const activeBasePlans = activeBaseRecharges.filter((r) => {
        const isExpired = r.expires_at ? new Date(r.expires_at) <= new Date() : true;
        const isAla = r.plan_name.toUpperCase().startsWith('ALA CARTE');
        return !isExpired && !isAla;
      });

      if (activeBasePlans.length > 0) {
        // Sort by expires_at descending to get the furthest expiration date
        activeBasePlans.sort((a, b) => {
          const aTime = a.expires_at ? new Date(a.expires_at).getTime() : 0;
          const bTime = b.expires_at ? new Date(b.expires_at).getTime() : 0;
          return bTime - aTime;
        });
        expiresAt = activeBasePlans[0].expires_at!;
      } else {
        // Fallback: standard duration
        const nowUtc = new Date();
        const expiryIstHelper = new Date(nowUtc.getTime() + IST_OFFSET_MS);
        expiryIstHelper.setUTCDate(expiryIstHelper.getUTCDate() + plan.duration_days);
        expiryIstHelper.setUTCHours(0, 0, 0, 0);
        expiresAt = new Date(expiryIstHelper.getTime() - IST_OFFSET_MS);
      }
    } else {
      const nowUtc = new Date();
      const expiryIstHelper = new Date(nowUtc.getTime() + IST_OFFSET_MS);
      expiryIstHelper.setUTCDate(expiryIstHelper.getUTCDate() + plan.duration_days);
      expiryIstHelper.setUTCHours(0, 0, 0, 0);
      expiresAt = new Date(expiryIstHelper.getTime() - IST_OFFSET_MS);
    }

    // 5. Generate recharge ID
    const rechargeId = `ORD-ADMIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 6. Insert directly as activated recharge
    const [recharge] = await db
      .insert(recharges)
      .values({
        id: rechargeId,
        customer_id: customerId,
        plan_id: plan.id,
        plan_name: plan.name.toUpperCase().startsWith('ALA CARTE') && plan.channels?.length
          ? `ALA CARTE: ${plan.channels.join(', ')}`
          : plan.name,
        amount: amount,
        status: 'activated',
        cashfree_order_id: 'ADMIN_ACTIVATED',
        paid_at: new Date(),
        activated_at: new Date(),
        activated_by: admin.username,
        expires_at: expiresAt,
      })
      .returning();

    return NextResponse.json({ recharge });
  } catch (error) {
    console.error('Admin manual plan activation error:', error);
    return NextResponse.json(
      { error: 'Failed to activate plan for customer' },
      { status: 500 }
    );
  }
}
