import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { streamAdPackages } from '@/lib/db/schema';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminAuth();
    const { ad_type, name, description, price, duration_days } = await request.json();

    if (ad_type !== 'l_shape' && ad_type !== 'full_screen') {
      return NextResponse.json({ error: 'Pick L-Shape or Full Screen' }, { status: 400 });
    }
    if (!name?.trim()) return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
    const pricePaise = Math.round(Number(price));
    if (!Number.isFinite(pricePaise) || pricePaise < 100) {
      return NextResponse.json({ error: 'Price must be at least ₹1' }, { status: 400 });
    }
    const days = Math.round(Number(duration_days));
    if (!Number.isFinite(days) || days < 1) return NextResponse.json({ error: 'Duration must be at least 1 day' }, { status: 400 });

    const [pkg] = await db
      .insert(streamAdPackages)
      .values({
        id: `sap_${randomBytes(8).toString('hex')}`,
        operator_id: admin.operatorId,
        ad_type,
        name: name.trim(),
        description: description?.trim() || null,
        price: pricePaise,
        duration_days: days,
        is_active: true,
      })
      .returning();

    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error) {
    console.error('Admin POST /api/admin/stream-ads/packages error:', error);
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
  }
}
