import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, plans, customers } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { sendPushToCustomer } from '@/lib/push';

export const dynamic = 'force-dynamic';

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

    const isFastRecharge = rechargeData.plan_name === 'Fast Recharge' && !rechargeData.plan_id;

    if (!plan && !isFastRecharge) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Calculate expiry date in IST (UTC+5:30)
    // Expiry should be exactly at 12:00 AM (00:00:00) IST on the day of expiry
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5h 30m in ms

    // Fast Recharge: chain from existing plan expiry, default 30 days duration
    if (isFastRecharge) {
      const connFilter = rechargeData.connection_id
        ? eq(recharges.connection_id, rechargeData.connection_id)
        : isNull(recharges.connection_id);
      const existingRecharges = await db.select().from(recharges).where(
        and(eq(recharges.customer_id, rechargeData.customer_id), eq(recharges.status, 'activated'), connFilter)
      );
      const now = new Date();
      const futurePlans = existingRecharges.filter(r =>
        r.expires_at && new Date(r.expires_at) > now && !r.plan_name.toUpperCase().startsWith('ALA CARTE')
      );
      futurePlans.sort((a, b) =>
        (b.expires_at ? new Date(b.expires_at).getTime() : 0) - (a.expires_at ? new Date(a.expires_at).getTime() : 0)
      );
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const baseDate = futurePlans.length > 0 ? new Date(futurePlans[0].expires_at!) : now;
      const expiryIstHelper = new Date(baseDate.getTime() + IST_OFFSET_MS);
      expiryIstHelper.setUTCDate(expiryIstHelper.getUTCDate() + 30);
      expiryIstHelper.setUTCHours(0, 0, 0, 0);
      const expiresAt = new Date(expiryIstHelper.getTime() - IST_OFFSET_MS);

      await db.update(recharges).set({
        status: 'activated',
        paid_at: rechargeData.paid_at ?? new Date(),
        activated_at: new Date(),
        activated_by: admin.username,
        expires_at: expiresAt,
      }).where(eq(recharges.id, rechargeId));

      const expiryStr = expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      sendPushToCustomer(rechargeData.customer_id, {
        title: '✅ Fast Recharge Activated!',
        body: `Aapka Fast Recharge activate ho gaya. Valid till ${expiryStr}. Enjoy your channels!`,
        url: '/dashboard',
      });

      const updatedRecharge = await db.select().from(recharges).where(eq(recharges.id, rechargeId)).limit(1);
      return NextResponse.json({ recharge: updatedRecharge[0] });
    }

    const isAlacarte = rechargeData.plan_name.toUpperCase().startsWith('ALA CARTE') ||
                       (plan && plan.name.toUpperCase().startsWith('ALA CARTE'));

    let expiresAt: Date;

    if (isAlacarte) {
      // Find customer's active base plan (not expired, not ala carte)
      const connFilter = rechargeData.connection_id
        ? eq(recharges.connection_id, rechargeData.connection_id)
        : isNull(recharges.connection_id);
      const activeBaseRecharges = await db
        .select()
        .from(recharges)
        .where(
          and(
            eq(recharges.customer_id, rechargeData.customer_id),
            eq(recharges.status, 'activated'),
            connFilter
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
        expiryIstHelper.setUTCDate(expiryIstHelper.getUTCDate() + plan!.duration_days);
        expiryIstHelper.setUTCHours(0, 0, 0, 0);
        expiresAt = new Date(expiryIstHelper.getTime() - IST_OFFSET_MS);
      }
    } else {
      // Find the latest active non-expired, non-alacarte plan for this customer.
      // If one exists, chain the new plan from its expiry so pre-paid renewals don't
      // lose days (new plan starts the day the current one ends).
      const connFilter2 = rechargeData.connection_id
        ? eq(recharges.connection_id, rechargeData.connection_id)
        : isNull(recharges.connection_id);
      const existingRecharges = await db
        .select()
        .from(recharges)
        .where(
          and(
            eq(recharges.customer_id, rechargeData.customer_id),
            eq(recharges.status, 'activated'),
            connFilter2
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
      const effectiveDurationDays = rechargeData.duration_days ?? plan!.duration_days;
      const expiryIstHelper = new Date(baseDate.getTime() + IST_OFFSET_MS);
      expiryIstHelper.setUTCDate(expiryIstHelper.getUTCDate() + effectiveDurationDays);
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
