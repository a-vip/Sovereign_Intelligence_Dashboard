import { NextResponse } from 'next/server';
import { initDb, saveEvents, saveRssItems, saveAiRegulations, getArchivedInfo, isEventArchived } from '@/lib/db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fetchResearch, logToVault } from '@/lib/researchFunnel';
import { scrapeAllRss } from '@/lib/rssParser';
import { verifyLink, findAlternativeLink } from '@/lib/verification';
import { geocodeText, decodeHtmlEntities } from '@/lib/geocoder';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for the ingestion pipeline

function generateId(url, title) {
  return crypto.createHash('md5').update(url || title).digest('hex');
}

function isEventAiRelated(e) {
  if (!e) return false;
  const title = (e.title || e.name || '').toLowerCase();
  const desc = (e.description || e.summary || e.details?.summary || e.details?.description || '').toLowerCase();
  
  // 1. Blocklist for sports, entertainment, and generic irrelevant news
  const isBlocklisted = /(cricket|football|soccer|baseball|rugby|tennis|olympics|stadium|batting|bowler|innings|celebrity|hollywood|bollywood|pop star|concert|album|actors|actress|theatre|box office|super bowl|ipl match|championship|premier league|tournament|cricket match)/i.test(title) ||
    (desc && /(cricket|football|soccer|baseball|rugby|tennis|olympics|stadium|batting|bowler|innings|celebrity|hollywood|bollywood|pop star|concert|album|actors|actress|theatre|box office|super bowl|ipl match|championship|premier league|tournament|cricket match)/i.test(desc));
    
  if (isBlocklisted) return false;

  // 2. AI & high-tech governance/military/surveillance keywords
  const aiRegex = /\b(artificial intelligence|ai|autonomous weapon|autonomous weapons|drone|drones|military ai|surveillance|facial recognition|biometric|biometrics|cyber|killer robot|killer robots|robotics|robotic|algorithm|algorithmic|automated|governance|nimbus|palantir|surveillance tech|biometric scan|biometric checks|biometrics scan|biometrics check|biometric scanner|gps jamming|gps jam|jamming|ads-b|cyberwar|cyberattack|hacker|hackers)\b/i;
  
  return aiRegex.test(title) || aiRegex.test(desc);
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
    
    const mainQuery = '("artificial intelligence" OR "autonomous weapons" OR "Stop Killer Robots" OR "LAWS disarmament" OR "killer robots" OR "lethal autonomous weapons" OR "AI military" OR "facial recognition" OR "surveillance tech" OR Palantir OR "human rights AI" OR "cyber surveillance" OR biometric)';
    const docUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(mainQuery)}&mode=artlist&maxrecords=150&format=json&sourcelang=english&timespan=12h`;
    
    let osintEvents = [];
    try {
      const gdeltRes = await fetch(docUrl, { signal: AbortSignal.timeout(6000) });
      const gdeltData = gdeltRes.ok ? await gdeltRes.json() : { articles: [] };
      
      // Filter out any articles that are blocklisted or not AI/governance related
      const filteredArticles = (gdeltData.articles || []).filter(a => 
        isEventAiRelated({
          title: a.title,
          description: (a.title || '') + ' ' + (a.domain || '')
        })
      );

      osintEvents = filteredArticles.map(a => {
        const decodedTitle = decodeHtmlEntities(a.title || 'Untitled');
        const geo = geocodeText(decodedTitle, a.sourcecountry || '', a.domain || null);
        
        let ts = a.seendate || new Date().toISOString();
        if (typeof ts === 'string' && /^\d{14}$/.test(ts)) {
          ts = ts.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z');
        }
        
        return {
          id: generateId(a.url, decodedTitle),
          title: decodedTitle,
          url: a.url,
          source: a.domain || 'Unknown',
          timestamp: ts,
          original_post_time: ts,
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

    // FETCH ARCHIVE BLOCKLIST FOR PRE-INGESTION FILTERING
    const archivedInfo = await getArchivedInfo();
    
    const allCombinedEvents = [...osintEvents, ...researchEvents].filter(e => !isEventArchived(e, archivedInfo));

    let verifiedEvents = [];
    if (allCombinedEvents.length > 0) {
      console.log(`[Verification Bot]: Commencing concurrent verification checks on ${allCombinedEvents.length} harvested signals...`);
      
      // Process in small parallel chunks to avoid rate limits on news sites
      const CONCURRENCY_LIMIT = 8;
      for (let i = 0; i < allCombinedEvents.length; i += CONCURRENCY_LIMIT) {
        const chunk = allCombinedEvents.slice(i, i + CONCURRENCY_LIMIT);
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
      const filteredRssItems = rssItems.filter(item => !isEventArchived(item, archivedInfo));
      if (filteredRssItems.length > 0) {
        await saveRssItems(filteredRssItems);
        newRssCount = filteredRssItems.length;
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

    return NextResponse.json({ 
      success: true, 
      count: verifiedEvents.length,
      osint: osintEvents.length,
      research: researchEvents.length,
      rssIngested: newRssCount,
      aiRegulationsSynced: regSyncedCount,
      geoConfirmedSynced: 0
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


