import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, plans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

    if (rechargeData.status !== 'paid') {
      return NextResponse.json(
        { error: 'Recharge must be paid before activation' },
        { status: 400 }
      );
    }

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Calculate expiry date:
    // Always starts from 1st of current month, ends on last day after N months
    // e.g. 30-day plan activated in June → starts June 1, expires June 30 midnight
    // e.g. 30-day plan activated on June 25 → still expires June 30 (end of month)
    const now = new Date();

    // Number of months the plan covers (round 30 days = 1 month, 60 = 2, etc.)
    const months = Math.round(plan.duration_days / 30) || 1;

    // Start = 1st of current month at midnight
    const startMonth = now.getMonth();
    const startYear = now.getFullYear();

    // End = last day of (startMonth + months - 1), at 23:59:59
    const endMonth = startMonth + months; // e.g. June(5) + 1 = July(6)
    // Last day of the target month = day 0 of the next month
    const expiresAt = new Date(startYear, endMonth, 0, 23, 59, 59, 999);
    // e.g. new Date(2026, 6, 0) = June 30, 2026

    // Update recharge
    await db
      .update(recharges)
      .set({
        status: 'activated',
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

    return NextResponse.json({ recharge: updatedRecharge[0] });
  } catch (error) {
    console.error('Activate recharge error:', error);
    return NextResponse.json(
      { error: 'Failed to activate recharge' },
      { status: 500 }
    );
  }
}
