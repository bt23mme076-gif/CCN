import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const rechargeId = (await params).id;

    const body = await request.json();
    const days = Number(body.days);

    if (!days || days < 1 || days > 365) {
      return NextResponse.json({ error: 'Invalid days value (1–365)' }, { status: 400 });
    }

    const [recharge] = await db
      .select()
      .from(recharges)
      .where(and(eq(recharges.id, rechargeId), eq(recharges.operator_id, admin.operatorId)))
      .limit(1);

    if (!recharge) {
      return NextResponse.json({ error: 'Recharge not found' }, { status: 404 });
    }

    if (recharge.status !== 'activated') {
      return NextResponse.json({ error: 'Only activated recharges can be updated' }, { status: 400 });
    }

    const baseDate = recharge.activated_at ? new Date(recharge.activated_at) : new Date();

    // Calculate new expiry: activated_at + days, at IST midnight
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const expiryIstHelper = new Date(baseDate.getTime() + IST_OFFSET_MS);
    expiryIstHelper.setUTCDate(expiryIstHelper.getUTCDate() + days);
    expiryIstHelper.setUTCHours(0, 0, 0, 0);
    const newExpiresAt = new Date(expiryIstHelper.getTime() - IST_OFFSET_MS);

    await db
      .update(recharges)
      .set({ expires_at: newExpiresAt })
      .where(and(eq(recharges.id, rechargeId), eq(recharges.operator_id, admin.operatorId)));

    return NextResponse.json({ success: true, expires_at: newExpiresAt });
  } catch (error) {
    console.error('Update expiry error:', error);
    return NextResponse.json({ error: 'Failed to update expiry' }, { status: 500 });
  }
}
