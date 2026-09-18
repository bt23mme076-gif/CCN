import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges } from '@/lib/db/schema';
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

    // Soft delete — recoverable by a super admin until they choose to purge
    // it permanently. Plans are left alone; nothing else to clean up.
    await db.update(recharges).set({ deleted_at: new Date() }).where(eq(recharges.id, rechargeId));

    return NextResponse.json({ success: true, message: 'Recharge attempt deleted successfully' });
  } catch (error) {
    console.error('Delete recharge error:', error);
    return NextResponse.json(
      { error: 'Failed to delete recharge attempt' },
      { status: 500 }
    );
  }
}
