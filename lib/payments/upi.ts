// Direct UPI collection — payee is the operator's PhonePe Business UPI ID,
// configured via env so it can be changed without a code deploy.
const UPI_VPA = process.env.UPI_VPA || 'Q055481811@ybl';
const UPI_PAYEE_NAME = process.env.UPI_PAYEE_NAME || 'Chandni Cable Network';

// operatorOverride lets each operator collect into their own UPI ID instead
// of CCN's — otherwise every tenant's customers would end up paying into
// the same account. Falls back to the platform default (env/CCN's own VPA)
// when an operator hasn't set one yet.
export function buildUpiLink(
  amountInPaise: number,
  note: string,
  operatorOverride?: { upi_vpa?: string | null; business_name?: string | null } | null
): string {
  const amountInRupees = (amountInPaise / 100).toFixed(2);
  const params = new URLSearchParams({
    pa: operatorOverride?.upi_vpa || UPI_VPA,
    pn: operatorOverride?.business_name || UPI_PAYEE_NAME,
    am: amountInRupees,
    cu: 'INR',
    tn: note.slice(0, 50),
  });
  return `upi://pay?${params.toString()}`;
}

// App-specific UPI intent schemes. Tapping these opens the app straight to a
// prefilled payment screen (payee, amount and note) — the user only enters
// their UPI PIN. Android honours all of them; on iOS only Google Pay and
// PhonePe register their scheme, and bare `upi://` does nothing.
export const UPI_APP_SCHEMES = {
  gpay: 'tez://upi/pay',
  phonepe: 'phonepe://pay',
  paytm: 'paytmmp://pay',
  any: 'upi://pay',
} as const;

export type UpiApp = keyof typeof UPI_APP_SCHEMES;

/** Rewrites a `upi://pay?...` link to open a specific UPI app. */
export function toUpiAppLink(upiLink: string, app: UpiApp): string {
  const query = upiLink.split('?')[1] ?? '';
  return `${UPI_APP_SCHEMES[app]}?${query}`;
}
