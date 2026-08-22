import { migrationClient } from './lib/db/index';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const USERNAME = process.env.SUPER_ADMIN_USERNAME ?? 'ccnadmin';
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? 'changeme123';

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const id = randomUUID();

  await migrationClient`
    INSERT INTO super_admins (id, username, password_hash)
    VALUES (${id}, ${USERNAME}, ${hash})
    ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `;

  console.log(`✓ Super-admin '${USERNAME}' created/updated.`);
  console.log(`  Login at: /superadmin/login`);
  await migrationClient.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
