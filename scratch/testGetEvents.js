const http = require('http');

http.get('http://localhost:3000/api/events?timespan=today', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log("Response status:", json.status);
      console.log("Number of events:", json.events?.length);
      console.log("Number of markers:", json.markers?.length);
      
      const sudanEvent = json.events?.find(e => e.title.includes('Colombian') || e.id === '25d8869c9b582cb55bc7cbfa15259972');
      console.log("\n--- Sudan Event in /api/events response ---");
      console.log(sudanEvent);

      const sudanMarker = json.markers?.find(m => m.name?.includes('Colombian') || m.id === 'db-25d8869c9b582cb55bc7cbfa15259972');
      console.log("\n--- Sudan Marker in /api/events response ---");
      console.log(sudanMarker);
    } catch (e) {
      console.error("Failed to parse response:", e);
      console.log("Raw response snippet:", data.substring(0, 500));
    }
  });
}).on('error', (err) => {
  console.error("HTTP GET Error:", err);
});
