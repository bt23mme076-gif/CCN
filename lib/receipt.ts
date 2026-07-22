export interface ReceiptData {
  recharge: {
    id: string;
    plan_name: string;
    amount: number; // in paise
    status: string;
    created_at: string | Date;
    paid_at?: string | Date | null;
    activated_at?: string | Date | null;
    expires_at?: string | Date | null;
    cashfree_order_id?: string | null;
    cashfree_payment_id?: string | null;
  };
  customer: {
    name: string;
    mobile: string;
    stb_number: string;
    area: string;
  };
}

function fmtDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(date));
}

function fmtCurrency(paise: number): string {
  const rupees = paise / 100;
  return '₹ ' + rupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function numberToWords(paise: number): string {
  const n = Math.round(paise / 100);
  if (n === 0) return 'Zero Rupees Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function two(x: number): string {
    if (x < 20) return ones[x];
    return tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : '');
  }
  function three(x: number): string {
    if (x < 100) return two(x);
    return ones[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' + two(x % 100) : '');
  }

  let rem = n, parts: string[] = [];
  if (rem >= 10000000) { parts.push(three(Math.floor(rem / 10000000)) + ' Crore'); rem %= 10000000; }
  if (rem >= 100000)   { parts.push(two(Math.floor(rem / 100000)) + ' Lakh'); rem %= 100000; }
  if (rem >= 1000)     { parts.push(two(Math.floor(rem / 1000)) + ' Thousand'); rem %= 1000; }
  if (rem > 0)         { parts.push(three(rem)); }

  return parts.join(' ') + ' Rupees Only';
}

function getDays(activated_at?: string | Date | null, expires_at?: string | Date | null): number {
  if (!activated_at || !expires_at) return 30;
  return Math.max(1, Math.round((new Date(expires_at).getTime() - new Date(activated_at).getTime()) / (1000 * 60 * 60 * 24)));
}

