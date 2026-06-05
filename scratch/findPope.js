require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function findPopeEvents() {
  try {
    const { rows: events } = await sql`SELECT id, title FROM sigint_events WHERE title ILIKE '%pope%'`;
    const { rows: rss } = await sql`SELECT id, title FROM rss_items WHERE title ILIKE '%pope%'`;
    
    console.log("EVENTS:");
    events.forEach(e => console.log(e.id, " | ", e.title));
    
    console.log("RSS:");
    rss.forEach(e => console.log(e.id, " | ", e.title));
  } catch (e) {
    console.error(e);
  }
}
findPopeEvents();
