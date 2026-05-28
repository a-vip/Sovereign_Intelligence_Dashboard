require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  await initDb();
  console.log("=== Querying Duplicates in sigint_events ===");
  const { rows: events } = await sql`
    SELECT id, title, location, lat, lon, edited, timestamp, url
    FROM sigint_events
    WHERE title ILIKE '%Colombian%' OR title ILIKE '%Sudan%';
  `;
  console.log("Found sigint_events matches:", events.length);
  events.forEach(e => {
    console.log(`- ID: ${e.id}\n  Title: ${e.title}\n  Location: ${e.location}\n  Coords: (${e.lat}, ${e.lon})\n  Edited: ${e.edited}\n  TS: ${e.timestamp}\n  URL: ${e.url}\n`);
  });

  console.log("=== Querying Duplicates in rss_items ===");
  const { rows: rss } = await sql`
    SELECT id, title, location, latitude, longitude, edited, timestamp, url
    FROM rss_items
    WHERE title ILIKE '%Colombian%' OR title ILIKE '%Sudan%';
  `;
  console.log("Found rss_items matches:", rss.length);
  rss.forEach(e => {
    console.log(`- ID: ${e.id}\n  Title: ${e.title}\n  Location: ${e.location}\n  Coords: (${e.latitude}, ${e.longitude})\n  Edited: ${e.edited}\n  TS: ${e.timestamp}\n  URL: ${e.url}\n`);
  });
  process.exit(0);
}

run();
