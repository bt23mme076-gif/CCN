import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { retrackRequests, customers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireAdminAuth();
    // retrack_requests doesn't have operator_id — scope via customer join
    const rows = await db
      .select({ request: retrackRequests })
      .from(retrackRequests)
      .innerJoin(customers, eq(retrackRequests.customer_id, customers.id))
      .where(eq(customers.operator_id, admin.operatorId))
      .orderBy(desc(retrackRequests.created_at))
      .then(r => r.map(x => x.request));
    return NextResponse.json({ requests: rows });
  } catch (error) {
    console.error('Get retrack requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminAuth();
    const { id } = await request.json();
    await db.update(retrackRequests).set({ status: 'done' }).where(eq(retrackRequests.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update retrack error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
