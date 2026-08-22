import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, plans } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const rechargeId = (await params).id;

    // Fetch recharge details, scoped to this operator
    const recharge = await db
      .select()
      .from(recharges)
      .where(and(eq(recharges.id, rechargeId), eq(recharges.operator_id, admin.operatorId)))
      .limit(1);

    if (recharge.length === 0) {
      return NextResponse.json(
        { error: 'Recharge attempt not found' },
        { status: 404 }
      );
    }

    const rechargeData = recharge[0];

    // All statuses can be deleted by admin

    const planId = rechargeData.plan_id;

    // 4. Delete the recharge record
    await db.delete(recharges).where(eq(recharges.id, rechargeId));

    // 5. Clean up the dynamic ala carte plan if applicable
    if (planId && planId.startsWith('plan_alacarte_')) {
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
