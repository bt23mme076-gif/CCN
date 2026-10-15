import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recharges, customers, customerConnections } from '@/lib/db/schema';
import { and, eq, gt, isNull, inArray } from 'drizzle-orm';
import { sendPushToCustomer } from '@/lib/push';
import { sendTelegramAlert } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

// Daily (see vercel.json "crons"): pushes each customer whose plan's last
// valid day is 3, 2, 1 or 0 days away, and sends the admin one Telegram
// summary so they can follow up. A connection with a renewal already queued
// (a later-expiring plan) or a paid order awaiting activation is skipped.
//
// Vercel calls this with "Authorization: Bearer $CRON_SECRET"; without the
// env var set the route refuses to run, so nobody else can trigger pushes.
const REMIND_DAYS = 3;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const istDay = (d: Date) => Math.floor((d.getTime() + IST_OFFSET_MS) / DAY_MS);

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET is not set' }, { status: 500 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const today = istDay(now);

    const [running, awaiting] = await Promise.all([
      db
        .select({
          customer_id: recharges.customer_id,
          connection_id: recharges.connection_id,
          plan_name: recharges.plan_name,
          expires_at: recharges.expires_at,
        })
        .from(recharges)
        .where(and(eq(recharges.status, 'activated'), isNull(recharges.deleted_at), gt(recharges.expires_at, now))),
      db
        .select({ customer_id: recharges.customer_id, connection_id: recharges.connection_id })
        .from(recharges)
        .where(and(eq(recharges.status, 'paid'), isNull(recharges.deleted_at))),
    ]);

    const keyOf = (r: { customer_id: string; connection_id: string | null }) => `${r.customer_id}|${r.connection_id ?? ''}`;
    const awaitingKeys = new Set(awaiting.map(keyOf));

    // Latest-ending base plan per connection — if a renewal is queued, that's the one that counts.
    const latest = new Map<string, { customer_id: string; connection_id: string | null; plan_name: string; expires_at: Date }>();
    for (const r of running) {
      if (!r.expires_at || r.plan_name.toUpperCase().startsWith('ALA CARTE')) continue;
      const prev = latest.get(keyOf(r));
      if (!prev || r.expires_at > prev.expires_at) latest.set(keyOf(r), { ...r, expires_at: r.expires_at });
    }

    const due = [...latest.entries()]
      .map(([key, r]) => ({ key, ...r, daysLeft: istDay(r.expires_at) - 1 - today }))
      .filter((r) => r.daysLeft >= 0 && r.daysLeft <= REMIND_DAYS && !awaitingKeys.has(r.key));

    if (due.length === 0) return NextResponse.json({ reminded: 0 });

    const customerIds = [...new Set(due.map((r) => r.customer_id))];
    const connectionIds = [...new Set(due.map((r) => r.connection_id).filter((c): c is string => !!c))];
    const [custRows, connRows] = await Promise.all([
      db.select({ id: customers.id, name: customers.name, stb_number: customers.stb_number })
        .from(customers)
        .where(and(inArray(customers.id, customerIds), isNull(customers.deleted_at))),
      connectionIds.length > 0
        ? db.select({ id: customerConnections.id, stb_number: customerConnections.stb_number })
            .from(customerConnections)
            .where(inArray(customerConnections.id, connectionIds))
        : Promise.resolve([] as { id: string; stb_number: string }[]),
    ]);
    const custById = new Map(custRows.map((c) => [c.id, c]));
    const stbByConn = new Map(connRows.map((c) => [c.id, c.stb_number]));

    const dateOpts = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' } as const;
    const summary: string[] = [];

    await Promise.allSettled(
      due.map(async (r) => {
        const cust = custById.get(r.customer_id);
        if (!cust) return; // customer deleted
        const stb = r.connection_id ? stbByConn.get(r.connection_id) ?? '' : cust.stb_number;
        const lastDay = new Date(r.expires_at.getTime() - DAY_MS).toLocaleDateString('en-IN', dateOpts);
        const when = r.daysLeft === 0 ? 'today' : r.daysLeft === 1 ? 'tomorrow' : `in ${r.daysLeft} days`;

        await sendPushToCustomer(r.customer_id, {
          title: r.daysLeft === 0 ? '⚠️ Your plan ends today' : `⏳ Plan expiring ${when}`,
          body: `${r.plan_name} (STB ${stb}) is valid till ${lastDay}. Recharge now to keep watching without interruption.`,
          url: '/plans',
          tag: `expiry-${r.key}`,
        });
        summary.push(`• ${cust.name} — ${r.plan_name}, STB ${stb}, ends ${when} (${lastDay})`);
      })
    );

    if (summary.length > 0) {
      summary.sort();
      // Telegram caps a message at 4096 chars — list the first 40, count the rest.
      const shown = summary.slice(0, 40);
      const more = summary.length - shown.length;
      await sendTelegramAlert({
        title: `⏳ ${summary.length} plan${summary.length > 1 ? 's' : ''} expiring in the next ${REMIND_DAYS} days`,
        body: `Customers were sent a reminder:\n${shown.join('\n')}${more > 0 ? `\n…and ${more} more` : ''}`,
        url: '/admin/expiring',
      });
    }

    return NextResponse.json({ reminded: summary.length });
  } catch (error) {
    console.error('Expiry reminder cron error:', error);
    return NextResponse.json({ error: 'Failed to send expiry reminders' }, { status: 500 });
  }
}
