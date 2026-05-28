require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  try {
    await initDb();
    console.log("Querying detailed RSS items for 'Colombians'...");
    const { rows } = await sql`SELECT id, url, title, location, latitude, longitude, edited, source FROM rss_items WHERE title ILIKE '%Colombians%'`;
    console.log("Detailed matches in rss_items:", JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
