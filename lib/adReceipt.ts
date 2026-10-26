import crypto from 'crypto';
import { fmtDate, fmtCurrency, numberToWords } from '@/lib/receipt';

// ── Access token ─────────────────────────────────────────────────────────
// Order ids are guessable (timestamp + 4 hex chars) and the receipt shows the
// advertiser's name and phone, so a public receipt link must also carry this
// HMAC of the order id. Only the advertiser gets it (in the post-payment
// redirect); admins open receipts through their own authenticated route.
function receiptSecret(): string {
  const s = process.env.RECEIPT_SECRET || process.env.JWT_SECRET;
  if (!s) throw new Error('RECEIPT_SECRET / JWT_SECRET is not set');
  return s;
}

export function adReceiptToken(orderId: string): string {
  return crypto.createHmac('sha256', receiptSecret()).update(`ad-receipt:${orderId}`).digest('hex').slice(0, 32);
}

export function verifyAdReceiptToken(orderId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = Buffer.from(adReceiptToken(orderId));
  const given = Buffer.from(token);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

// Statuses that mean the advertiser has paid (receipt allowed).
export const PAID_AD_STATUSES = ['paid', 'approved', 'live', 'completed'];

// ── HTML ─────────────────────────────────────────────────────────────────
function esc(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const AD_TYPE_NAMES: Record<string, string> = { l_shape: 'L-Shape Ad', full_screen: 'Full Screen Ad' };

export interface AdReceiptData {
  id: string;
  ad_type: string;
  package_name: string;
  duration_days: number;
  amount: number; // paise
  advertiser_name: string;
  business_name: string | null;
  phone: string;
  status: string;
  start_date: string | Date | null;
  end_date: string | Date | null;
  upi_reference: string | null;
  paid_at: string | Date | null;
  created_at: string | Date;
}

export function generateAdReceiptHTML(b: AdReceiptData): string {
  const receiptNo = esc(b.id);
  const adName = AD_TYPE_NAMES[b.ad_type] ?? 'Live Stream Ad';
  const statusLabel = b.status === 'live' ? 'LIVE ON AIR' : b.status === 'completed' ? 'COMPLETED' : 'PAID';
  const onAir = b.start_date
    ? `${fmtDate(b.start_date)}${b.end_date ? ` &mdash; ${fmtDate(b.end_date)}` : ''}`
    : '—';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ad Receipt - ${receiptNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #f0f0f0; padding: 20px; }
    .page { max-width: 700px; margin: 0 auto; background: white; border: 2px solid #111; }
    .topbar { display: flex; justify-content: space-between; align-items: center; padding: 6px 16px; border-bottom: 1px solid #ccc; font-size: 11px; }
    .bill-type { font-weight: bold; }
    .tag { border: 1px solid #555; padding: 1px 6px; margin-left: 8px; font-size: 10px; font-weight: normal; }
    .paid-stamp { color: #15803d; border: 2px solid #15803d; padding: 2px 10px; font-weight: 900; letter-spacing: 1px; border-radius: 4px; }
    .header { display: flex; align-items: center; gap: 16px; padding: 14px 16px 10px; border-bottom: 3px solid #111; }
    .logo img { width: 110px; height: auto; display: block; }
    .company-name { font-size: 22px; font-weight: 900; letter-spacing: 0.5px; margin-bottom: 4px; }
    .company-info p { font-size: 11px; line-height: 1.6; }
    .invoice-bar { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; background: #f5f5f5; border-bottom: 1px solid #ddd; padding: 8px 16px; font-size: 11px; }
    .bill-to { padding: 10px 16px 8px; border-bottom: 1px solid #ddd; }
    .bill-to .label { font-size: 11px; font-weight: bold; color: #555; margin-bottom: 4px; }
    .bill-to .cname { font-size: 14px; font-weight: bold; }
    .bill-to .cmeta { font-size: 11px; color: #444; margin-top: 2px; }
    .items-table { width: 100%; border-collapse: collapse; border-bottom: 2px solid #111; }
    .items-table th { background: #f0f0f0; font-size: 11px; font-weight: bold; padding: 7px 10px; text-align: left; border-top: 1px solid #bbb; border-bottom: 1px solid #bbb; }
    .items-table th:not(:first-child), .items-table td:not(:first-child) { text-align: right; }
    .items-table td { padding: 8px 10px; font-size: 12px; vertical-align: top; border-bottom: 1px solid #eee; }
    .items-table .spacer td { height: 40px; border-bottom: none; }
    .footer-cols { display: flex; border-top: 1px solid #ddd; }
    .left-col { flex: 1; padding: 12px 10px; border-right: 1px solid #ddd; font-size: 11px; line-height: 1.7; }
    .right-col { width: 230px; flex-shrink: 0; padding: 12px 10px; font-size: 11px; }
    .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 4px; }
    .amount-words { margin-top: 10px; font-size: 11px; font-style: italic; color: #333; border-top: 1px solid #eee; padding-top: 8px; }
    .amount-words strong { font-style: normal; display: block; margin-bottom: 2px; }
    .signature-block { margin-top: 20px; text-align: right; font-size: 11px; font-weight: bold; border-top: 1px dashed #bbb; padding-top: 6px; }
    .notes-section { padding: 10px 16px; border-top: 1px solid #ddd; font-size: 11px; }
    .notes-section strong { display: block; margin-bottom: 3px; }
    .notes-section li { line-height: 1.5; color: #444; }
    .notes-section ol { padding-left: 16px; }
    .print-btn { display: block; width: calc(100% - 32px); margin: 14px 16px; padding: 10px; background: #111; color: white; border: none; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; }
    @media (max-width: 560px) {
      body { padding: 8px; }
      .footer-cols { flex-direction: column; }
      .left-col { border-right: none; border-bottom: 1px solid #ddd; }
      .right-col { width: auto; }
    }
    @media print {
      body { background: white; padding: 0; }
      .page { max-width: 100%; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="topbar">
    <span class="bill-type">ADVERTISEMENT RECEIPT <span class="tag">ORIGINAL FOR ADVERTISER</span></span>
    <span class="paid-stamp">${statusLabel}</span>
  </div>

  <div class="header">
    <div class="logo"><img src="/ccn-live-logo.webp" alt="CCN LIVE" /></div>
    <div class="company-info">
      <div class="company-name">CHANDNI CABLE NETWORK</div>
      <p>Main, Chaurai, Madhya Pradesh, 480115</p>
      <p><strong>Mobile:</strong> 9399974696 &nbsp;&nbsp; <strong>Email:</strong> jatinrai254@gmail.com</p>
      <p><strong>Udyam MSME:</strong> UDYAM-MP-13-0025439</p>
    </div>
  </div>

  <div class="invoice-bar">
    <span><strong>Receipt No:</strong> ${receiptNo}</span>
    <span><strong>Payment Date:</strong> ${fmtDate(b.paid_at || b.created_at)}</span>
  </div>

  <div class="bill-to">
    <div class="label">ADVERTISER</div>
    <div class="cname">${esc(b.advertiser_name)}</div>
    <div class="cmeta">${b.business_name ? `${esc(b.business_name)} &nbsp;&nbsp; ` : ''}Mobile: ${esc(b.phone)}</div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width:55%">ITEMS/SERVICES</th>
        <th>DAYS</th>
        <th>AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          ${adName} — CCN LIVE stream<br>
          <span style="font-size:11px;color:#555">Package: ${esc(b.package_name)}</span>
          <div style="font-size:10px;color:#555;margin-top:3px;">On air: ${onAir}</div>
        </td>
        <td>${b.duration_days}</td>
        <td>${fmtCurrency(b.amount)}</td>
      </tr>
      <tr class="spacer"><td colspan="3"></td></tr>
    </tbody>
  </table>

  <div class="footer-cols">
    <div class="left-col">
      <strong>PAYMENT MODE:</strong> Online (UPI / PayU)<br>
      ${b.upi_reference ? `<span style="color:#555">Reference: ${esc(b.upi_reference)}</span><br>` : ''}
      <strong>STATUS:</strong> ${statusLabel}
    </div>
    <div class="right-col">
      <div class="total-row"><span>Amount Paid</span><span>${fmtCurrency(b.amount)}</span></div>
      <div class="amount-words">
        <strong>Total Amount (in words)</strong>
        ${numberToWords(b.amount)}
      </div>
      <div class="signature-block">
        <img src="/signature.png" alt="Signature" style="height:60px; width:auto; display:block; margin:0 auto 4px;" />
        AUTHORISED SIGNATORY FOR<br>CHANDNI CABLE NETWORK
      </div>
    </div>
  </div>

  <div class="notes-section" style="border-top:2px solid #111">
    <strong>TERMS AND CONDITIONS</strong>
    <ol>
      <li>Every banner is reviewed before it goes on air. If it cannot be run, we will contact you for a change or a refund.</li>
      <li>All disputes are subject to Chaurai jurisdiction only.</li>
    </ol>
  </div>

  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
</div>
</body>
</html>`;
}

// Loads a booking's receipt fields (no banner image). Optionally scoped to an operator.
export async function loadAdReceiptData(id: string, operatorId?: string): Promise<AdReceiptData | null> {
  const { db } = await import('@/lib/db');
  const { streamAdBookings } = await import('@/lib/db/schema');
  const { and, eq } = await import('drizzle-orm');
  const [row] = await db
    .select({
      id: streamAdBookings.id,
      ad_type: streamAdBookings.ad_type,
      package_name: streamAdBookings.package_name,
      duration_days: streamAdBookings.duration_days,
      amount: streamAdBookings.amount,
      advertiser_name: streamAdBookings.advertiser_name,
      business_name: streamAdBookings.business_name,
      phone: streamAdBookings.phone,
      status: streamAdBookings.status,
      start_date: streamAdBookings.start_date,
      end_date: streamAdBookings.end_date,
      upi_reference: streamAdBookings.upi_reference,
      paid_at: streamAdBookings.paid_at,
      created_at: streamAdBookings.created_at,
    })
    .from(streamAdBookings)
    .where(operatorId ? and(eq(streamAdBookings.id, id), eq(streamAdBookings.operator_id, operatorId)) : eq(streamAdBookings.id, id))
    .limit(1);
  return row ?? null;
}

export function receiptHtmlResponse(html: string): Response {
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store' } });
}
