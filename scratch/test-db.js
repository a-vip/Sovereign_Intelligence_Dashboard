import { getArchivedIds, getArchivedInfo } from '../lib/db.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env.local') });

async function test() {
  console.log("POSTGRES_URL:", process.env.POSTGRES_URL ? "SET" : "NOT SET");
  try {
    const archivedIds = await getArchivedIds();
    console.log("Total archived/purged IDs in memory:", archivedIds.size);
    const info = await getArchivedInfo();
    console.log("Total archived/purged URLs:", info.urls.size);
    console.log("Total archived/purged Titles:", info.titles.size);
    console.log("Raw Titles sample (up to 10):", info.rawTitles.slice(0, 10));
  } catch (e) {
    console.error("Database connection or query failed:", e);
  }
}

test().then(() => process.exit(0));
