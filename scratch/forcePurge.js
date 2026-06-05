require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function enforcePurge() {
  try {
    const id = 'fdcc290378d4f0e04ae0078514da8fe1';
    
    console.log("Forcing purge on ID:", id);
    
    // Delete from all active tables
    await sql`DELETE FROM sigint_events WHERE id = ${id}`;
    await sql`DELETE FROM rss_items WHERE id = ${id}`;
    await sql`DELETE FROM ai_regulations WHERE id = ${id}`;
    await sql`DELETE FROM archived_events WHERE id = ${id}`;
    
    // Insert into purged list
    await sql`
      INSERT INTO purged_events (id, title, url)
      VALUES (${id}, 'We Updated Our Privacy Policy. Here''s What Changed and Why.', '')
      ON CONFLICT (id) DO NOTHING
    `;
    
    console.log("Purge complete!");
  } catch (e) {
    console.error("Purge script failed:", e);
  }
}

enforcePurge();
