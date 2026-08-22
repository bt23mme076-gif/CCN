import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { announcements } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireAdminAuth();
    const announcementId = `announcement_${admin.operatorId}`;
    const result = await db.select().from(announcements).where(eq(announcements.id, announcementId)).limit(1);
    return NextResponse.json({ announcement: result[0] || null });
  } catch (error) {
    console.error('Get announcement error:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminAuth();
    const { text, is_active, speed } = await request.json();

    if (typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Announcement text is required' }, { status: 400 });
    }

    const announcementId = `announcement_${admin.operatorId}`;
    const scrollSpeed = typeof speed === 'number' && speed >= 5 && speed <= 120 ? speed : 30;

    // Upsert — insert on first save, update on subsequent saves
    await db
      .insert(announcements)
      .values({ id: announcementId, operator_id: admin.operatorId, text: text.trim(), is_active: is_active ?? true, speed: scrollSpeed })
      .onConflictDoUpdate({
        target: announcements.id,
        set: { text: text.trim(), is_active: is_active ?? true, speed: scrollSpeed, updated_at: new Date() },
      });

    return NextResponse.json({ success: true, message: 'Announcement updated!' });
  } catch (error) {
    console.error('Update announcement error:', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}
