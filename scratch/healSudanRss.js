require('dotenv').config({ path: '.env.local' });
const { initDb } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  try {
    await initDb();
    console.log("=== Healing Existing Database Records ===");

    // 1. Heal Sudan RSS items in rss_items table
    console.log("Healing Sudan RSS items...");
    const resSudanRss = await sql`
      UPDATE rss_items 
      SET location = 'Sudan', 
          latitude = 12.8628, 
          longitude = 30.2176, 
          edited = TRUE 
      WHERE title ILIKE '%Sudan%' AND title ILIKE '%Colombian%'
    `;
    console.log(`Successfully healed ${resSudanRss.rowCount} Sudan RSS items!`);

    // 2. Heal Sudan SIGINT events in sigint_events table
    console.log("Healing Sudan SIGINT events...");
    const resSudanSigint = await sql`
      UPDATE sigint_events 
      SET location = 'Sudan', 
          lat = 12.8628, 
          lon = 30.2176, 
          edited = TRUE 
      WHERE title ILIKE '%Sudan%' AND title ILIKE '%Colombian%'
    `;
    console.log(`Successfully healed ${resSudanSigint.rowCount} Sudan SIGINT events!`);

    // 3. Heal Chad RSS items in rss_items table
    console.log("Healing Chad RSS items...");
    const resChadRss = await sql`
      UPDATE rss_items 
      SET location = 'Chad', 
          latitude = 15.6134137, 
          longitude = 19.0156172, 
          edited = TRUE 
      WHERE title ILIKE '%Habré%' OR url ILIKE '%chad-10-years-on%'
    `;
    console.log(`Successfully healed ${resChadRss.rowCount} Chad RSS items!`);

    // 4. Verification Check
    console.log("\n=== Final State Check ===");
    const { rows: sudanEvents } = await sql`
      SELECT id, title, location, lat, lon, edited FROM sigint_events WHERE title ILIKE '%Sudan%' AND title ILIKE '%Colombian%'
    `;
    console.log("Sudan SIGINT events:", JSON.stringify(sudanEvents, null, 2));

    const { rows: sudanRss } = await sql`
      SELECT id, title, location, latitude, longitude, edited FROM rss_items WHERE title ILIKE '%Sudan%' AND title ILIKE '%Colombian%'
    `;
    console.log("Sudan RSS items:", JSON.stringify(sudanRss, null, 2));

    const { rows: chadEvents } = await sql`
      SELECT id, title, location, lat, lon, edited FROM sigint_events WHERE title ILIKE '%Habré%'
    `;
    console.log("Chad SIGINT events:", JSON.stringify(chadEvents, null, 2));

    const { rows: chadRss } = await sql`
      SELECT id, title, location, latitude, longitude, edited FROM rss_items WHERE title ILIKE '%Habré%' OR url ILIKE '%chad-10-years-on%'
    `;
    console.log("Chad RSS items:", JSON.stringify(chadRss, null, 2));

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

run();
