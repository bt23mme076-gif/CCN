import 'dotenv/config';
import { db } from './index';
import { plans, admins } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

// Load environment variables
// Load environment variables

async function main() {
  console.log('Seeding database...');

  // Seed plans
  const existingPlans = await db.select().from(plans);
  
  if (existingPlans.length === 0) {
    console.log('Seeding plans...');
    
    const plansData = [
      {
        id: `plan_${randomBytes(8).toString('hex')}`,
        name: 'Basic',
        price: 19900, // ₹199 in paise
        duration_days: 30,
        channels: ['100+ SD Channels', 'Doordarshan', 'Local Channels'],
        is_popular: false,
        is_active: true,
      },
      {
        id: `plan_${randomBytes(8).toString('hex')}`,
        name: 'ALL in ONE',
        price: 29900, // ₹299 in paise
        duration_days: 30,
        channels: ['200+ SD Channels', 'Star Network', 'Sony Set', 'Colors'],
        is_popular: true,
        is_active: true,
      },
      {
        id: `plan_${randomBytes(8).toString('hex')}`,
        name: 'Royal HD',
        price: 34900, // ₹349 in paise
        duration_days: 30,
        channels: ['All HD Channels', 'Premium HD Quality', 'Sports HD', 'Movies HD'],
        is_popular: false,
        is_active: true,
      },
      {
        id: `plan_${randomBytes(8).toString('hex')}`,
        name: 'Gold',
        price: 39900, // ₹399 in paise
        duration_days: 30,
        channels: ['300+ Channels', 'All SD+HD', 'Star Sports', 'Set Max'],
        is_popular: false,
        is_active: true,
      },
      {
        id: `plan_${randomBytes(8).toString('hex')}`,
        name: 'Platinum',
        price: 59900, // ₹599 in paise
        duration_days: 30,
        channels: ['500+ Channels', 'Full HD Pack', 'Premium Sports', 'English Movies'],
        is_popular: false,
        is_active: true,
      },
      {
        id: `plan_${randomBytes(8).toString('hex')}`,
        name: 'ALL in ONE 3M',
        price: 79900, // ₹799 in paise
        duration_days: 90,
        channels: ['200+ SD Channels', 'Star Network', 'Sony Set', 'Save ₹98'],
        is_popular: false,
        is_active: true,
      },
    ];

    await db.insert(plans).values(plansData);
    console.log('Plans seeded successfully!');
  } else {
    console.log('Plans already exist, skipping...');
  }

  // Seed admin
  const existingAdmin = await db.select().from(admins).where(eq(admins.username, 'admin'));
  
  if (existingAdmin.length === 0) {
    console.log('Seeding admin...');
    
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await db.insert(admins).values({
      id: `admin_${randomBytes(8).toString('hex')}`,
      username: 'admin',
      password_hash: passwordHash,
    });
    
    console.log('Admin seeded successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
  } else {
    console.log('Admin already exists, skipping...');
  }

  console.log('Seeding completed!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed!');
  console.error(err);
  process.exit(1);
});
