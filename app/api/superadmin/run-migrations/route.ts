import { NextResponse } from 'next/server';
import { migrationClient } from '@/lib/db/index';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function authCheck() {
  const cookieStore = await cookies();
  const token = cookieStore.get('super_admin_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'super_admin') return null;
  return payload;
}

// Runs the pending schema migrations that normally need a server terminal
// (add-upi-reference-column, add-due-amount-paise-column,
// add-deleted-at-columns, fix-admin-username-uniqueness) — all idempotent,
// safe to run more than once. Lets a super admin apply them from the
// dashboard on serverless hosts (Vercel) where there's no shell to run
// `npm run ...` from directly.
export async function POST() {
  if (!await authCheck()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const log: string[] = [];
  try {
    await migrationClient`ALTER TABLE recharges ADD COLUMN IF NOT EXISTS upi_reference TEXT;`;
    log.push('upi_reference column: ok');

    await migrationClient`ALTER TABLE recharges ADD COLUMN IF NOT EXISTS due_amount_paise INTEGER DEFAULT 0;`;
    log.push('due_amount_paise column: ok');

    await migrationClient`ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`;
    await migrationClient`ALTER TABLE recharges ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`;
    log.push('deleted_at columns: ok');

    await migrationClient`ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_username_key;`;
    await migrationClient`ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_username_unique;`;
    await migrationClient`
      CREATE UNIQUE INDEX IF NOT EXISTS admins_operator_username_idx
      ON admins (operator_id, username);
    `;
    log.push('admin username uniqueness: scoped to operator');

    const orphaned = await migrationClient`
      SELECT o.id, o.subdomain FROM operators o
      LEFT JOIN admins a ON a.operator_id = o.id
      WHERE a.id IS NULL;
    `;
    for (const row of orphaned) {
      await migrationClient`DELETE FROM operators WHERE id = ${row.id};`;
      log.push(`removed orphaned operator: ${row.subdomain}`);
    }
    if (orphaned.length === 0) log.push('no orphaned operators found');

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Run migrations error:', error);
    return NextResponse.json({ error: (error as Error).message, log }, { status: 500 });
  }
}
