console.log("Starting testIngestHealing.js...");
require('dotenv').config({ path: '.env.local' });
console.log("Loaded dotenv.");
const { initDb, saveEvents, saveRssItems } = require('../lib/db');
console.log("Imported db.");
const { sql } = require('@vercel/postgres');
console.log("Imported @vercel/postgres.");

async function run() {
  try {
    console.log("Calling initDb()...");
    await initDb();
    console.log("initDb() completed.");
    
    console.log("=== Running Ingest Self-Healing Verification ===");

    // 1. Test RSS Self-Healing
    console.log("\n--- Testing RSS Ingest Self-Healing ---");
    const testRssItem = {
      id: "test-rss-sudan-duplicate-" + Date.now(),
      title: "Sudan: Colombians Linked to Atrocities Trained in UAE Bases",
      url: "https://www.hrw.org/news/2026/05/27/sudan-colombians-linked-to-atrocities-trained-in-uae-bases", // fresh date directory
      source: "hrw.org",
      sid: "hrw",
      location: "Geneva Office", // unhealed fallback location
      latitude: 46.2044,
      longitude: 6.1432,
      category: "Humanitarian",
      severity: 3,
      published_at: new Date().toISOString()
    };

    console.log("Saving test duplicate RSS item...");
    await saveRssItems([testRssItem]);

    console.log("Querying saved RSS item from DB...");
    const { rows: rssRows } = await sql`
      SELECT id, title, location, latitude, longitude, url, edited 
      FROM rss_items 
      WHERE id = ${testRssItem.id}
    `;
    console.log("Result:", JSON.stringify(rssRows[0], null, 2));

    if (rssRows[0] && rssRows[0].location === 'Sudan' && rssRows[0].edited === true) {
      console.log("✅ RSS Ingest Self-Healing PASSED!");
    } else {
      console.log("❌ RSS Ingest Self-Healing FAILED!");
    }

    // 2. Test SIGINT Events Self-Healing
    console.log("\n--- Testing SIGINT Ingest Self-Healing ---");
    const testSigintEvent = {
      id: "test-sigint-chad-duplicate-" + Date.now(),
      title: "Chad: 10 Years On, Habré Conviction Inspires Global Justice",
      url: "https://www.hrw.org/news/2026/05/26/chad-10-years-on-habre-conviction-inspires-global-justice", // fresh date
      source: "hrw.org",
      timestamp: new Date().toISOString(),
      category: "Humanitarian",
      severity: 3,
      location: "Damascus, Syria", // unhealed fallback
      lat: 34.802075,
      lon: 38.996815,
      details: { summary: "Chad 10 Years On..." }
    };

    console.log("Saving test duplicate SIGINT event...");
    await saveEvents([testSigintEvent]);

    console.log("Querying saved SIGINT event from DB...");
    const { rows: sigintRows } = await sql`
      SELECT id, title, location, lat, lon, url, edited 
      FROM sigint_events 
      WHERE id = ${testSigintEvent.id}
    `;
    console.log("Result:", JSON.stringify(sigintRows[0], null, 2));

    if (sigintRows[0] && sigintRows[0].location === 'Chad' && sigintRows[0].edited === true) {
      console.log("✅ SIGINT Ingest Self-Healing PASSED!");
    } else {
      console.log("❌ SIGINT Ingest Self-Healing FAILED!");
    }

    // Cleanup test rows
    console.log("\nCleaning up test rows...");
    await sql`DELETE FROM rss_items WHERE id = ${testRssItem.id}`;
    await sql`DELETE FROM sigint_events WHERE id = ${testSigintEvent.id}`;
    console.log("Cleanup done.");

  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    process.exit(0);
  }
}

run();
