require('dotenv').config({ path: '.env.local' });
const { initDb, getNormalizedUrl, getNormalizedTitle } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  await initDb();
  console.log("=== Checking Habré rows in DB ===");
  const { rows } = await sql`SELECT id, title, url, location, lat, lon, edited FROM sigint_events WHERE url LIKE '%chad-10-years-on%'`;
  console.log(JSON.stringify(rows, null, 2));

  for (const row of rows) {
    console.log(`ID: ${row.id}`);
    console.log(`  Title: "${row.title}" -> normalized: "${getNormalizedTitle(row.title)}"`);
    console.log(`  URL: "${row.url}" -> normalized: "${getNormalizedUrl(row.url)}"`);
  }
}

run();
