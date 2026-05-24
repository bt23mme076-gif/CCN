import 'dotenv/config';
import { db } from './lib/db/index';
import { admins } from './lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

async function checkAndCreateAdmin() {
  console.log('Checking admin user...\n');

  try {
    // Check if admin exists
    const existingAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.username, 'admin'));

    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists!');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('\nYou can login at: http://localhost:3000/admin/login');
    } else {
      console.log('❌ Admin user not found. Creating...\n');
      
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      await db.insert(admins).values({
        id: `admin_${randomBytes(8).toString('hex')}`,
        username: 'admin',
        password_hash: passwordHash,
      });
      
      console.log('✅ Admin user created successfully!');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('\nYou can now login at: http://localhost:3000/admin/login');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking/creating admin user!');
    console.error(error);
    console.error('\n⚠️  Make sure your database connection is working.');
    console.error('Check your DATABASE_URL in .env file');
    process.exit(1);
  }
}

checkAndCreateAdmin();
