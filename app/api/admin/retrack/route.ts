import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { retrackRequests } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminAuth();
    const rows = await db.select().from(retrackRequests).orderBy(desc(retrackRequests.created_at));
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
