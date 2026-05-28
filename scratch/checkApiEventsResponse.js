require('dotenv').config({ path: '.env.local' });
const { GET } = require('../app/api/events/route');
const { initDb } = require('../lib/db');

async function run() {
  try {
    await initDb();
    console.log("Calling GET /api/events...");
    const req = {
      url: 'http://localhost:3000/api/events?timespan=today'
    };
    const res = await GET(req);
    const data = await res.json();
    
    console.log("=== Matching Events in API Response ===");
    const matchedEvents = data.events?.filter(e => e.title?.toLowerCase().includes('habre') || e.title?.toLowerCase().includes('chad'));
    console.log(JSON.stringify(matchedEvents, null, 2));

    console.log("\n=== Matching Markers in API Response ===");
    const matchedMarkers = data.markers?.filter(m => m.name?.toLowerCase().includes('habre') || m.name?.toLowerCase().includes('chad') || m.title?.toLowerCase().includes('habre') || m.title?.toLowerCase().includes('chad'));
    console.log(JSON.stringify(matchedMarkers, null, 2));

  } catch (err) {
    console.error("Error in check script:", err);
  } finally {
    process.exit(0);
  }
}

run();
