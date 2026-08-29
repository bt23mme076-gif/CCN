import { randomBytes } from 'crypto';

export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = randomBytes(2).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function formatCurrency(amountInPaise: number): string {
  return `₹${(amountInPaise / 100).toFixed(0)}`;
}

export function formatDate(date: Date | null): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | null): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(date));
}

export function getDaysRemaining(expiresAt: Date | null): number {
  if (!expiresAt) return 0;
  const now = new Date();
  const diff = new Date(expiresAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatDateDMY(date: Date | string | null): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(date));
}

export function formatDisplayEndDate(expiresAt: Date | string | null): string {
  if (!expiresAt) return '-';
  const dateObj = new Date(expiresAt);
  // Subtract 1 day (24 hours) to get the last active day
  const displayDate = new Date(dateObj.getTime() - 24 * 60 * 60 * 1000);
  return formatDateDMY(displayDate);
}

export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  // The CCN Android app spoofs its User-Agent to look like real Chrome, so
  // UA sniffing alone can't detect it — check for the JS interface the app
  // injects (addJavascriptInterface) first, which is reliable regardless of UA.
  if ((window as any).Android) return true;
  const ua = navigator.userAgent;
  return /wv\b/.test(ua) ||
    /FB_IAB|FBAN|Instagram|Snapchat|Twitter|Line|MicroMessenger/.test(ua) ||
    (ua.includes('Android') && !ua.includes('Chrome/'));
}

export function openInExternalBrowser(): void {
  if (typeof window === 'undefined') return;
  const currentUrl = window.location.href.replace(/^https?:\/\//, '');
  const intentUrl = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;
  window.open(intentUrl, '_blank');
}

