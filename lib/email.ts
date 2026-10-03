// Transactional email via Resend's REST API (no SDK dependency).
// RESEND_API_KEY must be set in env; without it sending is skipped silently.
// Until a domain is verified in Resend, the default onboarding@resend.dev
// sender can only deliver to the email that owns the Resend account.
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'CCN Payments <onboarding@resend.dev>';
const PAYMENT_ALERT_EMAIL = process.env.PAYMENT_ALERT_EMAIL || 'jatinraibjp@gmail.com';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function sendPaymentAlertEmail(details: {
  item: string;
  amountPaise: number;
  orderId: string;
  payuId: string;
  customerId: string;
  customerName: string;
  mobile: string;
  stbNumber: string;
}) {
  if (!RESEND_API_KEY) return;

  const rupees = `₹${(details.amountPaise / 100).toFixed(2)}`;
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const rows: [string, string][] = [
    ['Amount', rupees],
    ['Item', details.item],
    ['Customer', details.customerName],
    ['Customer ID', details.customerId],
    ['Mobile', details.mobile],
    ['STB Number', details.stbNumber],
    ['Order ID', details.orderId],
    ['PayU Txn ID', details.payuId],
    ['Time', time],
  ];
  const html = `<h2 style="color:#16a34a">Payment Successful — ${rupees}</h2>
<table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
${rows.map(([k, v]) => `<tr><td style="color:#555">${k}</td><td><b>${escapeHtml(v)}</b></td></tr>`).join('\n')}
</table>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [PAYMENT_ALERT_EMAIL],
        subject: `Payment Successful: ${rupees} — ${details.customerName} (${details.item})`,
        html,
      }),
    });
    if (!res.ok) console.error('Payment alert email failed:', res.status, await res.text());
  } catch (error) {
    // Never let an email outage break payment settlement.
    console.error('Payment alert email error:', error);
  }
}
