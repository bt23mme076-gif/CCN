export interface ReceiptData {
  recharge: {
    id: string;
    plan_name: string;
    amount: number;
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

function fmt(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(date));
}

function fmtCurrency(paise: number): string {
  return `₹${(paise / 100).toFixed(0)}`;
}

export function generateReceiptHTML(data: ReceiptData): string {
  const { recharge, customer } = data;
  const statusColor =
    recharge.status === 'activated' ? '#16a34a' :
    recharge.status === 'paid' ? '#2563eb' : '#6b7280';
  const statusLabel =
    recharge.status === 'activated' ? 'ACTIVATED' :
    recharge.status === 'paid' ? 'PAID' :
    recharge.status.toUpperCase();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt - ${recharge.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; color: #222; }
    .receipt { max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
    .header { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); color: white; padding: 28px 24px; text-align: center; }
    .header h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { font-size: 13px; opacity: 0.7; margin-top: 4px; }
    .status-badge { display: inline-block; margin-top: 12px; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 1px; background: ${statusColor}; color: white; }
    .body { padding: 24px; }
    .receipt-id { font-size: 11px; color: #888; text-align: center; margin-bottom: 20px; word-break: break-all; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #999; margin-bottom: 10px; border-bottom: 1px solid #f0f0f0; padding-bottom: 6px; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; padding: 5px 0; font-size: 13px; gap: 12px; }
    .row .label { color: #666; flex-shrink: 0; }
    .row .value { font-weight: 500; text-align: right; word-break: break-all; }
    .amount-row { padding: 14px; background: #f8fafc; border-radius: 8px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; }
    .amount-label { font-size: 13px; color: #555; }
    .amount-value { font-size: 26px; font-weight: 800; color: #16a34a; }
    .footer { padding: 16px 24px; background: #fafafa; border-top: 1px solid #f0f0f0; text-align: center; font-size: 11px; color: #aaa; }
    .print-btn { display: block; width: 100%; margin-top: 20px; padding: 12px; background: #302b63; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
    @media print {
      body { background: white; padding: 0; }
      .receipt { box-shadow: none; border-radius: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>CCN Networks</h1>
      <p>Cable &amp; Internet Services</p>
      <span class="status-badge">${statusLabel}</span>
    </div>
    <div class="body">
      <p class="receipt-id">Receipt ID: ${recharge.id}</p>

      <div class="section">
        <div class="section-title">Customer Details</div>
        <div class="row"><span class="label">Name</span><span class="value">${customer.name}</span></div>
        <div class="row"><span class="label">Mobile</span><span class="value">${customer.mobile}</span></div>
        <div class="row"><span class="label">STB Number</span><span class="value">${customer.stb_number}</span></div>
        <div class="row"><span class="label">Area</span><span class="value">${customer.area}</span></div>
      </div>

      <div class="section">
        <div class="section-title">Plan Details</div>
        <div class="row"><span class="label">Plan</span><span class="value">${recharge.plan_name}</span></div>
        <div class="row"><span class="label">Order Date</span><span class="value">${fmt(recharge.created_at)}</span></div>
        ${recharge.paid_at ? `<div class="row"><span class="label">Payment Date</span><span class="value">${fmt(recharge.paid_at)}</span></div>` : ''}
        ${recharge.activated_at ? `<div class="row"><span class="label">Activation Date</span><span class="value">${fmt(recharge.activated_at)}</span></div>` : ''}
        ${recharge.expires_at ? `<div class="row"><span class="label">Valid Until</span><span class="value">${fmt(recharge.expires_at)}</span></div>` : ''}
      </div>

      ${recharge.cashfree_order_id ? `
      <div class="section">
        <div class="section-title">Transaction Reference</div>
        <div class="row"><span class="label">Order ID</span><span class="value">${recharge.cashfree_order_id}</span></div>
        ${recharge.cashfree_payment_id ? `<div class="row"><span class="label">Payment ID</span><span class="value">${recharge.cashfree_payment_id}</span></div>` : ''}
      </div>` : ''}

      <div class="amount-row">
        <span class="amount-label">Amount Paid</span>
        <span class="amount-value">${fmtCurrency(recharge.amount)}</span>
      </div>

      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </div>
    <div class="footer">
      Generated on ${fmt(new Date())} &nbsp;&bull;&nbsp; CCN Networks
    </div>
  </div>
</body>
</html>`;
}
