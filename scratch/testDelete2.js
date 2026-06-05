require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function test() {
  try {
    const id = 'fdcc290378d4f0e04ae0078514da8fe1';
    
    // Check if it exists
    const events = await sql`SELECT id FROM sigint_events WHERE id = ${id}`;
    console.log("Found in events:", events.rows.length);
    
    const archived = await sql`SELECT id FROM archived_events WHERE id = ${id}`;
    console.log("Found in archived:", archived.rows.length);
    
    const purged = await sql`SELECT id FROM purged_events WHERE id = ${id}`;
    console.log("Found in purged:", purged.rows.length);
  } catch (e) {
    console.error('Test failed:', e);
  }
}
test();
