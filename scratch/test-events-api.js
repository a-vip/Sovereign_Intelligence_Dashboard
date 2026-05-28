// Using native global fetch

async function testEventsApi() {
  console.log("=== Querying Live events API ===");
  try {
    const res = await fetch('http://localhost:3000/api/events?timespan=today');
    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }
    const data = await res.json();
    
    console.log(`Total events returned: ${data.events?.length}`);
    console.log(`Total markers returned: ${data.markers?.length}`);
    
    const geoconfirmedEvents = data.events.filter(e => {
      return (e.source || e.details?.source || '').toLowerCase().includes('geoconfirmed') || 
             (e.title || '').toLowerCase().includes('geoconfirmed');
    });
    
    console.log(`\nGeoConfirmed events count: ${geoconfirmedEvents.length}`);
    
    const now = new Date();
    const cutoff24h = new Date(now - 24 * 60 * 60 * 1000);
    
    let violatedCount = 0;
    
    geoconfirmedEvents.forEach(e => {
      const eventDate = new Date(e.timestamp);
      const isOlder = eventDate < cutoff24h;
      if (isOlder) {
        violatedCount++;
        console.log(`⚠️ VIOLATION: Event "${e.title}" is older than 24h! Timestamp: ${e.timestamp}`);
      }
    });
    
    if (violatedCount === 0) {
      console.log("✅ SUCCESS: 100% of GeoConfirmed events are within the last 24 hours!");
    } else {
      console.log(`❌ FAILURE: Found ${violatedCount} GeoConfirmed events older than 24 hours.`);
    }
    
    if (geoconfirmedEvents.length > 0) {
      console.log("\nSample GeoConfirmed Event:");
      console.log(`- Title: ${geoconfirmedEvents[0].title}`);
      console.log(`  Timestamp: ${geoconfirmedEvents[0].timestamp}`);
      console.log(`  Location: ${geoconfirmedEvents[0].location}`);
    }
    
  } catch (err) {
    console.error("API test failed:", err.message);
  }
}

testEventsApi();
