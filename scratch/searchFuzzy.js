require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  await initDb();
  console.log("=== rss_items with Damascus/Syria ===");
  const { rows: r1 } = await sql`SELECT id, title, location, latitude, longitude, url, edited FROM rss_items WHERE location ILIKE '%Damascus%' OR location ILIKE '%Syria%'`;
  console.log(JSON.stringify(r1, null, 2));

  console.log("\n=== Total count of sigint_events ===");
  const { rows: r2 } = await sql`SELECT count(*) FROM sigint_events`;
  console.log(JSON.stringify(r2, null, 2));

  console.log("\n=== Total count of rss_items ===");
  const { rows: r3 } = await sql`SELECT count(*) FROM rss_items`;
  console.log(JSON.stringify(r3, null, 2));
}

run();
