import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, plans } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendPushToCustomer } from '@/lib/push';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminAuth();
    const rechargeId = params.id;

    // Get recharge with plan details
    const recharge = await db
      .select({
        recharge: recharges,
        plan: plans,
      })
      .from(recharges)
      .leftJoin(plans, eq(recharges.plan_id, plans.id))
      .where(eq(recharges.id, rechargeId))
      .limit(1);

    if (recharge.length === 0) {
      return NextResponse.json(
        { error: 'Recharge not found' },
        { status: 404 }
      );
    }

    const { recharge: rechargeData, plan } = recharge[0];

    if (rechargeData.status !== 'paid' && rechargeData.status !== 'pending') {
      return NextResponse.json(
        { error: 'Recharge must be paid or pending before activation' },
        { status: 400 }
      );
    }

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Calculate expiry date in IST (UTC+5:30)
    // Expiry should be exactly at 12:00 AM (00:00:00) IST on the day of expiry
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5h 30m in ms

    const isAlacarte = rechargeData.plan_name.toUpperCase().startsWith('ALA CARTE') || 
                       (plan && plan.name.toUpperCase().startsWith('ALA CARTE'));

    let expiresAt: Date;

    if (isAlacarte) {
      // Find customer's active base plan (not expired, not ala carte)
      const activeBaseRecharges = await db
        .select()
        .from(recharges)
        .where(
          and(
            eq(recharges.customer_id, rechargeData.customer_id),
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
        // Fallback: If no active base plan is found, standard duration
        const nowUtc = new Date();
        const expiryIstHelper = new Date(nowUtc.getTime() + IST_OFFSET_MS);
        expiryIstHelper.setUTCDate(expiryIstHelper.getUTCDate() + plan.duration_days);
        expiryIstHelper.setUTCHours(0, 0, 0, 0);
        expiresAt = new Date(expiryIstHelper.getTime() - IST_OFFSET_MS);
      }
    } else {
      // Find the latest active non-expired, non-alacarte plan for this customer.
      // If one exists, chain the new plan from its expiry so pre-paid renewals don't
      // lose days (new plan starts the day the current one ends).
      const existingRecharges = await db
        .select()
        .from(recharges)
        .where(
          and(
            eq(recharges.customer_id, rechargeData.customer_id),
            eq(recharges.status, 'activated')
          )
        );

      const now = new Date();
      const futureActivePlans = existingRecharges.filter((r) => {
        const notExpired = r.expires_at ? new Date(r.expires_at) > now : false;
        const notAla = !r.plan_name.toUpperCase().startsWith('ALA CARTE');
        return notExpired && notAla;
      });

      // Base date = latest expiry among active plans, or now if none
      let baseDate: Date = now;
      if (futureActivePlans.length > 0) {
        futureActivePlans.sort((a, b) => {
          const aTime = a.expires_at ? new Date(a.expires_at).getTime() : 0;
          const bTime = b.expires_at ? new Date(b.expires_at).getTime() : 0;
          return bTime - aTime;
        });
        baseDate = new Date(futureActivePlans[0].expires_at!);
      }

      // Shift base date into IST, add duration, set to midnight IST, convert back to UTC
      const expiryIstHelper = new Date(baseDate.getTime() + IST_OFFSET_MS);
      expiryIstHelper.setUTCDate(expiryIstHelper.getUTCDate() + plan.duration_days);
      expiryIstHelper.setUTCHours(0, 0, 0, 0);
      expiresAt = new Date(expiryIstHelper.getTime() - IST_OFFSET_MS);
    }

    // Update recharge (also set paid_at if it was pending — admin manually confirmed payment)
    await db
      .update(recharges)
      .set({
        status: 'activated',
        paid_at: rechargeData.paid_at ?? new Date(),
        activated_at: new Date(),
        activated_by: admin.username,
        expires_at: expiresAt,
      })
      .where(eq(recharges.id, rechargeId));

    // Get updated recharge
    const updatedRecharge = await db
      .select()
      .from(recharges)
      .where(eq(recharges.id, rechargeId))
      .limit(1);

    // Send push notification to customer (fire-and-forget)
    const expiryStr = expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    sendPushToCustomer(rechargeData.customer_id, {
      title: '✅ Plan Activated!',
      body: `${rechargeData.plan_name} activated. Valid till ${expiryStr}. Enjoy your channels!`,
      url: '/dashboard',
    });

    return NextResponse.json({ recharge: updatedRecharge[0] });
  } catch (error) {
    console.error('Activate recharge error:', error);
    return NextResponse.json(
      { error: 'Failed to activate recharge' },
      { status: 500 }
    );
  }
}
