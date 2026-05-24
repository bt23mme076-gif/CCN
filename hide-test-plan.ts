import 'dotenv/config';
import { db } from './lib/db';
import { plans } from './lib/db/schema';
import { eq } from 'drizzle-orm';

async function hideTestPlan() {
  console.log('Hiding test plan...');

  try {
    // Find test plan (₹1 = 100 paise)
    const testPlans = await db
      .select()
      .from(plans)
      .where(eq(plans.price, 100));

    if (testPlans.length === 0) {
      console.log('No test plan found (price = ₹1)');
      return;
    }

    console.log('Found test plan:', {
      id: testPlans[0].id,
      name: testPlans[0].name,
      price: testPlans[0].price,
      is_active: testPlans[0].is_active,
    });

    if (!testPlans[0].is_active) {
      console.log('✅ Test plan is already hidden!');
      return;
    }

    // Hide the test plan
    await db
      .update(plans)
      .set({ is_active: false })
      .where(eq(plans.id, testPlans[0].id));

    console.log('✅ Test plan hidden successfully!');
    console.log('Customers will no longer see this plan.');
  } catch (error) {
    console.error('❌ Failed to hide test plan:', error);
    process.exit(1);
  }

  process.exit(0);
}

hideTestPlan();
