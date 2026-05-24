import 'dotenv/config';
import { db } from './lib/db';
import { plans } from './lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

async function addTestPlan() {
  console.log('Adding ₹1 test plan...');

  try {
    // Check if test plan already exists
    const existingTestPlan = await db
      .select()
      .from(plans)
      .where(eq(plans.price, 100)); // ₹1 in paise

    if (existingTestPlan.length > 0) {
      console.log('Test plan already exists!');
      console.log('Plan ID:', existingTestPlan[0].id);
      return;
    }

    // Add test plan
    const testPlan = {
      id: `plan_${randomBytes(8).toString('hex')}`,
      name: 'Test Plan',
      price: 100, // ₹1 in paise
      duration_days: 1,
      channels: ['Test Payment Gateway', 'Verify Integration', 'Demo Only'],
      is_popular: false,
      is_active: true,
    };

    await db.insert(plans).values(testPlan);

    console.log('✅ Test plan added successfully!');
    console.log('Plan ID:', testPlan.id);
    console.log('Name:', testPlan.name);
    console.log('Price: ₹1');
    console.log('Duration: 1 day');
    console.log('\nThis plan will appear on the home page for testing payments.');
  } catch (error) {
    console.error('❌ Failed to add test plan:', error);
    process.exit(1);
  }

  process.exit(0);
}

addTestPlan();
