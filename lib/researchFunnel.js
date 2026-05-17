const { askAI } = require('./aiClient');
const fs = require('fs');
const path = require('path');

async function logToVault(events) {
  // Only log to local vault in development
  if (process.env.NODE_ENV === 'development') {
    const vaultPath = 'C:\\AI_Workspace\\Obsidian\\Avi';
    const briefFile = path.join(vaultPath, 'Live_AI_Intelligence_Brief.md');
    const trackerFile = path.join(vaultPath, '🚨_State_Accountability_Desk.md');
    const otherFile = path.join(vaultPath, '🚀Content_Sync_Dashboard.md');

    for (const event of events) {
      const timestamp = new Date().toLocaleString();
      const entry = `\n### [${event.severity}] ${event.title}\n- **Source**: [${event.source}](${event.url})\n- **Location**: ${event.location || 'Unknown'}\n- **Summary**: ${event.details?.summary || 'No summary available.'}\n- **Logged**: ${timestamp}\n---\n`;

      try {
        if (event.severity >= 4) {
          fs.appendFileSync(trackerFile, entry);
        } else if (event.category === 'Political' || event.category === 'Research') {
          fs.appendFileSync(briefFile, entry);
        } else {
          fs.appendFileSync(otherFile, entry);
        }
      } catch (err) {
        console.error('Failed to log to local vault:', err.message);
      }
    }
  } else {
    // In production, we'll use GitHub API or just rely on the Postgres DB
    console.log('Production mode: Local vault logging skipped. Data persists in Postgres.');
  }
}

async function fetchResearch() {
  const sources = [
    { name: 'arXiv AI', url: 'https://arxiv.org/rss/cs.AI', category: 'Research' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'Political' },
    { name: 'Reuters World', url: 'https://www.reuters.com/arc/outboundfeeds/rss/topics/world/', category: 'Political' },
    { name: 'GDACS Disasters', url: 'https://www.gdacs.org/xml/rss.xml', category: 'Disaster' },
    { name: 'ReliefWeb Humanitarian', url: 'https://reliefweb.int/updates/rss.xml', category: 'Humanitarian' },
    { name: 'FT Global Economy', url: 'https://www.ft.com/global-economy?format=rss', category: 'Economic' }
  ];

  let allItems = [];

  for (const source of sources) {
    try {
      const res = await fetch(source.url, { signal: AbortSignal.timeout(5000) });
      const xml = await res.text();
      
      // Simple regex-based RSS parsing
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      
      const parsed = [];
      for (const item of items.slice(0, 5)) {
        const title = item.match(/<title>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/title>/)?.[2] || 'Untitled';
        const link = item.match(/<link>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/link>/)?.[2] || '';
        const desc = item.match(/<description>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/description>/)?.[2] || '';
        const date = item.match(/<pubDate>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/pubDate>/)?.[2] || new Date().toISOString();
        
        // Intelligent enrichment using AI
        let summary = desc.trim().slice(0, 300) + '...';
        let lat = (Math.random() * 120) - 60;
        let lon = (Math.random() * 300) - 150;
        let locationName = 'Global / OSINT';
        let extraPoints = [];

        try {
          const aiResponse = await askAI(
            `Analyze this news item: "${title}. ${desc}"
             1. Summarize in one concise sentence.
             2. Identify the primary location mentioned (City/Country).
             3. Generate 1-2 extra OSINT 'intel points' related to this event (suspected entities or secondary locations).
             Return ONLY a JSON object with this structure:
             { 
               "summary": "...", 
               "location": {"name": "...", "lat": 0.0, "lon": 0.0},
               "extraPoints": [{"title": "...", "description": "...", "lat": 0.0, "lon": 0.0}]
             }`, 
            'You are a senior OSINT analyst. Provide precise geographical data.'
          );

          // Attempt to parse JSON from AI response
          const data = JSON.parse(aiResponse.match(/\{[\s\S]*\}/)?.[0] || '{}');
          if (data.summary) summary = data.summary;
          if (data.location?.name) locationName = data.location.name;
          if (data.location?.lat) {
            lat = data.location.lat;
            lon = data.location.lon;
          }
          if (data.extraPoints) extraPoints = data.extraPoints;
        } catch (e) {
          console.warn('AI enrichment failed, using fallback random location.');
        }

        const mainItem = {
          title: title.trim(),
          url: link.trim(),
          source: source.name,
          timestamp: date,
          category: source.category,
          severity: 3,
          lat, lon,
          location: locationName,
          details: { summary: summary.trim(), type: 'primary_source' }
        };

        parsed.push(mainItem);
        
        // Add extra generated intel points
        extraPoints.forEach(p => {
          parsed.push({
            ...p,
            source: `${source.name} (AI Intel)`,
            timestamp: date,
            category: 'OSINT',
            severity: 2,
            location: p.location || locationName,
            details: { summary: p.description, type: 'derived_intel' }
          });
        });
      }
      
      allItems = [...allItems, ...parsed];
    } catch (error) {
      console.error(`Error fetching research from ${source.name}:`, error);
    }
  }

  return allItems;
}

module.exports = { fetchResearch, logToVault };
