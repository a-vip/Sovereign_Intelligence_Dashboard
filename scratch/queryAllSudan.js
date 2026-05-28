require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  try {
    await initDb();
    console.log("=== Querying all matching sigint_events ===");
    const { rows: events } = await sql`
      SELECT id, title, location, lat, lon, url, edited, timestamp 
      FROM sigint_events 
      WHERE title ILIKE '%Sudan%' OR title ILIKE '%Colombian%'
    `;
    console.log(JSON.stringify(events, null, 2));

    console.log("\n=== Querying all matching rss_items ===");
    const { rows: rss } = await sql`
      SELECT id, title, location, latitude, longitude, url, edited, published_at 
      FROM rss_items 
      WHERE title ILIKE '%Sudan%' OR title ILIKE '%Colombian%'
    `;
    console.log(JSON.stringify(rss, null, 2));

  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    process.exit(0);
  }
}

run();
