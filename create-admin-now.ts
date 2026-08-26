import 'dotenv/config';
import { db } from './lib/db/index';
import { admins } from './lib/db/schema';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

async function createAdmin() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    console.error('SEED_ADMIN_PASSWORD env var is required (no default password allowed).');
    process.exit(1);
  }

  console.log('Testing database connection...\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
  console.log('');

  try {
    // Test connection first
    console.log('Attempting to connect to database...');
    const testQuery = await db.select().from(admins).limit(1);
    console.log('✅ Database connection successful!\n');

    // Delete any existing admin first
    console.log('Clearing existing admins...');
    await db.delete(admins);
    console.log('✅ Cleared existing admins\n');

    // Create new admin
    console.log('Creating new admin user...');
    const passwordHash = await bcrypt.hash(password, 10);
    
    const newAdmin = await db.insert(admins).values({
      id: `admin_${randomBytes(8).toString('hex')}`,
      username: 'admin',
      password_hash: passwordHash,
    }).returning();
    
    console.log('✅ Admin user created successfully!\n');
    console.log('═══════════════════════════════');
    console.log('  LOGIN CREDENTIALS');
    console.log('═══════════════════════════════');
    console.log('  Username: admin');
    console.log('  Password: (set via SEED_ADMIN_PASSWORD)');
    console.log('═══════════════════════════════\n');
    console.log('Login URL: http://localhost:3000/admin/login\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ FAILED!\n');
    console.error('Error:', error.message);
    console.error('\n📋 TROUBLESHOOTING STEPS:');
    console.error('═══════════════════════════════════════════════════════');
    console.error('1. Check your .env file has DATABASE_URL');
    console.error('2. Get connection string from Supabase Dashboard:');
    console.error('   Settings → Database → Connection string (URI)');
    console.error('3. Format should be:');
    console.error('   postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres');
    console.error('4. Run migrations first: npm run db:migrate');
    console.error('5. Make sure Supabase project is not paused');
    console.error('═══════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

createAdmin();
