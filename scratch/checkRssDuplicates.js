require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  await initDb();
  console.log("=== Querying Duplicates in rss_items ===");
  const { rows: rss } = await sql`
    SELECT id, title, location, latitude, longitude, edited, published_at, url
    FROM rss_items
    WHERE title ILIKE '%Colombian%' OR title ILIKE '%Sudan%' OR location ILIKE '%Sudan%' OR location ILIKE '%Lebanon%';
  `;
  console.log("Found rss_items matches:", rss.length);
  rss.forEach(e => {
    console.log(`- ID: ${e.id}\n  Title: ${e.title}\n  Location: ${e.location}\n  Coords: (${e.latitude}, ${e.longitude})\n  Edited: ${e.edited}\n  Published At: ${e.published_at}\n  URL: ${e.url}\n`);
  });
  process.exit(0);
}

run();
