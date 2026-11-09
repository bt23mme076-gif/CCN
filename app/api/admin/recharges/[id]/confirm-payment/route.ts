import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { ADMIN_VERIFIED_REFERENCE, confirmRechargeClaim } from '@/lib/payments/upiAuto';

export const dynamic = 'force-dynamic';

// Admin confirms an unverified "I've paid" claim after checking PhonePe
// Business — clears its bundled due. Needed for due-only payments, which
// have no plan to activate.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminAuth();
    const { id } = await params;

    const [recharge] = await db
      .select({ id: recharges.id })
      .from(recharges)
      .where(and(eq(recharges.id, id), eq(recharges.operator_id, admin.operatorId)))
      .limit(1);
    if (!recharge) return NextResponse.json({ error: 'Recharge not found' }, { status: 404 });

    if (!(await confirmRechargeClaim(id, ADMIN_VERIFIED_REFERENCE))) {
      return NextResponse.json({ error: 'No unverified payment claim on this order' }, { status: 400 });
    }
    return NextResponse.json({ success: true, upi_reference: ADMIN_VERIFIED_REFERENCE });
  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}
