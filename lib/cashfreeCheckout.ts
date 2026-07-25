import { load } from '@cashfreepayments/cashfree-js';

export async function openCashfreeCheckout(paymentSessionId: string) {
  const cashfree = await load({
    mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
  });
  if (!cashfree) throw new Error('Failed to load Cashfree');
  await (cashfree as any).checkout({
    paymentSessionId,
    redirectTarget: '_self',
  });
}
