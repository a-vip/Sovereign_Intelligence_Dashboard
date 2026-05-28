require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');
const fs = require('fs');

async function run() {
  await initDb();
  console.log("=== Searching sigint_events for URL ===");
  const { rows: events } = await sql`SELECT id, title, location, lat, lon, url, edited FROM sigint_events WHERE url LIKE '%chad-10-years-on%' OR title ILIKE '%Habre%'`;
  console.log("sigint_events:", JSON.stringify(events, null, 2));

  console.log("\n=== Searching rss_items for URL ===");
  const { rows: rss } = await sql`SELECT id, title, location, latitude, longitude, url, edited FROM rss_items WHERE url LIKE '%chad-10-years-on%' OR title ILIKE '%Habre%'`;
  console.log("rss_items:", JSON.stringify(rss, null, 2));

  console.log("\n=== Searching events-local.json ===");
  if (fs.existsSync('events-local.json')) {
    const local = JSON.parse(fs.readFileSync('events-local.json', 'utf8'));
    const matched = local.filter(e => e.url?.includes('chad-10-years-on') || e.title?.includes('Habre') || e.title?.includes('Habré'));
    console.log("events-local.json:", JSON.stringify(matched, null, 2));
  }

  console.log("\n=== Searching rss-local.json ===");
  if (fs.existsSync('rss-local.json')) {
    const local = JSON.parse(fs.readFileSync('rss-local.json', 'utf8'));
    const matched = local.filter(e => e.url?.includes('chad-10-years-on') || e.title?.includes('Habre') || e.title?.includes('Habré'));
    console.log("rss-local.json:", JSON.stringify(matched, null, 2));
  }
}

run();
