// Sends an alert to the admin's Telegram via a bot. Free and instant, no
// DLT/SMS registration needed. Configure on Vercel:
//   TELEGRAM_BOT_TOKEN — from @BotFather
//   TELEGRAM_CHAT_ID   — the admin's chat id (or a group's, negative number);
//                        comma-separate several to alert more than one chat.
// Missing env vars → silently does nothing, so this never breaks a payment flow.

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function sendTelegramAlert(payload: { title: string; body: string; url?: string }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = (process.env.TELEGRAM_CHAT_ID || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!token || chatIds.length === 0) return;

  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://ccn.atyant.in').replace(/\/$/, '');
  const link = payload.url ? `${base}${payload.url.startsWith('/') ? '' : '/'}${payload.url}` : null;
  const text =
    `<b>${escapeHtml(payload.title)}</b>\n\n${escapeHtml(payload.body)}` +
    (link ? `\n\n👉 <a href="${escapeHtml(link)}">Open admin panel</a>` : '');

  await Promise.allSettled(
    chatIds.map(async (chatId) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) console.error('Telegram alert failed:', res.status, await res.text());
      } catch (error) {
        console.error('Telegram alert error:', error);
      }
    })
  );
}
