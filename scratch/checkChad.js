require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  try {
    await initDb();
    console.log("=== Checking Chad Event in Database ===");
    
    const { rows: events } = await sql`SELECT * FROM sigint_events WHERE title ILIKE '%Habre%' OR title ILIKE '%Chad%'`;
    console.log(`Found ${events.length} in sigint_events:`);
    console.log(JSON.stringify(events, null, 2));
    
    const { rows: rss } = await sql`SELECT * FROM rss_items WHERE title ILIKE '%Habre%' OR title ILIKE '%Chad%'`;
    console.log(`\nFound ${rss.length} in rss_items:`);
    console.log(JSON.stringify(rss, null, 2));

  } catch (err) {
    console.error("Error querying Chad event:", err);
  } finally {
    process.exit(0);
  }
}

run();
