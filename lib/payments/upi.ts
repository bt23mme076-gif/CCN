// Direct UPI collection — payee is the operator's PhonePe Business UPI ID,
// configured via env so it can be changed without a code deploy.
const UPI_VPA = process.env.UPI_VPA || 'Q055481811@ybl';
const UPI_PAYEE_NAME = process.env.UPI_PAYEE_NAME || 'Chandni Cable Network';

export function buildUpiLink(amountInPaise: number, note: string): string {
  const amountInRupees = (amountInPaise / 100).toFixed(2);
  const params = new URLSearchParams({
    pa: UPI_VPA,
    pn: UPI_PAYEE_NAME,
    am: amountInRupees,
    cu: 'INR',
    tn: note.slice(0, 50),
  });
  return `upi://pay?${params.toString()}`;
}
