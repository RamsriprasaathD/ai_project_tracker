// test-env.js
// Usage: node test-env.js
// This script prints the DATABASE_URL from your .env file and attempts a connection to the database.

require('dotenv').config();
const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

console.log('DATABASE_URL:', dbUrl);

(async () => {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log('✅ Connected! Server time:', res.rows[0].now);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(2);
  }
})();
