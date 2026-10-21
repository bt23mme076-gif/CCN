import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rechargePauses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { MSOS, MsoId, msoForStb, msoName } from '@/lib/mso';

export type PauseState = { paused: boolean; message: string };

export function defaultPauseMessage(mso: MsoId): string {
  return `${msoName(mso)} recharges are temporarily unavailable because the ${msoName(mso)} system is down. Please try again in a little while.`;
}

// Operator ids fall back to 'ccn', matching the bulletin bar's tenant default.
const opKey = (operatorId: string | null | undefined) => operatorId ?? 'ccn';
export const pauseRowId = (operatorId: string | null | undefined, mso: MsoId) => `${opKey(operatorId)}:${mso}`;

// Pause state of every MSO for this operator. Missing rows = not paused.
export async function getRechargePauses(operatorId: string | null | undefined): Promise<Record<MsoId, PauseState>> {
  const result = Object.fromEntries(MSOS.map((m) => [m.id, { paused: false, message: '' }])) as Record<MsoId, PauseState>;
  try {
    const rows = await db.select().from(rechargePauses).where(eq(rechargePauses.operator_id, opKey(operatorId)));
    for (const r of rows) {
      const mso = r.mso as MsoId;
      if (!(mso in result) || !r.paused) continue;
      result[mso] = { paused: true, message: r.message?.trim() || defaultPauseMessage(mso) };
    }
  } catch {
    // Table not migrated yet (or DB hiccup) — never block recharges because of this switch.
  }
  return result;
}

// For order-creating routes: a 503 to return when this STB's MSO is paused, else null.
export async function rechargesPausedResponse(
  operatorId: string | null | undefined,
  stbNumber: string | null | undefined
): Promise<NextResponse | null> {
  const mso = msoForStb(stbNumber);
  const state = (await getRechargePauses(operatorId))[mso];
  return state.paused
    ? NextResponse.json({ error: state.message, rechargesPaused: true, mso }, { status: 503 })
    : null;
}
