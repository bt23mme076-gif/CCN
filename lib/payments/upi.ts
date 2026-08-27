// Temporary UPI collection while a proper payment gateway (Cashfree blocked,
// Razorpay rejected) is under verification. Payee is the operator's PhonePe
// Business UPI ID, which displays "Chandni Cable Network" (not a personal
// name) on the payer's screen.
const UPI_VPA = 'Q055481811@ybl';
const UPI_PAYEE_NAME = 'Chandni Cable Network';

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
