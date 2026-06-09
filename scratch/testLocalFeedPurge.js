async function test() {
  try {
    const res = await fetch('http://localhost:3001/api/events?timespan=24h');
    const data = await res.json();
    
    // Find events mentioning 'pope' or 'papa' or 'pape'
    const popeEvents = [...data.markers, ...data.events].filter(e => {
      const t = (e.title || e.name || e.subject || '').toLowerCase();
      return t.includes('pope') || t.includes('papa ') || t.includes('pape');
    });
    
    console.log("Found Pope Events:", popeEvents.length);
    if (popeEvents.length > 0) {
      const target = popeEvents[0];
      console.log("Targeting for Purge:", target.title, "(ID:", target.id, ")");
      
      // Purge it
      const delRes = await fetch('http://localhost:3001/api/admin/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: target.id, permanent: true, title: target.title || '', url: target.url || '' })
      });
      console.log("Purge status:", delRes.status);
      
      // Fetch again to verify
      const res2 = await fetch('http://localhost:3001/api/events?timespan=24h&force=true');
      const data2 = await res2.json();
      const stillExists = [...data2.markers, ...data2.events].some(e => e.id === target.id);
      console.log("Still in feed after purge?", stillExists);
    }
  } catch (e) {
    console.error(e);
  }
}
test();
