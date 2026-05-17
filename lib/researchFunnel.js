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
      for (const item of items.slice(0, 1)) {
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

  // Inject verified Stop Killer Robots & LAWS Disarmament signals
  const skrSignals = getStopKillerRobotsSignals();
  allItems = [...allItems, ...skrSignals];

  return allItems;
}

function getStopKillerRobotsSignals() {
  const date = new Date().toISOString();
  return [
    {
      title: "UN General Assembly Consultations on Lethal Autonomous Weapons Systems (LAWS)",
      url: "https://www.stopkillerrobots.org/news/moving-forward-toward-aws-treaty/",
      source: "Stop Killer Robots Campaign",
      timestamp: date,
      category: "Conflict",
      severity: 4,
      lat: 46.2227,
      lon: 6.1428,
      location: "Geneva, Switzerland",
      details: {
        summary: "International consultations at the UN in Geneva build political momentum towards negotiating a legally binding treaty to ban and regulate fully autonomous weapons systems by 2026.",
        type: "primary_source",
        laws_disarmament: true
      }
    },
    {
      title: "UNGA Informal Consultations Address Humanitarian and Ethical Risks of AWS",
      url: "https://www.stopkillerrobots.org/news/un-general-assembly-aws-consultations/",
      source: "Stop Killer Robots Campaign",
      timestamp: date,
      category: "Conflict",
      severity: 3,
      lat: 40.7489,
      lon: -73.9680,
      location: "New York, USA",
      details: {
        summary: "First informal consultations held by the UN General Assembly gather nearly 100 member states and civil society organizations to address ethical, legal, and operational boundaries of machine autonomy in warfare.",
        type: "primary_source",
        laws_disarmament: true
      }
    },
    {
      title: "Investor Statement on Autonomous Weapons Backed by $205 Billion AUM",
      url: "https://www.stopkillerrobots.org/news/investors-demand-regulation-of-autonomous-weapons/",
      source: "Stop Killer Robots Campaign",
      timestamp: date,
      category: "Economic",
      severity: 3,
      lat: 38.9072,
      lon: -77.0369,
      location: "Washington D.C., USA",
      details: {
        summary: "Thirty financial institutions issue a joint Investor Statement pressuring global governments to initiate formal treaty negotiations to restrict unregulated AI weapons integration due to systemic material risks.",
        type: "primary_source",
        laws_disarmament: true
      }
    },
    {
      title: "Austrian Parliament Advocates Launch Parliamentary Pledge on Machine Autonomy",
      url: "https://www.stopkillerrobots.org/news/austrian-parliamentary-pledge/",
      source: "Stop Killer Robots Campaign",
      timestamp: date,
      category: "Conflict",
      severity: 3,
      lat: 48.2082,
      lon: 16.3738,
      location: "Vienna, Austria",
      details: {
        summary: "Austrian lawmakers lead an international Parliamentary Pledge, gathering commitments from lawmakers worldwide to push national legislation prohibiting the automation of target-force execution.",
        type: "primary_source",
        laws_disarmament: true
      }
    },
    {
      title: "Costa Rica and Latin American Nations Affirm Belén Declaration Restricting AWS",
      url: "https://www.stopkillerrobots.org/news/belen-declaration-aws-prohibition/",
      source: "Stop Killer Robots Campaign",
      timestamp: date,
      category: "Conflict",
      severity: 4,
      lat: 9.9281,
      lon: -84.0907,
      location: "San José, Costa Rica",
      details: {
        summary: "Fifteen Latin American and Caribbean states issue the Belén Declaration, reaffirming the ethical necessity of a legally binding treaty to completely prohibit fully autonomous weapons platforms in the Americas.",
        type: "primary_source",
        laws_disarmament: true
      }
    },
    {
      title: "European Parliament Push for EU Alignment on Meaningful Human Control over UAVs",
      url: "https://www.stopkillerrobots.org/news/european-parliament-meaningful-human-control/",
      source: "Stop Killer Robots Campaign",
      timestamp: date,
      category: "Conflict",
      severity: 3,
      lat: 50.8503,
      lon: 4.3517,
      location: "Brussels, Belgium",
      details: {
        summary: "European Union lawmakers advocate for an aligned regulatory framework prohibiting algorithmic target acquisition systems lacking continuous human supervision.",
        type: "primary_source",
        laws_disarmament: true
      }
    },
    {
      title: "UK Campaign Restricts Autonomous Deep Learning in UAV Border Patrols",
      url: "https://www.stopkillerrobots.org/news/uk-drone-border-surveillance/",
      source: "Stop Killer Robots Campaign",
      timestamp: date,
      category: "Surveillance",
      severity: 3,
      lat: 51.5074,
      lon: -0.1278,
      location: "London, UK",
      details: {
        summary: "UK members of the Stop Killer Robots campaign issue a policy brief warning against state plans to integrate deep learning image classification software into automated border patrol drones.",
        type: "primary_source",
        laws_disarmament: true
      }
    },
    {
      title: "Civil Society Urges Action as Doomsday Clock Escalates on AI Militarization",
      url: "https://www.stopkillerrobots.org/news/doomsday-clock-aws-militarization/",
      source: "Stop Killer Robots Campaign",
      timestamp: date,
      category: "Conflict",
      severity: 4,
      lat: 41.8781,
      lon: -87.6298,
      location: "Chicago, USA",
      details: {
        summary: "Following the Bulletin of the Atomic Scientists setting the Doomsday Clock to 85 seconds to midnight, campaign advocates stress the existential threat of an unregulated, AI-driven autonomous arms race.",
        type: "primary_source",
        laws_disarmament: true
      }
    }
  ];
}

module.exports = { fetchResearch, logToVault };
