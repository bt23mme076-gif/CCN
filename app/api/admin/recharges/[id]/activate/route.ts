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

    // Calculate expiry date in IST (UTC+5:30)
    // Expiry should be exactly at 12:00 AM (00:00:00) IST on the day of expiry
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5h 30m in ms

    const nowUtc = new Date();
    // Shift current time by IST offset so we can use UTC methods to manipulate IST dates
    const expiryIstHelper = new Date(nowUtc.getTime() + IST_OFFSET_MS);

    // Add validity days
    expiryIstHelper.setUTCDate(expiryIstHelper.getUTCDate() + plan.duration_days);
    // Set time to 12:00 AM exactly (start of the day)
    expiryIstHelper.setUTCHours(0, 0, 0, 0);

    // Convert back to real UTC by subtracting the offset
    const expiresAt = new Date(expiryIstHelper.getTime() - IST_OFFSET_MS);

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
