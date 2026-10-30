import { db } from '@/lib/db';
import { recharges } from '@/lib/db/schema';
import { and, eq, gt, isNull } from 'drizzle-orm';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function istMidnight(date: Date): Date {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET_MS);
}

// First debit = the last valid day of the running base plan on this connection
// (so the new plan is paid before the old one lapses), else today.
export async function firstDebitDate(customerId: string, connectionId: string | null): Promise<Date> {
  const now = new Date();
  const running = await db
    .select({ plan_name: recharges.plan_name, expires_at: recharges.expires_at })
    .from(recharges)
    .where(and(
      eq(recharges.customer_id, customerId),
      connectionId ? eq(recharges.connection_id, connectionId) : isNull(recharges.connection_id),
      eq(recharges.status, 'activated'),
      isNull(recharges.deleted_at),
      gt(recharges.expires_at, now),
    ));
  const latest = running
    .filter((r) => r.expires_at && !r.plan_name.toUpperCase().startsWith('ALA CARTE'))
    .map((r) => r.expires_at!.getTime())
    .sort((a, b) => b - a)[0];
  return istMidnight(latest ? new Date(latest - DAY_MS) : now);
}

// Same date next month, in IST (31 Jan → 28/29 Feb rather than rolling into March).
export function nextMonthlyDebit(date: Date): Date {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const day = ist.getUTCDate();
  ist.setUTCDate(1);
  ist.setUTCMonth(ist.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() + 1, 0)).getUTCDate();
  ist.setUTCDate(Math.min(day, lastDay));
  return new Date(ist.getTime() - IST_OFFSET_MS);
}

export function autopayDateLabel(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}
