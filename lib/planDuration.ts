export const DURATION_OPTIONS = [
  { months: 1, label: '1M' },
  { months: 3, label: '3M' },
  { months: 6, label: '6M' },
  { months: 12, label: '12M' },
] as const;

export type DurationMonths = typeof DURATION_OPTIONS[number]['months'];

export function isValidMonths(months: number): months is DurationMonths {
  return DURATION_OPTIONS.some((o) => o.months === months);
}

// basePrice/baseDurationDays are for the 1-month plan (in paise / days respectively).
// discountPercent only applies when months > 1, and is customer-specific (admin controlled).
export function calcDurationPricing(
  basePrice: number,
  baseDurationDays: number,
  months: number,
  discountPercent: number = 0
) {
  const validMonths = isValidMonths(months) ? months : 1;
  const effectiveDiscount = validMonths > 1 ? discountPercent : 0;
  const rawTotal = basePrice * validMonths;
  const price = Math.round(rawTotal * (1 - effectiveDiscount / 100));
  const durationDays = baseDurationDays * validMonths;
  return { price, durationDays, discountPercent: effectiveDiscount, months: validMonths };
}
