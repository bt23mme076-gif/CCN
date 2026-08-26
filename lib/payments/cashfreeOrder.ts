const CASHFREE_API_URL =
  process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg/orders'
    : 'https://sandbox.cashfree.com/pg/orders';

export interface CashfreeOrderParams {
  orderId: string;
  amountPaise: number;
  customerId: string;
  customerPhone: string;
  customerName: string;
  returnUrl: string;
  // When set, Easy Split is activated for this order.
  operator?: { cashfree_vendor_id: string | null; commission_percent: number } | null;
}

export interface CashfreeOrderResult {
  paymentSessionId: string;
  cashfreeOrderId: string;
}

export async function createCashfreeOrder(params: CashfreeOrderParams): Promise<CashfreeOrderResult> {
  const { orderId, amountPaise, customerId, customerPhone, customerName, returnUrl, operator } = params;

  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    throw new Error('Payment gateway not configured. Please contact administrator.');
  }

  const amountRupees = (amountPaise / 100).toFixed(2);

  const body: Record<string, unknown> = {
    order_id: orderId,
    order_amount: amountRupees,
    order_currency: 'INR',
    customer_details: {
      customer_id: customerId,
      customer_phone: customerPhone,
      customer_name: customerName,
    },
    order_meta: { return_url: returnUrl },
  };

  // Activate Easy Split only when the operator has completed vendor KYC.
  if (operator?.cashfree_vendor_id) {
    const operatorAmountRupees = parseFloat(
      ((amountPaise / 100) * (1 - operator.commission_percent / 100)).toFixed(2)
    );
    body.order_splits = [
      { vendor_id: operator.cashfree_vendor_id, amount: operatorAmountRupees },
    ];
  }

  const res = await fetch(CASHFREE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': process.env.CASHFREE_APP_ID,
      'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      'x-api-version': '2023-08-01',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    let msg = text;
    try { msg = JSON.parse(text).message ?? text; } catch { /* keep raw */ }
    console.error(`Cashfree order creation failed (status ${res.status}):`, msg);
    throw new Error(`Payment gateway error: ${msg}`);
  }

  const data = JSON.parse(text);
  if (!data.payment_session_id) throw new Error('Payment gateway error: Missing payment session ID');

  return {
    paymentSessionId: data.payment_session_id,
    cashfreeOrderId: data.order_id ?? orderId,
  };
}
