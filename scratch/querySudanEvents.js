require('dotenv').config({ path: '.env.local' });
const { initDb, getEvents, getRssItems } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function querySudan() {
  console.log("=== Querying Sudan/Colombians Events ===");
  await initDb();
  const isPostgres = !!process.env.POSTGRES_URL;
  console.log("Database Environment Postgres:", isPostgres);

  if (isPostgres) {
    console.log("\n--- SIGINT_EVENTS in Postgres ---");
    const { rows: events } = await sql`
      SELECT *
      FROM sigint_events
      WHERE title ILIKE '%Colombian%' OR title ILIKE '%Sudan%' OR location ILIKE '%Sudan%' OR location ILIKE '%Lebanon%';
    `;
    console.log(events);

    console.log("\n--- RSS_ITEMS in Postgres ---");
    const { rows: rss } = await sql`
      SELECT *
      FROM rss_items
      WHERE title ILIKE '%Colombian%' OR title ILIKE '%Sudan%' OR location ILIKE '%Sudan%' OR location ILIKE '%Lebanon%';
    `;
    console.log(rss);
  }
  process.exit(0);
}

querySudan();
