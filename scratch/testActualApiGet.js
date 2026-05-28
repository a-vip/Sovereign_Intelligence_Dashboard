require('dotenv').config({ path: '.env.local' });
const { GET } = require('../app/api/events/route');

async function test() {
  console.log("=== CALLING ACTUAL GET /api/events?timespan=today ===");
  const req = new Request('http://localhost:3000/api/events?timespan=today', {
    method: 'GET'
  });
  
  try {
    const res = await GET(req);
    const data = await res.json();
    console.log("Response status:", data.status);
    console.log("Response events count:", data.events?.length);
    
    const colombians = data.events?.filter(e => e.title.includes('Colombian'));
    console.log("\n--- Colombian Events in API Response ---");
    console.log(JSON.stringify(colombians, null, 2));

    const markers = data.markers?.filter(m => m.name?.includes('Colombian'));
    console.log("\n--- Colombian Markers in API Response ---");
    console.log(JSON.stringify(markers, null, 2));
  } catch (err) {
    console.error("Error running GET handler:", err);
  }
  process.exit(0);
}

test();
