import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const sql = postgres(process.env.DATABASE_URL!, {
    ssl: 'require',
  });

  try {
    console.log('🔄 Running Cashfree migration...');
    console.log('📋 Checking current schema...');
    
    // Check if old columns exist
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'recharges'
      AND column_name IN ('razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature')
    `;
    
    if (columns.length === 0) {
      console.log('✅ Migration already completed! Columns are already renamed.');
      await sql.end();
      process.exit(0);
    }
    
    console.log(`Found ${columns.length} columns to migrate`);
    
    // Rename columns
    if (columns.some(c => c.column_name === 'razorpay_order_id')) {
      console.log('🔧 Renaming razorpay_order_id to cashfree_order_id...');
      await sql`
        ALTER TABLE recharges 
        RENAME COLUMN razorpay_order_id TO cashfree_order_id
      `;
    }
    
    if (columns.some(c => c.column_name === 'razorpay_payment_id')) {
      console.log('🔧 Renaming razorpay_payment_id to cashfree_payment_id...');
      await sql`
        ALTER TABLE recharges 
        RENAME COLUMN razorpay_payment_id TO cashfree_payment_id
      `;
    }
    
    if (columns.some(c => c.column_name === 'razorpay_signature')) {
      console.log('🔧 Renaming razorpay_signature to cashfree_signature...');
      await sql`
        ALTER TABLE recharges 
        RENAME COLUMN razorpay_signature TO cashfree_signature
      `;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your server: npm run dev');
    console.log('2. Test payment flow');
    
    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    await sql.end();
    process.exit(1);
  }
}

runMigration();
