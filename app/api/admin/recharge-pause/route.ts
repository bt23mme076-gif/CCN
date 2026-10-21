import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { rechargePauses } from '@/lib/db/schema';
import { getRechargePauses, pauseRowId } from '@/lib/rechargePause';
import { MSOS } from '@/lib/mso';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireAdminAuth();
    const pauses = await getRechargePauses(admin.operatorId);
    // Return the admin's saved custom message even while not paused, so the form keeps it.
    const rows = await db.select().from(rechargePauses).where(eq(rechargePauses.operator_id, admin.operatorId)).catch(() => []);
    const saved = Object.fromEntries(
      rows.map((r) => [r.mso, r.message ?? ''])
    );
    return NextResponse.json({
      msos: MSOS.map((m) => ({ id: m.id, name: m.name, paused: pauses[m.id].paused, message: saved[m.id] ?? '' })),
    });
  } catch (error) {
    console.error('Get recharge pause error:', error);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

const schema = z.object({
  mso: z.enum(MSOS.map((m) => m.id) as [string, ...string[]]),
  paused: z.boolean(),
  message: z.string().max(300).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdminAuth();
    const { mso, paused, message } = schema.parse(await request.json());
    const operatorId = admin.operatorId;
    const msg = message?.trim() || null;

    await db
      .insert(rechargePauses)
      .values({ id: pauseRowId(operatorId, mso as (typeof MSOS)[number]['id']), operator_id: operatorId, mso, paused, message: msg })
      .onConflictDoUpdate({ target: rechargePauses.id, set: { paused, message: msg, updated_at: new Date() } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error('Update recharge pause error:', error);
    return NextResponse.json({ error: 'Failed to update. Has the recharge_pauses migration been run?' }, { status: 500 });
  }
}
