require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  try {
    await initDb();
    console.log("Searching for Sudan/Colombians in rss_items table...");
    
    // search by title and summary
    const { rows } = await sql`
      SELECT id, title, url, location, latitude, longitude, edited 
      FROM rss_items 
      WHERE title ILIKE '%Sudan%' OR title ILIKE '%Colombian%' OR url ILIKE '%sudan-colombians-linked%'
    `;
    
    console.log(`Found ${rows.length} matching RSS items:`);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error("Error checking rss_items:", err);
  } finally {
    process.exit(0);
  }
}

run();
