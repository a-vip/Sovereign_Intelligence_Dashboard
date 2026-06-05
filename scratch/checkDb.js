require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function check() {
  try {
    const { rows: events } = await sql`SELECT id, title, status FROM sigint_events LIMIT 5`;
    console.log("EVENTS:", events);
    
    const { rows: archived } = await sql`SELECT id, title FROM archived_events LIMIT 5`;
    console.log("ARCHIVED:", archived);
    
    const { rows: purged } = await sql`SELECT id, title FROM purged_events LIMIT 5`;
    console.log("PURGED:", purged);
  } catch (e) {
    console.error(e);
  }
}
check();
