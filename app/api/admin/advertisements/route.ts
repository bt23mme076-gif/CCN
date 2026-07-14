import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { advertisements } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export async function GET() {
  try {
    await requireAdminAuth();
    const ads = await db
      .select()
      .from(advertisements)
      .orderBy(desc(advertisements.created_at));
    return NextResponse.json({ advertisements: ads });
  } catch (error) {
    console.error('Admin GET /api/admin/advertisements error:', error);
    return NextResponse.json({ error: 'Failed to fetch advertisements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const body = await request.json();
    const { business_name, image_data, phone, expires_at } = body;

    if (!business_name?.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }
    if (!image_data?.trim()) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const id = `ad_${randomBytes(8).toString('hex')}`;
    const [ad] = await db
      .insert(advertisements)
      .values({
        id,
        business_name: business_name.trim(),
        image_data: image_data.trim(),
        phone: phone?.trim() || null,
        is_active: true,
        expires_at: expires_at ? new Date(expires_at) : null,
      })
      .returning();

    return NextResponse.json({ advertisement: ad }, { status: 201 });
  } catch (error) {
    console.error('Admin POST /api/admin/advertisements error:', error);
    return NextResponse.json({ error: 'Failed to create advertisement' }, { status: 500 });
  }
}
