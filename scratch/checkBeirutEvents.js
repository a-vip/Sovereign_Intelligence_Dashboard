require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  await initDb();
  console.log("=== Querying Beirut Events in sigint_events ===");
  const { rows: events } = await sql`
    SELECT id, title, location, lat, lon, edited, timestamp, url
    FROM sigint_events
    WHERE location ILIKE '%Beirut%' OR location ILIKE '%Lebanon%';
  `;
  console.log("Found Beirut/Lebanon events:", events.length);
  events.forEach(e => {
    console.log(`- ID: ${e.id}\n  Title: ${e.title}\n  Location: ${e.location}\n  Coords: (${e.lat}, ${e.lon})\n  Edited: ${e.edited}\n  TS: ${e.timestamp}\n  URL: ${e.url}\n`);
  });
  process.exit(0);
}

run();
