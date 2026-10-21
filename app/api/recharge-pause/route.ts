import { NextResponse } from 'next/server';
import { getCurrentOperator } from '@/lib/db/tenant';
import { getRechargePauses } from '@/lib/rechargePause';
import { MSOS } from '@/lib/mso';

export const dynamic = 'force-dynamic';

// Public: which MSOs have recharges paused right now, for the customer-facing banner.
export async function GET() {
  try {
    const operator = await getCurrentOperator();
    const pauses = await getRechargePauses(operator?.id);
    return NextResponse.json({
      paused: MSOS.filter((m) => pauses[m.id].paused).map((m) => ({ id: m.id, name: m.name, message: pauses[m.id].message })),
    });
  } catch {
    return NextResponse.json({ paused: [] });
  }
}
