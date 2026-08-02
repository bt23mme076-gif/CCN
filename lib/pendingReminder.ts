const CHECK_INTERVAL_MS = 15 * 1000;

export function startPendingActivationReminder() {
  const check = async () => {
    try {
      const { db } = await import('@/lib/db');
      const { recharges } = await import('@/lib/db/schema');
      const { eq } = await import('drizzle-orm');
      const { sendPushToAdmin } = await import('@/lib/push');

      const pending = await db
        .select()
        .from(recharges)
        .where(eq(recharges.status, 'paid'));

      if (pending.length === 0) return;

      pending.sort((a, b) => new Date(a.paid_at ?? a.created_at).getTime() - new Date(b.paid_at ?? b.created_at).getTime());
      const oldest = pending[0];
      const waitingMinutes = oldest.paid_at
        ? Math.floor((Date.now() - new Date(oldest.paid_at).getTime()) / 60000)
        : 0;

      await sendPushToAdmin({
        title: `🔴 ${pending.length} Recharge${pending.length > 1 ? 's' : ''} Waiting!`,
        body: `${oldest.plan_name} — ${waitingMinutes}min se activation ka wait ho raha hai. Turant activate karein!`,
        url: '/admin/pending',
      });
    } catch (error) {
      console.error('Pending activation reminder error:', error);
    }
  };

  setInterval(check, CHECK_INTERVAL_MS);
}
