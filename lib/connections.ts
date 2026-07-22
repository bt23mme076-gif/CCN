import { db } from './db';
import { customers, customerConnections } from './db/schema';
import { eq } from 'drizzle-orm';

export interface ConnectionInfo {
  id: string;         // 'primary' or customerConnections.id
  stb_number: string;
  area: string;
  label: string | null;
  isPrimary: boolean;
}

// Returns primary + all additional connections for a customer
export async function getCustomerConnections(customerId: string): Promise<ConnectionInfo[]> {
  const [customer, extras] = await Promise.all([
    db.select({ stb_number: customers.stb_number, area: customers.area })
      .from(customers).where(eq(customers.id, customerId)).limit(1),
    db.select().from(customerConnections).where(eq(customerConnections.customer_id, customerId)),
  ]);

  if (!customer.length) return [];

  const primary: ConnectionInfo = {
    id: 'primary',
    stb_number: customer[0].stb_number,
    area: customer[0].area,
    label: 'Primary',
    isPrimary: true,
  };

  const additional: ConnectionInfo[] = extras.map((c) => ({
    id: c.id,
    stb_number: c.stb_number,
    area: c.area,
    label: c.label,
    isPrimary: false,
  }));

  return [primary, ...additional];
}

// Returns the STB number for a given connection selection
// connectionId: 'primary' | customerConnections.id
export async function resolveConnection(
  customerId: string,
  connectionId: string | null | undefined,
): Promise<{ stb_number: string; area: string; connectionId: string | null } | null> {
  if (!connectionId || connectionId === 'primary') {
    const c = await db.select({ stb_number: customers.stb_number, area: customers.area })
      .from(customers).where(eq(customers.id, customerId)).limit(1);
    return c.length ? { stb_number: c[0].stb_number, area: c[0].area, connectionId: null } : null;
  }

  const conn = await db.select()
    .from(customerConnections)
    .where(eq(customerConnections.id, connectionId))
    .limit(1);

  if (!conn.length || conn[0].customer_id !== customerId) return null;
  return { stb_number: conn[0].stb_number, area: conn[0].area, connectionId };
}
