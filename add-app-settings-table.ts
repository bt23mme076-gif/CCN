import { migrationClient } from './lib/db/index';

async function main() {
  await migrationClient`
    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY DEFAULT 'global',
      payu_enabled BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    );
  `;
  await migrationClient`
    INSERT INTO app_settings (id, payu_enabled) VALUES ('global', true)
    ON CONFLICT (id) DO NOTHING;
  `;
  console.log('✓ app_settings table ready');
  await migrationClient.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
