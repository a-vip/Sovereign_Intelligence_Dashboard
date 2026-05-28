require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  try {
    await initDb();
    console.log("Searching for Sudan event in rss_items table...");
    const { rows } = await sql`SELECT id, title, edited, location, latitude, longitude FROM rss_items WHERE title ILIKE '%Colombians%'`;
    if (rows.length === 0) {
      console.log("No matching items found in rss_items table.");
    } else {
      console.log("Found in rss_items table:", JSON.stringify(rows, null, 2));
    }
  } catch (err) {
    console.error("Error searching rss_items:", err);
  } finally {
    process.exit(0);
  }
}

run();
