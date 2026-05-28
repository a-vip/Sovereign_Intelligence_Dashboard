// Load environment variables manually
require('dotenv').config({ path: '.env.local' });

const { initDb, getAllEvents, updateEvent } = require('./lib/db');

async function testDirectDb() {
  console.log("=== Direct DB Live Edit Integration Test ===");
  try {
    console.log("Initializing database connection...");
    await initDb();
    
    console.log("Fetching events directly from database...");
    const result = await getAllEvents(1, 10, '');
    const events = result.events || [];
    console.log(`Successfully fetched ${events.length} events directly.`);

    if (events.length === 0) {
      console.log("No events found in the database. Exiting test.");
      return;
    }

    const targetEvent = events[0];
    console.log("\nTarget event for live editing:");
    console.log(`- ID: ${targetEvent.id}`);
    console.log(`- Title: ${targetEvent.title}`);
    console.log(`- Original Category: ${targetEvent.category}`);
    console.log(`- Original Severity: ${targetEvent.severity}`);
    console.log(`- Original Summary: ${targetEvent.details?.summary || targetEvent.summary}`);

    // Perform direct database update
    console.log("\nUpdating event in database...");
    const originalCategory = targetEvent.category;
    const originalSeverity = targetEvent.severity;
    const originalSummary = targetEvent.details?.summary || targetEvent.summary || '';

    const testCategory = originalCategory === "Conflict" ? "Surveillance" : "Conflict";
    const testSeverity = originalSeverity === 5 ? 4 : 5;
    const testSummary = "VERIFIED DIRECT DB TEST: Admin successfully edited this summary.";

    const updated = await updateEvent(targetEvent.id, {
      category: testCategory,
      severity: testSeverity,
      summary: testSummary
    });

    console.log("\nUpdated Event Details from DB return:");
    console.log(`- ID: ${updated.id}`);
    console.log(`- Category: ${updated.category}`);
    console.log(`- Severity: ${updated.severity}`);
    console.log(`- Summary: ${updated.details?.summary || updated.summary}`);

    // Verify
    if (updated.category === testCategory && updated.severity === testSeverity && (updated.details?.summary === testSummary || updated.summary === testSummary)) {
      console.log("\n✓ SUCCESS: Live edit successfully persisted in database!");
    } else {
      throw new Error("Persisted fields do not match requested changes.");
    }

    // Restore original event state to clean up database
    console.log("\nRestoring original event state in database...");
    const restored = await updateEvent(targetEvent.id, {
      category: originalCategory,
      severity: originalSeverity,
      summary: originalSummary
    });
    console.log("✓ Original event details successfully restored in database.");

  } catch (error) {
    console.error("❌ Direct DB integration test failed:", error);
  } finally {
    process.exit(0);
  }
}

testDirectDb();
