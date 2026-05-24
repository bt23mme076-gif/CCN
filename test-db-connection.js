// Test database connection
require('dotenv').config();
const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL;

console.log('Testing connection to:', connectionString.replace(/:[^:@]+@/, ':****@'));

const sql = postgres(connectionString, { max: 1 });

sql`SELECT 1 as test`
  .then((result) => {
    console.log('✅ Connection successful!');
    console.log('Result:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  });
