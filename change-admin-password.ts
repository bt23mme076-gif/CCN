import 'dotenv/config';
import { db } from './lib/db/index';
import { admins } from './lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function changePassword() {
  console.log('=== Change Admin Password ===\n');

  try {
    const username = await question('Enter admin username (default: admin): ') || 'admin';
    const newPassword = await question('Enter new password: ');
    const confirmPassword = await question('Confirm new password: ');

    if (!newPassword || newPassword.length < 6) {
      console.error('❌ Password must be at least 6 characters long!');
      process.exit(1);
    }

    if (newPassword !== confirmPassword) {
      console.error('❌ Passwords do not match!');
      process.exit(1);
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the admin password
    const result = await db
      .update(admins)
      .set({ password_hash: passwordHash })
      .where(eq(admins.username, username))
      .returning();

    if (result.length === 0) {
      console.error(`❌ Admin user '${username}' not found!`);
      process.exit(1);
    }

    console.log('\n✅ Password changed successfully!');
    console.log(`Username: ${username}`);
    console.log('New password has been set.');
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to change password!');
    console.error(error);
    rl.close();
    process.exit(1);
  }
}

changePassword();
