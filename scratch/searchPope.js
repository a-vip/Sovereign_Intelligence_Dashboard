import { initDb } from '../lib/db.js';
import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env.local') });

async function run() {
  await initDb();
  console.log("=== Searching sigint_events ===");
  try {
    const res = await sql`SELECT id, title, url FROM sigint_events WHERE title ILIKE '%pope%' OR url ILIKE '%pope%'`;
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  }

  console.log("=== Searching rss_items ===");
  try {
    const res = await sql`SELECT id, title, url FROM rss_items WHERE title ILIKE '%pope%' OR url ILIKE '%pope%'`;
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  }

  console.log("=== Searching archived_events ===");
  try {
    const res = await sql`SELECT id, title, url FROM archived_events WHERE title ILIKE '%pope%' OR url ILIKE '%pope%'`;
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  }

  console.log("=== Searching purged_events ===");
  try {
    const res = await sql`SELECT id, title, url FROM purged_events WHERE title ILIKE '%pope%' OR url ILIKE '%pope%'`;
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  }
}

run().then(() => process.exit(0));