export function generateReceiptHTML(data: ReceiptData): string {
  const { recharge, customer } = data;

  const invoiceNo = recharge.id.slice(-5).toUpperCase();
  const invoiceDate = fmtDate(recharge.paid_at || recharge.created_at);
  const dueDate = recharge.expires_at ? fmtDate(recharge.expires_at) : '—';
  const days = getDays(recharge.activated_at, recharge.expires_at);
  const ratePerMonth = Math.round(recharge.amount / Math.max(1, Math.round(days / 30)));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bill of Supply - ${invoiceNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #f0f0f0; padding: 20px; }
    .page { max-width: 700px; margin: 0 auto; background: white; padding: 0; border: 2px solid #111; }

    /* Top bar */
    .topbar { display: flex; justify-content: space-between; align-items: center; padding: 6px 16px; border-bottom: 1px solid #ccc; font-size: 11px; }
    .bill-type { font-weight: bold; font-size: 11px; }
    .tag { border: 1px solid #555; padding: 1px 6px; margin-left: 8px; font-size: 10px; font-weight: normal; }
    .tagline { font-style: italic; font-size: 11px; }

    /* Header */
    .header { display: flex; align-items: flex-start; gap: 16px; padding: 14px 16px 10px; border-bottom: 3px solid #111; }
    .logo { width: 80px; flex-shrink: 0; }
    .logo img { width: 80px; height: auto; }
    .company-name { font-size: 22px; font-weight: 900; letter-spacing: 0.5px; margin-bottom: 4px; }
    .company-info p { font-size: 11px; line-height: 1.6; }
    .company-info strong { font-weight: bold; }

    /* Invoice info bar */
    .invoice-bar { display: flex; justify-content: space-between; background: #f5f5f5; border-bottom: 1px solid #ddd; padding: 8px 16px; font-size: 11px; }
    .invoice-bar span { font-size: 11px; }

    /* Bill to */
    .bill-to { padding: 10px 16px 8px; border-bottom: 1px solid #ddd; }
    .bill-to .label { font-size: 11px; font-weight: bold; color: #555; margin-bottom: 4px; }
    .bill-to .cname { font-size: 14px; font-weight: bold; }
    .bill-to .cmeta { font-size: 11px; color: #444; margin-top: 2px; }

    /* Items table */
    .items-table { width: 100%; border-collapse: collapse; border-bottom: 2px solid #111; }
    .items-table th { background: #f0f0f0; font-size: 11px; font-weight: bold; padding: 7px 10px; text-align: left; border-top: 1px solid #bbb; border-bottom: 1px solid #bbb; }
    .items-table th:not(:first-child) { text-align: right; }
    .items-table td { padding: 8px 10px; font-size: 12px; vertical-align: top; border-bottom: 1px solid #eee; }
    .items-table td:not(:first-child) { text-align: right; }
    .items-table .spacer td { height: 48px; border-bottom: none; }

    /* Subtotal */
    .subtotal-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; background: #f5f5f5; border-bottom: 1px solid #ddd; font-weight: bold; font-size: 12px; }

    /* Footer two-col */
    .footer-cols { display: flex; gap: 0; border-top: 1px solid #ddd; }
    .left-col { flex: 1; padding: 12px 10px; border-right: 1px solid #ddd; font-size: 11px; }
    .right-col { width: 220px; flex-shrink: 0; padding: 12px 10px; font-size: 11px; }

    .bank-title { font-weight: bold; font-size: 11px; margin-bottom: 5px; }
    .bank-grid { display: grid; grid-template-columns: auto 1fr; gap: 2px 8px; font-size: 11px; }
    .bank-grid .k { color: #555; white-space: nowrap; }
    .bank-grid .v { font-weight: 500; }

    .qr-section { margin-top: 12px; }
    .qr-section .upi-label { font-weight: bold; font-size: 11px; margin-bottom: 3px; }
    .qr-section .upi-id { font-size: 11px; color: #333; margin-bottom: 6px; }
    .qr-section img.qr { width: 90px; height: 90px; border: 1px solid #ddd; }
    .pay-logos { font-size: 10px; color: #555; margin-top: 4px; }

    .payment-mode { margin-top: 12px; font-size: 11px; }
    .payment-mode strong { font-weight: bold; }

    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; border-bottom: 1px solid #eee; }
    .total-row.main { font-weight: bold; font-size: 13px; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 4px; }
    .total-row.balance { color: #444; }
    .amount-words { margin-top: 10px; font-size: 11px; font-style: italic; color: #333; border-top: 1px solid #eee; padding-top: 8px; }
    .amount-words strong { font-style: normal; font-weight: bold; font-size: 11px; display: block; margin-bottom: 2px; }

    .signature-block { margin-top: 20px; text-align: right; font-size: 11px; font-weight: bold; border-top: 1px dashed #bbb; padding-top: 6px; }

    /* Notes & Terms */
    .notes-section { padding: 10px 16px; border-top: 1px solid #ddd; font-size: 11px; }
    .notes-section strong { font-size: 11px; font-weight: bold; display: block; margin-bottom: 3px; }
    .notes-section p, .notes-section li { line-height: 1.5; color: #444; }
    .notes-section ol { padding-left: 16px; }

    .print-btn { display: block; width: calc(100% - 32px); margin: 14px 16px; padding: 10px; background: #111; color: white; border: none; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; }

    @media print {
      body { background: white; padding: 0; }
      .page { max-width: 100%; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Top bar -->
  <div class="topbar">
    <span class="bill-type">BILL OF SUPPLY <span class="tag">ORIGINAL FOR RECIPIENT</span></span>
    <span class="tagline">Best Service Assured</span>
  </div>

  <!-- Header -->
  <div class="header">
    <div class="logo">
      <img src="/logo.jpg" alt="CCN Logo" />
    </div>
    <div class="company-info">
      <div class="company-name">CHANDNI CABLE NETWORK</div>
      <p>Main, Chaurai, Madhya Pradesh, 480115</p>
      <p><strong>Mobile:</strong> 9399974696 &nbsp;&nbsp; <strong>Email:</strong> jatinrai254@gmail.com</p>
      <p><strong>Udyam MSME:</strong> UDYAM-MP-13-0025439</p>
    </div>
  </div>

  <!-- Invoice info bar -->
  <div class="invoice-bar">
    <span><strong>Invoice Date:</strong> ${invoiceDate}</span>
  </div>

  <!-- Bill To -->
  <div class="bill-to">
    <div class="label">BILL TO</div>
    <div class="cname">${customer.name}</div>
    <div class="cmeta">Mobile: ${customer.mobile} &nbsp;&nbsp; STB: ${customer.stb_number} &nbsp;&nbsp; Area: ${customer.area}</div>
  </div>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:50%">ITEMS/SERVICES</th>
        <th>DAYS</th>
        <th>RATE</th>
        <th>AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          ${recharge.plan_name}
          ${recharge.activated_at && recharge.expires_at
            ? `<div style="font-size:10px;color:#555;margin-top:3px;">Valid: ${fmtDate(recharge.activated_at)} &mdash; ${fmtDate(new Date(new Date(recharge.expires_at).getTime() - 24 * 60 * 60 * 1000))}</div>`
            : ''}
        </td>
        <td>${days}</td>
        <td>${fmtCurrency(ratePerMonth)}</td>
        <td>${fmtCurrency(recharge.amount)}</td>
      </tr>
      <tr class="spacer"><td colspan="5"></td></tr>
    </tbody>
  </table>

  <!-- Subtotal -->
  <div class="subtotal-row">
    <span>SUBTOTAL</span>
    <span>&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;&nbsp;</span>
    <span>${fmtCurrency(recharge.amount)}</span>
  </div>

  <!-- Footer two columns -->
  <div class="footer-cols">
    <div class="left-col">
      <div class="payment-mode">
        <strong>PAYMENT MODE:</strong> Website / Cashfree<br>
        ${recharge.cashfree_order_id ? `<span style="color:#555">Ref: ${recharge.cashfree_order_id}</span>` : ''}
      </div>
    </div>

    <div class="right-col">
      <div class="total-row main">
        <span>Amount Paid</span><span>${fmtCurrency(recharge.amount)}</span>
      </div>

      <div class="amount-words">
        <strong>Total Amount (in words)</strong>
        ${numberToWords(recharge.amount)}
      </div>

      <div class="signature-block">
        <img src="/signature.png" alt="Signature" style="height:60px; width:auto; display:block; margin:0 auto 4px;" />
        AUTHORISED SIGNATORY FOR<br>CHANDNI CABLE NETWORK
      </div>
    </div>
  </div>

  <!-- Notes & Terms -->
  <div class="notes-section" style="border-top:2px solid #111">
    <strong>NOTES</strong>
    <p>STB No: ${customer.stb_number}</p>
  </div>
  <div class="notes-section">
    <strong>TERMS AND CONDITIONS</strong>
    <ol>
      <li>Subscription once renewed will neither be changed nor be refunded.</li>
      <li>All disputes are subject to Chaurai jurisdiction only.</li>
    </ol>
  </div>

  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
</div>
</body>
</html>`;
}
