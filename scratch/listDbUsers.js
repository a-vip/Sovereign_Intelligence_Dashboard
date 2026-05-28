require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  try {
    await initDb();
    console.log("Listing all users from Postgres database...");
    const { rows } = await sql`SELECT id, email, role, full_name FROM users`;
    console.log("Users in DB:", JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error("Error listing users:", err);
  } finally {
    process.exit(0);
  }
}

run();
