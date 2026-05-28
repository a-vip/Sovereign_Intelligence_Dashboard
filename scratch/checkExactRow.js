require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  await initDb();
  console.log("=== Checking Exact Row ===");
  const { rows } = await sql`SELECT * FROM sigint_events WHERE id = 'e30e12e2d09796035fdb18809ba8cfc0'`;
  console.log(JSON.stringify(rows, null, 2));
}

run();
