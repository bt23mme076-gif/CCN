import { migrationClient } from './lib/db/index';

const USERNAME = process.argv[2];

async function main() {
  if (!USERNAME) {
    console.error('Please specify the username to delete. Example: npx tsx delete-super-admin.ts ccnadmin');
    process.exit(1);
  }

  await migrationClient`
    DELETE FROM super_admins WHERE username = ${USERNAME}
  `;

  console.log(`✓ Super-admin '${USERNAME}' deleted from the database.`);
  await migrationClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
