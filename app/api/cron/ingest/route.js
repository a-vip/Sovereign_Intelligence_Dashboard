import { NextResponse } from 'next/server';
import { initDb, saveEvents, saveRssItems, saveAiRegulations } from '@/lib/db';
import crypto from 'crypto';
import { fetchResearch, logToVault } from '@/lib/researchFunnel';
import { scrapeAllRss } from '@/lib/rssParser';
import { verifyLink, findAlternativeLink } from '@/lib/verification';
import { geocodeText, decodeHtmlEntities } from '@/lib/geocoder';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

function generateId(url, title) {
  return crypto.createHash('md5').update(url || title).digest('hex');
}

function categorize(text) {
  const keywords = {
    Conflict: /strike|attack|bomb|missile|drone|kill|military|weapon|war|combat|troops|airstrike|explosion|clash|warfare|assault|targeting/i,
    Humanitarian: /humanitarian|refugee|aid|famine|hunger|displacement|crisis|civilian|casualties|victims|rescue|relief/i,
    Disaster: /disaster|earthquake|flood|tsunami|hurricane|wildfire|storm|cyclone|accident|tremor|quake|eruption|seismic/i,
    Economic: /economic|trade|sanction|tariff|oil|energy|market|finance|invest|contract|billion|funding|gdp|inflation|rates|commerce/i,
    Surveillance: /surveillance|palantir|ice|nest|dhs|facial recognition|biometric|tracking|border control|police tech|cia|fbi|nsa|monitoring|spying|espionage/i,
  };
  for (const [cat, re] of Object.entries(keywords)) {
    if (re.test(text)) return cat;
  }
  return 'Political';
}

function scoreSeverity(title) {
  const t = title.toLowerCase();
  if (/mass|genocide|massacre|nuclear|chemical|emergency|catastroph/.test(t)) return 5;
  if (/kill|dead|casualties|strike|attack|bomb|destroy|violation|crime/.test(t)) return 4;
  if (/military|weapon|deploy|escalat|conflict|war|assault|autonomous/.test(t)) return 3;
  if (/warn|threat|tension|sanction|ban|restrict|arrest|indict/.test(t)) return 2;
  return 1;
}

function getEscalationProb(title, severity) {
  let prob = severity * 15 + Math.floor(Math.random() * 20);
  if (/nuclear|genocide|war|massacre/i.test(title)) prob = Math.max(prob, 85);
  if (/tensions|warn|threat/i.test(title)) prob = Math.max(prob, 45);
  return Math.min(prob, 99);
}

function extractMedia(article) {
  return article.socialimage || article.image || null;
}

