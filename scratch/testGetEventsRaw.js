require('dotenv').config({ path: '.env.local' });
const { initDb, getEvents } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  await initDb();
  console.log("POSTGRES_URL:", !!process.env.POSTGRES_URL);
  
  try {
    const res = await sql`SELECT * FROM sigint_events`;
    console.log("Total events in DB (any):", res.rows.length);
    if (res.rows.length > 0) {
      console.log("Columns:", Object.keys(res.rows[0]));
      console.log("Sample event:", res.rows[0]);
    }
  } catch (err) {
    console.error("Raw SQL error:", err);
  }

  const events = await getEvents('24h');
  console.log("getEvents('24h') returned count:", events.length);
  if (events.length > 0) {
    console.log("Sample getEvents:", events[0]);
  }
  process.exit(0);
}

run();
