require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  try {
    await initDb();
    console.log("=== Healing Duplicate Chad Habré Records ===");
    
    // We update all sigint_events matching the title or URL of the Habre event
    const titlePattern = '%Habré%';
    const urlPattern = '%chad-10-years-on%';
    
    console.log("Updating sigint_events duplicate records...");
    const res = await sql`
      UPDATE sigint_events 
      SET location = 'Chad', 
          lat = 15.6134137, 
          lon = 19.0156172, 
          edited = TRUE 
      WHERE title ILIKE ${titlePattern} OR url ILIKE ${urlPattern}
    `;
    
    console.log(`Successfully updated ${res.rowCount} rows in sigint_events!`);

    console.log("Checking updated rows...");
    const { rows } = await sql`SELECT id, title, location, lat, lon, edited FROM sigint_events WHERE title ILIKE ${titlePattern}`;
    console.log(JSON.stringify(rows, null, 2));

  } catch (err) {
    console.error("Database healing failed:", err);
  } finally {
    process.exit(0);
  }
}

run();
