require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  await initDb();
  console.log("=== sigint_events containing Sudan/Colombian ===");
  const { rows: r1 } = await sql`SELECT id, title, location, lat, lon, url, edited FROM sigint_events WHERE title ILIKE '%Sudan%' OR title ILIKE '%Colombian%'`;
  console.log(JSON.stringify(r1, null, 2));

  console.log("\n=== rss_items containing Sudan/Colombian ===");
  const { rows: r2 } = await sql`SELECT id, title, location, latitude, longitude, url, edited FROM rss_items WHERE title ILIKE '%Sudan%' OR title ILIKE '%Colombian%'`;
  console.log(JSON.stringify(r2, null, 2));
}

run();