export async function GET(request) {
  try {
    await initDb();
    
    // 1. Fetch OSINT from GDELT
    const mainQuery = '(artificial intelligence OR autonomous weapons OR "Stop Killer Robots" OR "LAWS disarmament" OR "killer robots" OR "lethal autonomous weapons" OR drone OR AI military OR surveillance OR "facial recognition" OR cyber OR OSINT OR "state violations" OR "corporate complicity" OR "human rights AI" OR Palantir OR ICE OR DHS OR NEST OR "surveillance tech" OR earthquake OR tsunami OR flood OR hurricane OR "natural disaster" OR "refugee crisis" OR "humanitarian aid" OR "global trade" OR tariff OR sanction)';
    const docUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(mainQuery)}&mode=artlist&maxrecords=250&format=json&sourcelang=english&timespan=12h`;
    
    let osintEvents = [];
    try {
      const gdeltRes = await fetch(docUrl, { signal: AbortSignal.timeout(6000) });
      const gdeltData = gdeltRes.ok ? await gdeltRes.json() : { articles: [] };
      osintEvents = (gdeltData.articles || []).map(a => {
        const decodedTitle = decodeHtmlEntities(a.title || 'Untitled');
        const geo = geocodeText(decodedTitle, a.sourcecountry || '', a.domain || null);
        
        return {
          id: generateId(a.url, decodedTitle),
          title: decodedTitle,
          url: a.url,
          source: a.domain || 'Unknown',
          timestamp: a.seendate || new Date().toISOString(),
          category: categorize(decodedTitle),
          severity: scoreSeverity(decodedTitle),
          location: geo.name,
          lat: geo.lat,
          lon: geo.lon,
          details: { 
            ...a, 
            media: extractMedia(a),
            probability: getEscalationProb(decodedTitle, scoreSeverity(decodedTitle))
          }
        };
      });
    } catch (e) {
      console.warn('GDELT OSINT fetch failed or timed out. Proceeding with research feeds.', e.message);
    }

    // 2. Fetch Verified Research/News from Funnel
    const research = await fetchResearch();

    const researchEvents = research.map(r => ({
      ...r,
      id: generateId(r.url, r.title),
      details: { 
        ...r.details, 
        probability: getEscalationProb(r.title, r.severity),
        isResearch: true 
      }
    }));

    const rawCombined = [...osintEvents, ...researchEvents];
    const verifiedEvents = [];

    if (rawCombined.length > 0) {
      console.log(`[Verification Bot]: Commencing concurrent verification checks on ${rawCombined.length} harvested signals...`);
      
      // Process in small parallel chunks to avoid rate limits on news sites
      const CONCURRENCY_LIMIT = 8;
      for (let i = 0; i < rawCombined.length; i += CONCURRENCY_LIMIT) {
        const chunk = rawCombined.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(chunk.map(async (ev) => {
          try {
            if (ev.details?.isResearch) {
              ev.details.verificationStatus = 'active';
              verifiedEvents.push(ev);
              return;
            }

            const verification = await verifyLink(ev.url, ev.title, ev.source);
            if (verification.active) {
              const isHealed = verification.url !== ev.url;
              ev.details.verificationStatus = isHealed ? 'healed' : 'active';
              if (isHealed) {
                ev.details.originalUrl = ev.url;
                ev.url = verification.url;
              }
            } else {
              const alternativeUrl = await findAlternativeLink(ev.title, ev.source);
              if (alternativeUrl) {
                ev.details.originalUrl = ev.url;
                ev.url = alternativeUrl;
                ev.details.verificationStatus = 'healed';
              } else {
                ev.details.verificationStatus = 'broken';
              }
            }
          } catch (e) {
            console.warn(`[Verification Bot Alert]: Failed to verify link for "${ev.title}":`, e.message);
            ev.details.verificationStatus = 'pending';
          }
          verifiedEvents.push(ev);
        }));
      }

      await saveEvents(verifiedEvents);
      // Log verified events to vault
      await logToVault(verifiedEvents);
    }

    // 3. Fetch and parse Live RSS feeds, then save to Neon
    let newRssCount = 0;
    try {
      const rssItems = await scrapeAllRss();
      if (rssItems.length > 0) {
        await saveRssItems(rssItems);
        newRssCount = rssItems.length;
      }
    } catch (e) {
      console.warn('RSS ingestion failed during cron run:', e.message);
    }

    // 4. Live Sync and parse AI Regulations from Google My Maps NetworkLink KML
    let regSyncedCount = 0;
    try {
      regSyncedCount = await syncAiRegulations();
    } catch (e) {
      console.warn('AI Regulations live sync failed during cron run:', e.message);
    }

    // 5. Live Sync and parse GeoConfirmed API data
    let geoConfirmedCount = 0;
    try {
      geoConfirmedCount = await syncGeoConfirmed();
    } catch (e) {
      console.warn('GeoConfirmed live sync failed during cron run:', e.message);
    }
    
    return NextResponse.json({ 
      success: true, 
      count: verifiedEvents.length,
      osint: osintEvents.length,
      research: researchEvents.length,
      rssIngested: newRssCount,
      aiRegulationsSynced: regSyncedCount,
      geoConfirmedSynced: geoConfirmedCount
    });
  } catch (error) {
    console.error('Scheduled ingestion error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function syncAiRegulations() {
  try {
    const url = 'https://www.google.com/maps/d/kml?mid=1grbvr9Ic-qJ-LTC9DHqpdzi2M-mtxl4&forcekml=1';
    console.log('[AI Regulations Ingestion]: Syncing from live Google My Maps KML Link...');
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    
    const kml = await res.text();
    if (!kml.includes('<kml') || !kml.includes('<Placemark>')) {
      throw new Error('Fetched content is not a valid KML file');
    }
    
    const folderRegex = /<Folder>([\s\S]*?)<\/Folder>/g;
    const cleanCdata = (str) => {
      if (!str) return '';
      return str.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
    };
    
    const results = [];
    let folderMatch;
    let index = 0;
    
    while ((folderMatch = folderRegex.exec(kml))) {
      const folderContent = folderMatch[1];
      const folderNameMatch = folderContent.match(/<name>(.*?)<\/name>/);
      const rawArea = folderNameMatch ? folderNameMatch[1] : 'Other';
      const area = cleanCdata(rawArea);
      
      let placemarkMatch;
      const localPlacemarkRegex = /<Placemark>([\s\S]*?)<\/Placemark>/g;
      
      while ((placemarkMatch = localPlacemarkRegex.exec(folderContent))) {
        const placemarkContent = placemarkMatch[1];
        
        const nameMatch = placemarkContent.match(/<name>(.*?)<\/name>/);
        if (!nameMatch) continue;
        const rawName = cleanCdata(nameMatch[1]);
        
        const splitMatch = rawName.split(/\s+[-–—]\s+/);
        let jurisdiction = 'Global';
        let title = rawName;
        
        if (splitMatch.length > 1) {
          jurisdiction = splitMatch[0].trim();
          title = splitMatch.slice(1).join(' - ').trim();
        }
        
        const descMatch = placemarkContent.match(/<description>(.*?)<\/description>/);
        const sourceUrl = descMatch ? cleanCdata(descMatch[1]) : '';
        
        const styleMatch = placemarkContent.match(/<styleUrl>#(.*?)<\/styleUrl>/);
        const styleUrl = styleMatch ? styleMatch[1] : '';
        let status = 'Proposed';
        
        if (styleUrl.includes('0F9D58')) {
          status = 'In effect';
        } else if (styleUrl.includes('0288D1')) {
          status = 'Passed';
        } else if (styleUrl.includes('FFEA00') || styleUrl.includes('FFD600') || styleUrl.includes('FBC02D')) {
          status = 'Proposed';
        } else if (styleUrl.includes('673AB7')) {
          status = 'Policy';
        }
        
        const coordMatch = placemarkContent.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
        if (!coordMatch) continue;
        const coordStr = coordMatch[1].trim();
        const coordParts = coordStr.split(',');
        if (coordParts.length < 2) continue;
        
        const lon = parseFloat(coordParts[0]);
        const lat = parseFloat(coordParts[1]);
        
        if (isNaN(lon) || isNaN(lat)) continue;
        
        let date = '2026-05-15';
        const yearMatch = title.match(/\b(201\d|202\d)\b/);
        if (yearMatch) {
          date = `${yearMatch[1]}-01-01`;
        }
        
        const description = `Official Source / Legislation: ${sourceUrl || 'Not provided'}\n\nThis maps the AI regulation tracking for "${title}" under the "${area}" focus area in "${jurisdiction}".`;
        
        results.push({
          id: `reg-kml-${index++}`,
          title: `${jurisdiction} - ${title}`,
          jurisdiction: jurisdiction,
          status: status,
          area: area,
          date: date,
          description: description,
          lat: lat,
          lon: lon
        });
      }
    }
    
    if (results.length > 0) {
      console.log(`[AI Regulations Ingestion]: Successfully parsed ${results.length} live regulations.`);
      
      const fs = require('fs');
      const path = require('path');
      const localFilePath = path.resolve('ai-regulations-local.json');
      fs.writeFileSync(localFilePath, JSON.stringify(results, null, 2), 'utf8');
      
      await saveAiRegulations(results);
      return results.length;
    }
    return 0;
  } catch (err) {
    console.error('[AI Regulations Ingestion Error]:', err.message);
    return 0;
  }
}

async function syncGeoConfirmed() {
  const userAgent = 'SovereignDashboard/1.0 (+workwithavip@gmail.com)';
  const headers = { 
    'User-Agent': userAgent,
    'Accept': 'application/json'
  };

  try {
    console.log('[GeoConfirmed Sync]: Fetching tracked conflicts...');
    const resConflicts = await fetch('https://geoconfirmed.org/api/Conflict', { headers, signal: AbortSignal.timeout(10000) });
    if (!resConflicts.ok) throw new Error(`Failed to fetch conflicts list: status ${resConflicts.status}`);
    const conflicts = await resConflicts.json();
    const activeConflicts = conflicts.filter(c => !c.isPrivate);
    console.log(`[GeoConfirmed Sync]: Found ${activeConflicts.length} active conflicts.`);

    const recentEvents = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14); // 14-day sliding window

    console.log(`[GeoConfirmed Sync]: Gathering placemarks with 14-day cutoff: ${cutoffDate.toISOString()}...`);
    
    // Concurrently fetch placemarks list for all active conflicts
    await Promise.all(activeConflicts.map(async (conflict) => {
      try {
        const url = `https://geoconfirmed.org/api/Placemark/${conflict.url}`;
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
        if (!res.ok) {
          console.warn(`[GeoConfirmed Sync]: Failed to fetch placemarks for ${conflict.url}: ${res.status}`);
          return;
        }
        const factions = await res.json();
        for (const faction of factions) {
          if (!faction.icons) continue;
          for (const icon of faction.icons) {
            if (!icon.placemarks) continue;
            for (const pm of icon.placemarks) {
              const pmDate = new Date(pm.date);
              if (pmDate >= cutoffDate) {
                recentEvents.push({
                  id: pm.id,
                  date: pm.date,
                  lat: pm.la,
                  lon: pm.lo,
                  conflict: conflict.name,
                  conflictSlug: conflict.url,
                  faction: faction.name,
                  iconPath: icon.icon
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[GeoConfirmed Sync]: Error fetching placemarks for ${conflict.url}:`, err.message);
      }
    }));

    console.log(`[GeoConfirmed Sync]: Harvested ${recentEvents.length} active events.`);

    if (recentEvents.length === 0) {
      return 0;
    }

    // Load existing events from last 30 days to check what's already enriched
    const existingMap = new Map();
    if (process.env.POSTGRES_URL) {
      try {
        const res = await sql`SELECT id, title, url, details FROM sigint_events WHERE timestamp >= NOW() - INTERVAL '30 days'`;
        for (const row of res.rows) {
          existingMap.set(row.id, row);
        }
      } catch (err) {
        console.warn('[GeoConfirmed Sync]: Existing database lookup error:', err.message);
      }
    } else {
      try {
        const fs = require('fs');
        const path = require('path');
        const localFile = path.resolve('events-local.json');
        if (fs.existsSync(localFile)) {
          const localEvents = JSON.parse(fs.readFileSync(localFile, 'utf8'));
          for (const ev of localEvents) {
            existingMap.set(ev.id, ev);
          }
        }
      } catch (err) {
        console.warn('[GeoConfirmed Sync]: Existing local lookup error:', err.message);
      }
    }

    const isEnriched = (ev) => {
      return ev && ev.details && (ev.details.plusCode || ev.details.orbatUnits || ev.details.gear || ev.details.units);
    };

    const alreadyEnriched = [];
    const needsEnrichment = [];

    recentEvents.forEach(ev => {
      const existing = existingMap.get(ev.id);
      if (existing && isEnriched(existing)) {
        alreadyEnriched.push({
          ...ev,
          existing
        });
      } else {
        needsEnrichment.push(ev);
      }
    });

    console.log(`[GeoConfirmed Sync]: ${alreadyEnriched.length} events already enriched, ${needsEnrichment.length} events need enrichment check.`);

    // Sort needsEnrichment by date descending and pick top 80 newest
    needsEnrichment.sort((a, b) => new Date(b.date) - new Date(a.date));
    const toEnrich = needsEnrichment.slice(0, 80);
    const toPlaceholder = needsEnrichment.slice(80);

    const enrichedEvents = [];
    const CONCURRENCY_LIMIT = 8;

    if (toEnrich.length > 0) {
      console.log(`[GeoConfirmed Sync]: Fetching details for top ${toEnrich.length} new events...`);
      for (let i = 0; i < toEnrich.length; i += CONCURRENCY_LIMIT) {
        const chunk = toEnrich.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(chunk.map(async (ev) => {
          try {
            const url = `https://geoconfirmed.org/api/Placemark/detail/${ev.id}`;
            const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
            if (res.ok) {
              const detail = await res.json();
              enrichedEvents.push({
                ...ev,
                detail
              });
            } else {
              console.warn(`[GeoConfirmed Sync]: Detail fetch failed for ${ev.id}: ${res.status}`);
              enrichedEvents.push(ev); // Fallback to placeholder
            }
          } catch (err) {
            console.warn(`[GeoConfirmed Sync]: Detail fetch error for ${ev.id}:`, err.message);
            enrichedEvents.push(ev); // Fallback to placeholder
          }
        }));
      }
    }

    // Now map all events to final format
    const eventsToSave = [];

    // 1. Process newly enriched/fallback events
    enrichedEvents.forEach(ev => {
      if (ev.detail) {
        const dt = ev.detail;
        let title = dt.description ? dt.description.trim() : `Verified signal for ${ev.faction}`;
        if (title.length > 180) {
          title = title.substring(0, 180) + '...';
        }
        
        let sourceUrl = 'https://geoconfirmed.org';
        if (dt.originalSource) {
          const urls = dt.originalSource.split(/\s+/).filter(u => u.startsWith('http'));
          if (urls.length > 0) sourceUrl = urls[0];
        }
        
        const severity = scoreSeverity(title);
        const details = {
          source: 'GeoConfirmed',
          faction: ev.faction,
          conflict: ev.conflict,
          iconPath: ev.iconPath,
          geolocation: dt.geolocation,
          origin: dt.origin,
          gear: dt.gear,
          units: dt.units,
          plusCode: dt.plusCode,
          orbatUnits: dt.orbatUnits,
          originalSource: dt.originalSource,
          probability: getEscalationProb(title, severity)
        };

        eventsToSave.push({
          id: ev.id,
          title: title,
          category: 'Conflict',
          severity: severity,
          location: dt.plusCode || ev.faction || ev.conflict || 'Conflict Zone',
          lat: dt.latitude || ev.lat,
          lon: dt.longitude || ev.lon,
          timestamp: dt.date || ev.date || new Date().toISOString(),
          url: sourceUrl,
          details: details
        });
      } else {
        // Fallback to placeholder
        const title = `[GeoConfirmed] ${ev.faction} - Incident in ${ev.conflict}`;
        const severity = 3;
        const details = {
          source: 'GeoConfirmed',
          faction: ev.faction,
          conflict: ev.conflict,
          iconPath: ev.iconPath,
          probability: getEscalationProb(title, severity)
        };

        eventsToSave.push({
          id: ev.id,
          title: title,
          category: 'Conflict',
          severity: severity,
          location: `${ev.faction} Zone`,
          lat: ev.lat,
          lon: ev.lon,
          timestamp: ev.date || new Date().toISOString(),
          url: 'https://geoconfirmed.org',
          details: details
        });
      }
    });

    // 2. Process placeholder events beyond top 80 limit
    toPlaceholder.forEach(ev => {
      const title = `[GeoConfirmed] ${ev.faction} - Incident in ${ev.conflict}`;
      const severity = 3;
      const details = {
        source: 'GeoConfirmed',
        faction: ev.faction,
        conflict: ev.conflict,
        iconPath: ev.iconPath,
        probability: getEscalationProb(title, severity)
      };

      eventsToSave.push({
        id: ev.id,
        title: title,
        category: 'Conflict',
        severity: severity,
        location: `${ev.faction} Zone`,
        lat: ev.lat,
        lon: ev.lon,
        timestamp: ev.date || new Date().toISOString(),
        url: 'https://geoconfirmed.org',
        details: details
      });
    });

    // 3. Keep already enriched events intact by mapping them back from existing database rows
    alreadyEnriched.forEach(ev => {
      const ex = ev.existing;
      eventsToSave.push({
        id: ex.id,
        title: ex.title,
        category: ex.category || 'Conflict',
        severity: ex.severity || 3,
        location: ex.location || `${ev.faction} Zone`,
        lat: ex.lat || ev.lat,
        lon: ex.lon || ev.lon,
        timestamp: ex.timestamp || ev.date || new Date().toISOString(),
        url: ex.url || 'https://geoconfirmed.org',
        details: ex.details
      });
    });

    if (eventsToSave.length > 0) {
      console.log(`[GeoConfirmed Sync]: Saving ${eventsToSave.length} total events to database...`);
      await saveEvents(eventsToSave);
      console.log(`[GeoConfirmed Sync]: Sync completed successfully!`);
    }

    return eventsToSave.length;
  } catch (err) {
    console.error('[GeoConfirmed Sync Error]:', err.message);
    return 0;
  }
}
