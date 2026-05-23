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
