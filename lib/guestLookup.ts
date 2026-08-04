import { db } from './db';
import { customers, customerConnections } from './db/schema';
import { eq } from 'drizzle-orm';

export interface GuestCustomerMatch {
  customerId: string;
  connectionId: string | null; // null = primary
  name: string;
  area: string;
  mobile: string;
  outstanding_balance: number;
}

export async function findCustomerByStb(stbNumber: string): Promise<GuestCustomerMatch | null> {
  const trimmed = stbNumber.trim();
  if (!trimmed) return null;

  const primary = await db.select().from(customers).where(eq(customers.stb_number, trimmed)).limit(1);
  if (primary.length > 0) {
    const c = primary[0];
    return {
      customerId: c.id,
      connectionId: null,
      name: c.name,
      area: c.area,
      mobile: c.mobile,
      outstanding_balance: c.outstanding_balance,
    };
  }

  const conn = await db.select().from(customerConnections).where(eq(customerConnections.stb_number, trimmed)).limit(1);
  if (conn.length > 0) {
    const cust = await db.select().from(customers).where(eq(customers.id, conn[0].customer_id)).limit(1);
    if (cust.length === 0) return null;
    return {
      customerId: cust[0].id,
      connectionId: conn[0].id,
      name: cust[0].name,
      area: conn[0].area,
      mobile: cust[0].mobile,
      outstanding_balance: cust[0].outstanding_balance,
    };
  }

  return null;
}

export async function findCustomerByMobile(mobile: string): Promise<GuestCustomerMatch | null> {
  const trimmed = mobile.trim();
  if (!trimmed) return null;

  const match = await db.select().from(customers).where(eq(customers.mobile, trimmed)).limit(1);
  if (match.length === 0) return null;

  const c = match[0];
  return {
    customerId: c.id,
    connectionId: null, // mobile lookup always resolves to the primary connection
    name: c.name,
    area: c.area,
    mobile: c.mobile,
    outstanding_balance: c.outstanding_balance,
  };
}

// Accepts either an STB number or a 10-digit mobile number and resolves it
// to the matching customer/connection.
export async function findCustomerByStbOrMobile(identifier: string): Promise<GuestCustomerMatch | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const digitsOnly = /^\d{10}$/.test(trimmed);
  if (digitsOnly) {
    const byMobile = await findCustomerByMobile(trimmed);
    if (byMobile) return byMobile;
  }

  return findCustomerByStb(trimmed);
}

export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return name;
  return parts.map((p, i) => (i === 0 ? p : `${p[0]}.`)).join(' ');
}

export function maskMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length < 6) return mobile;
  return `${digits.slice(0, 2)}XXXXX${digits.slice(-3)}`;
}
