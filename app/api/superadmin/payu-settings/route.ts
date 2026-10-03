import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { appSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { isPayuConfigured } from '@/lib/payments/payu';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

async function authCheck() {
  const cookieStore = await cookies();
  const token = cookieStore.get('super_admin_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'super_admin') return null;
  return payload;
}

export async function GET() {
  if (!await authCheck()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const row = await db.select().from(appSettings).where(eq(appSettings.id, 'global')).limit(1);
  const payuEnabled = row.length > 0 ? row[0].payu_enabled : true;

  return NextResponse.json({
    payuEnabled,
    payuConfigured: isPayuConfigured(), // env keys present or not — toggle is moot without these
  });
}

const schema = z.object({ payuEnabled: z.boolean() });

export async function PATCH(request: NextRequest) {
  if (!await authCheck()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { payuEnabled } = schema.parse(await request.json());

    await db
      .insert(appSettings)
      .values({ id: 'global', payu_enabled: payuEnabled })
      .onConflictDoUpdate({ target: appSettings.id, set: { payu_enabled: payuEnabled, updated_at: new Date() } });

    return NextResponse.json({ success: true, payuEnabled });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('PayU settings update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
