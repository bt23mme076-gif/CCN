import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { announcements } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    await requireAdminAuth();
    const result = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, 'announcement_main'))
      .limit(1);

    return NextResponse.json({ announcement: result[0] || null });
  } catch (error) {
    console.error('Get announcement error:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const { text, is_active, speed } = await request.json();

    if (typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Announcement text is required' }, { status: 400 });
    }

    const scrollSpeed = typeof speed === 'number' && speed >= 5 && speed <= 120 ? speed : 30;

    await db
      .update(announcements)
      .set({ text: text.trim(), is_active: is_active ?? true, speed: scrollSpeed, updated_at: new Date() })
      .where(eq(announcements.id, 'announcement_main'));

    return NextResponse.json({ success: true, message: 'Announcement updated!' });
  } catch (error) {
    console.error('Update announcement error:', error);
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 });
  }
}
