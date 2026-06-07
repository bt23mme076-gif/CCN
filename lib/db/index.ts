import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Supabase transaction pooler (port 6543) runs pgBouncer in transaction mode,
// which does NOT support prepared statements. postgres-js uses them by default,
// so we MUST disable them or queries fail intermittently -> 500s / timeouts.
const isTransactionPooler = connectionString.includes(':6543');

// Reuse a single client across hot reloads / module re-imports so we don't leak
// connection pools and exhaust Supabase's connection limit (which causes the
// "lag then timeout" symptom once the pool is saturated).
const globalForDb = globalThis as unknown as {
  queryClient?: ReturnType<typeof postgres>;
};

const queryClient =
  globalForDb.queryClient ??
  postgres(connectionString, {
    // Disable prepared statements when using the transaction pooler.
    prepare: !isTransactionPooler,
    // Keep the pool small — Supabase's pooler is shared and capped.
    max: 10,
    // Drop idle connections so they don't sit and hit pooler timeouts.
    idle_timeout: 20, // seconds
    // Fail fast instead of hanging forever when the DB is unreachable.
    connect_timeout: 10, // seconds
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.queryClient = queryClient;
}

export const db = drizzle(queryClient, { schema });

// Dedicated single-connection client for migrations only.
export const migrationClient = postgres(connectionString, {
  max: 1,
  prepare: !isTransactionPooler,
});
