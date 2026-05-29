// Load environment variables manually
require('dotenv').config({ path: '.env.local' });

const { initDb, updateEvent, updateRssItem } = require('../lib/db');

async function testAutoGeocodeDb() {
  console.log("=== Testing Automatic Backend Geocoding in Database Updates ===");
  try {
    console.log("Initializing database connection...");
    await initDb();
    
    // Test Case 1: Event auto-geocoding on update
    console.log("\n--- Test Case 1: Live Event Auto-Geocoding ---");
    const testEventId = "test-geocode-event-123";
    
    console.log("Updating event location to 'Gaza Strip' without providing lat/lon...");
    const updatedEvent = await updateEvent(testEventId, {
      title: "Tactical AI Ingest Test",
      location: "Gaza Strip",
      category: "Conflict",
      severity: 5,
      summary: "Manual location geocoding test event"
    });
    
    console.log("Resulting coordinates for 'Gaza Strip' event:");
    console.log(`- ID: ${updatedEvent.id}`);
    console.log(`- Location: ${updatedEvent.location}`);
    console.log(`- Lat: ${updatedEvent.lat}`);
    console.log(`- Lon: ${updatedEvent.lon}`);
    
    // Gaza Strip should geocode to lat: 31.3547, lon: 34.3088 (or 31.35, 34.30 depending on fallback match)
    if (updatedEvent.lat && updatedEvent.lon && !isNaN(updatedEvent.lat) && !isNaN(updatedEvent.lon)) {
      console.log("✓ SUCCESS: Event was automatically geocoded and coordinates successfully assigned!");
    } else {
      throw new Error("Failed to assign coordinates automatically to event.");
    }
    
    // Test Case 2: RSS auto-geocoding on update
    console.log("\n--- Test Case 2: RSS Feed Auto-Geocoding ---");
    const testRssId = "test-geocode-rss-123";
    
    console.log("Updating RSS item location to 'Sudan' without providing latitude/longitude...");
    const updatedRss = await updateRssItem(testRssId, {
      title: "Sudan Drone Telemetry",
      location: "Sudan",
      category: "Conflict",
      severity: 4,
      summary: "Automatic RSS location geocoding test item",
      url: "https://example.com/sudan-signal-test",
      source: "Manual Geocode Test",
      sid: "test"
    });
    
    console.log("Resulting coordinates for 'Sudan' RSS item:");
    console.log(`- ID: ${updatedRss.id}`);
    console.log(`- Location: ${updatedRss.location}`);
    console.log(`- Latitude: ${updatedRss.latitude}`);
    console.log(`- Longitude: ${updatedRss.longitude}`);
    
    // Sudan should geocode to lat: 15.5007, lon: 32.5599 (or 12.8628, 30.2176 depending on fallback match)
    if (updatedRss.latitude && updatedRss.longitude && !isNaN(updatedRss.latitude) && !isNaN(updatedRss.longitude)) {
      console.log("✓ SUCCESS: RSS item was automatically geocoded and coordinates successfully assigned!");
    } else {
      throw new Error("Failed to assign coordinates automatically to RSS item.");
    }
    
  } catch (error) {
    console.error("❌ Geocoding database integration test failed:", error);
  } finally {
    process.exit(0);
  }
}

testAutoGeocodeDb();
