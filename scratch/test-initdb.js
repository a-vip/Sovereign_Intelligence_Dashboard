import { initDb } from '../lib/db.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env.local') });

async function test() {
  console.log("Running initDb()...");
  await initDb();
  console.log("Done running initDb(). Check console above for any errors.");
}

test().then(() => process.exit(0));
