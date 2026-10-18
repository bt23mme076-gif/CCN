import { migrationClient } from './lib/db/index';

async function main() {
  await migrationClient`
    CREATE TABLE IF NOT EXISTS stream_ad_packages (
      id TEXT PRIMARY KEY,
      operator_id TEXT REFERENCES operators(id),
      ad_type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      duration_days INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );
  `;
  await migrationClient`
    CREATE TABLE IF NOT EXISTS stream_ad_bookings (
      id TEXT PRIMARY KEY,
      operator_id TEXT REFERENCES operators(id),
      package_id TEXT REFERENCES stream_ad_packages(id) ON DELETE SET NULL,
      ad_type TEXT NOT NULL,
      package_name TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      advertiser_name TEXT NOT NULL,
      business_name TEXT,
      phone TEXT NOT NULL,
      banner_data TEXT NOT NULL,
      scroll_text TEXT,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      notes TEXT,
      admin_note TEXT,
      status TEXT NOT NULL,
      upi_reference TEXT,
      paid_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );
  `;
  await migrationClient`CREATE INDEX IF NOT EXISTS stream_ad_bookings_status_idx ON stream_ad_bookings (status);`;
  console.log('✓ stream_ad_packages + stream_ad_bookings tables ready');
  await migrationClient.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
