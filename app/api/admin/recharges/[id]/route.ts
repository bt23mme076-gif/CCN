import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, plans } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verify admin authorization
    await requireAdminAuth();
    const rechargeId = params.id;

    // 2. Fetch recharge details
    const recharge = await db
      .select()
      .from(recharges)
      .where(eq(recharges.id, rechargeId))
      .limit(1);

    if (recharge.length === 0) {
      return NextResponse.json(
        { error: 'Recharge attempt not found' },
        { status: 404 }
      );
    }

    const rechargeData = recharge[0];

    // 3. Only allow deleting 'pending' or 'failed' attempts
    if (rechargeData.status !== 'pending' && rechargeData.status !== 'failed') {
      return NextResponse.json(
        { error: 'Only pending or failed recharge attempts can be deleted' },
        { status: 400 }
      );
    }

    const planId = rechargeData.plan_id;

    // 4. Delete the recharge record
    await db.delete(recharges).where(eq(recharges.id, rechargeId));

    // 5. Clean up the dynamic ala carte plan if applicable
    if (planId.startsWith('plan_alacarte_')) {
      await db.delete(plans).where(eq(plans.id, planId));
    }

    return NextResponse.json({ success: true, message: 'Recharge attempt deleted successfully' });
  } catch (error) {
    console.error('Delete recharge error:', error);
    return NextResponse.json(
      { error: 'Failed to delete recharge attempt' },
      { status: 500 }
    );
  }
}
