// Every 2 min (was 15s, which — times every warm Vercel instance — flooded
// the admin phone). Each tick only fires while a non-deleted paid recharge waits.
const CHECK_INTERVAL_MS = 2 * 60 * 1000;

export function startPendingActivationReminder() {
  const check = async () => {
    try {
      const { db } = await import('@/lib/db');
      const { recharges } = await import('@/lib/db/schema');
      const { eq, and, isNull } = await import('drizzle-orm');
      const { sendPushToAdmin } = await import('@/lib/push');

      const pending = await db
        .select()
        .from(recharges)
        .where(and(eq(recharges.status, 'paid'), isNull(recharges.deleted_at)));

      if (pending.length === 0) return;

      pending.sort((a, b) => new Date(a.paid_at ?? a.created_at).getTime() - new Date(b.paid_at ?? b.created_at).getTime());
      const oldest = pending[0];
      const waitingMinutes = oldest.paid_at
        ? Math.floor((Date.now() - new Date(oldest.paid_at).getTime()) / 60000)
        : 0;

      await sendPushToAdmin({
        title: `🔴 ${pending.length} Recharge${pending.length > 1 ? 's' : ''} Waiting!`,
        body: `${oldest.plan_name} has been waiting ${waitingMinutes} min for activation. Please activate now!`,
        url: '/admin/pending',
        tag: 'pending-reminder', // same tag each tick — renotify in sw.js makes it re-vibrate instead of stacking duplicates
      });
    } catch (error) {
      console.error('Pending activation reminder error:', error);
    }
  };

  setInterval(check, CHECK_INTERVAL_MS);
}
