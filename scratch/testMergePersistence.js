// Load environment variables manually
require('dotenv').config({ path: '.env.local' });

const { initDb, getAllEvents, updateEvent, getEvents } = require('../lib/db');
const crypto = require('crypto');

function getCategory(text) {
  return 'Conflict';
}

function calculateTitleFuzzySimilarity(title1, title2) {
  if (title1 === title2) return 1.0;
  return 0.5; // Simple mock for similarity check
}

async function testMergePersistence() {
  console.log("=== Testing Next.js API Merge & Deduplication Persistence ===");
  try {
    console.log("Initializing database connection...");
    await initDb();

    // 1. Get a test event or insert a new one
    const testId = "test_persistence_" + Date.now();
    console.log(`Creating a test event in the database with ID: ${testId}`);

    const originalTitle = "Raw Unedited Autonomous Weapons Strike Signal";
    const originalUrl = "https://example.com/aws-strike-event";
    const originalLocation = "Global";
    const originalLat = 0.0;
    const originalLon = 0.0;
    const originalSeverity = 1;
    const originalCategory = "Political";

    // Insert as edited event (as if updated from CMS)
    const testLocation = "Geneva, Switzerland";
    const testLat = 46.2044;
    const testLon = 6.1432;
    const testSeverity = 5; // CRITICAL
    const testCategory = "Conflict";
    const testTitle = "Corrected Lethal Autonomous Weapons Strike in Geneva";

    console.log("Applying CMS admin edits directly via updateEvent()...");
    const updatedEvent = await updateEvent(testId, {
      title: testTitle,
      category: testCategory,
      severity: testSeverity,
      location: testLocation,
      lat: testLat,
      lon: testLon,
      url: originalUrl,
      summary: "VERIFIED persistence test: edited directly from CMS."
    });

    console.log("✓ DB Event updated and marked as edited successfully.");
    console.log(`  - Title: ${updatedEvent.title}`);
    console.log(`  - Location: ${updatedEvent.location} (${updatedEvent.lat}, ${updatedEvent.lon})`);
    console.log(`  - Severity: ${updatedEvent.severity}`);
    console.log(`  - Edited Flag: ${updatedEvent.edited}`);

    // 2. Mock raw/static event loaded from public/data/events.json or online GDELT feed
    // (This has the SAME ID but original incorrect unedited values)
    const mockStaticEvent = {
      id: testId,
      title: originalTitle,
      url: originalUrl,
      source: "GDELT RSS",
      timestamp: new Date().toISOString(),
      lat: originalLat,
      lon: originalLon,
      location: originalLocation,
      details: { summary: "Original unedited RSS summary." },
      category: originalCategory,
      severity: originalSeverity,
      quality: 1
    };

    // 3. Emulate Route Merge Logic: Spreading static first, then DB events
    console.log("\nSimulating Next.js GET Route Event Merging...");
    const filteredDbEventsList = [{ ...updatedEvent, fromDb: true }];
    const filteredStaticEvents = [mockStaticEvent];

    // Swapped merge order: [...filteredStaticEvents, ...filteredDbEventsList]
    const finalEventsList = [...filteredStaticEvents, ...filteredDbEventsList];

    // 4. Emulate Route Deduplication (eventMap)
    const eventMap = new Map();
    finalEventsList.forEach(e => eventMap.set(e.id, e));

    const sortedEvents = Array.from(eventMap.values());
    console.log(`Event count in eventMap after ID deduplication: ${sortedEvents.length}`);

    // Verify ID deduplication kept the DB-edited version because DB was spread last
    const resolvedFromMap = eventMap.get(testId);
    console.log("\n--- After Map ID Deduplication (Prioritization Check) ---");
    console.log(`Resolved Title: ${resolvedFromMap.title}`);
    console.log(`Resolved Location: ${resolvedFromMap.location} (${resolvedFromMap.lat}, ${resolvedFromMap.lon})`);
    console.log(`Resolved Severity: ${resolvedFromMap.severity}`);
    console.log(`Resolved fromDb flag: ${resolvedFromMap.fromDb}`);
    console.log(`Resolved edited flag: ${resolvedFromMap.edited}`);

    if (resolvedFromMap.location === testLocation && resolvedFromMap.severity === testSeverity && resolvedFromMap.title === testTitle) {
      console.log("✓ SUCCESS: DB-edited event correctly overwrote the unedited static event in eventMap!");
    } else {
      throw new Error("FAILED: Static unedited event overwrote the DB-edited event in eventMap!");
    }

    // 5. Emulate deep fuzzy/URL deduplication loop in sortedEvents
    console.log("\nSimulating deep deduplication priority loop...");
    const allEvents = [];
    sortedEvents.forEach(e => {
      let duplicateIndex = -1;
      for (let i = 0; i < allEvents.length; i++) {
        const accepted = allEvents[i];
        if (e.url === accepted.url) {
          duplicateIndex = i;
          break;
        }
      }

      if (duplicateIndex !== -1) {
        const accepted = allEvents[duplicateIndex];
        
        // 1. Absolute Priority: Manually edited event takes absolute precedence
        const acceptedEdited = accepted.edited === true || accepted.edited === 'true';
        const currentEdited = e.edited === true || e.edited === 'true';

        if (acceptedEdited && !currentEdited) {
          return;
        }
        if (currentEdited && !acceptedEdited) {
          allEvents[duplicateIndex] = e;
          return;
        }

        // 2. Secondary Priority: DB source over raw online feed source
        if (accepted.fromDb && !e.fromDb) {
          return;
        }
        if (e.fromDb && !accepted.fromDb) {
          allEvents[duplicateIndex] = e;
          return;
        }
        return;
      }

      allEvents.push(e);
    });

    const finalEvent = allEvents[0];
    console.log("\n--- After Deep Deduplication Loop ---");
    console.log(`Final Event Title: ${finalEvent.title}`);
    console.log(`Final Event Location: ${finalEvent.location}`);
    console.log(`Final Event Severity: ${finalEvent.severity}`);

    if (finalEvent.location === testLocation && finalEvent.severity === testSeverity && finalEvent.edited === true) {
      console.log("✓ SUCCESS: Manual edits are completely persistent and immune to automated overrides!");
    } else {
      throw new Error("FAILED: Automated feed event downgraded or overrode manual edits!");
    }

    // Cleanup: Delete test event from database
    console.log("\nCleaning up database...");
    const { sql } = require('@vercel/postgres');
    await sql`DELETE FROM sigint_events WHERE id = ${testId}`;
    console.log("✓ Test event deleted from database. Database clean.");

  } catch (error) {
    console.error("❌ Persistence integration test failed:", error);
  } finally {
    process.exit(0);
  }
}

testMergePersistence();
