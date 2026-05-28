require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  try {
    await initDb();
    console.log("Checking if Sudan Colombian event exists in DB...");
    const targetId = 'https___www_hrw_org_news_2026_05_25_sudan_colombians_linked_to_a';
    const { rows } = await sql`SELECT * FROM sigint_events WHERE id = ${targetId}`;
    if (rows.length === 0) {
      console.log("Event not found in sigint_events table.");
    } else {
      console.log("Found event in DB:", JSON.stringify(rows[0], null, 2));
    }
  } catch (err) {
    console.error("Error checking event:", err);
  } finally {
    process.exit(0);
  }
}

run();
