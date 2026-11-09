// Extracts amount + UTR from an Indian bank "money received" SMS or a
// PhonePe Business / GPay for Business payment notification.
// Returns null for anything that isn't a credit (debits, OTPs, promos).

export interface ParsedCredit {
  amountPaise: number;
  utr?: string;
}

const CREDIT_RE = /\b(credited|received|deposited)\b/i;
const DEBIT_RE = /\b(debited|sent|paid|withdrawn)\b/i;
const CURRENCY_AMOUNT_RE = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
const BARE_AMOUNT_RE = /credited\s+(?:by|with|for)\s+([\d,]+(?:\.\d{1,2})?)/i;
const UTR_NEAR_KEYWORD_RE = /(?:utr|rrn|ref(?:erence)?\s*(?:no|number)?|upi)[^\d]{0,15}(\d{12})(?!\d)/i;
const ANY_12_DIGITS_RE = /(?<!\d)(\d{12})(?!\d)/;

export function parseCreditMessage(text: string): ParsedCredit | null {
  const credit = text.search(CREDIT_RE);
  if (credit < 0) return null;
  const debit = text.search(DEBIT_RE);
  if (debit >= 0 && debit < credit) return null; // primarily a debit message

  const m = text.match(CURRENCY_AMOUNT_RE) ?? text.match(BARE_AMOUNT_RE);
  if (!m) return null;
  const amountPaise = Math.round(parseFloat(m[1].replace(/,/g, '')) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) return null;

  const utr = (text.match(UTR_NEAR_KEYWORD_RE) ?? text.match(ANY_12_DIGITS_RE))?.[1];
  return { amountPaise, utr };
}
