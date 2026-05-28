require('dotenv').config({ path: '.env.local' });
const { initDb, updateEvent, updateRssItem, archiveEvent, getEvents, getRssItems } = require('../lib/db');
const { sql } = require('@vercel/postgres');

async function run() {
  try {
    await initDb();
    console.log("=== Testing Cascading Updates and Deletions ===");

    const mockStaticId = 'test-static-event-123';
    const mockRssId1 = 'test-rss-item-123-a';
    const mockRssId2 = 'test-rss-item-123-b';
    const testTitle = 'Test Event: Private Security Deployment in Eastern Region';
    const testUrl = 'https://www.example.com/test-news-article';

    console.log("\n1. Cleaning up any old mock data...");
    await sql`DELETE FROM sigint_events WHERE id = ${mockStaticId}`;
    await sql`DELETE FROM rss_items WHERE id IN (${mockRssId1}, ${mockRssId2})`;
    await sql`DELETE FROM archived_events WHERE id IN (${mockStaticId}, ${mockRssId1}, ${mockRssId2})`;

    console.log("\n2. Inserting mock static event and parallel RSS items...");
    // Insert initial static event in Geneva
    await sql`
      INSERT INTO sigint_events (id, title, category, severity, location, lat, lon, timestamp, url, details, edited)
      VALUES (${mockStaticId}, ${testTitle}, 'Conflict', 3, 'Geneva Office', 46.2044, 6.1432, NOW(), ${testUrl}, '{"summary": "Original details"}', FALSE)
    `;

    // Insert two mock RSS items with the same title at different locations (e.g. Beirut, Lebanon)
    await sql`
      INSERT INTO rss_items (id, title, url, source, sid, location, latitude, longitude, category, severity, summary, published_at, edited)
      VALUES 
        (${mockRssId1}, ${testTitle}, ${testUrl + '/a'}, 'HRW', 'hrw', 'Beirut, Lebanon', 33.8938, 35.5018, 'Conflict', 3, 'Scraped RSS item 1', NOW(), FALSE),
        (${mockRssId2}, ${testTitle}, ${testUrl + '/b'}, 'AJE', 'aje', 'Beirut, Lebanon', 33.8938, 35.5018, 'Conflict', 3, 'Scraped RSS item 2', NOW(), FALSE)
    `;

    console.log("Mock data inserted successfully!");

    console.log("\n3. Simulating an Admin Override: Updating the Static Event's location to Sudan...");
    const updatedEv = await updateEvent(mockStaticId, {
      title: testTitle,
      category: 'Conflict',
      severity: 4,
      location: 'Sudan',
      lat: 12.8628,
      lon: 30.2176,
      url: testUrl,
      summary: 'Admin manually redirected coordinates to active Sudan coordinates.'
    });

    console.log("Static event updated:", JSON.stringify(updatedEv, null, 2));

    console.log("\n4. Verifying if the matching RSS items were automatically updated in the database...");
    const { rows: updatedRssRows } = await sql`
      SELECT id, title, location, latitude, longitude, edited 
      FROM rss_items 
      WHERE id IN (${mockRssId1}, ${mockRssId2})
    `;

    console.log("Updated RSS items in database:", JSON.stringify(updatedRssRows, null, 2));

    let allUpdated = true;
    for (const r of updatedRssRows) {
      if (r.location !== 'Sudan' || Math.abs(r.latitude - 12.8628) > 0.0001 || !r.edited) {
        allUpdated = false;
      }
    }

    if (allUpdated) {
      console.log("✅ SUCCESS: Cascading update correctly propagated Sudanese coordinates to all duplicate RSS items!");
    } else {
      console.log("❌ FAILURE: Cascading update did not propagate correctly!");
    }

    console.log("\n5. Simulating an Admin Override: Archiving (removing) the threat marker...");
    const archiveRes = await archiveEvent(mockStaticId, 'test-admin@sovereign.app');
    console.log("Archive result:", JSON.stringify(archiveRes, null, 2));

    console.log("\n6. Verifying if all duplicate entries were removed from both tables...");
    const { rows: finalEvents } = await sql`SELECT id FROM sigint_events WHERE id = ${mockStaticId}`;
    const { rows: finalRss } = await sql`SELECT id FROM rss_items WHERE id IN (${mockRssId1}, ${mockRssId2})`;

    console.log(`Remaining sigint_events: ${finalEvents.length}`);
    console.log(`Remaining rss_items: ${finalRss.length}`);

    if (finalEvents.length === 0 && finalRss.length === 0) {
      console.log("✅ SUCCESS: Cascading archive completely wiped out all duplicates across both streams!");
    } else {
      console.log("❌ FAILURE: Lingering duplicates found in database!");
    }

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    process.exit(0);
  }
}

run();
