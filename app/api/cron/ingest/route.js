import { NextResponse } from 'next/server';
import { initDb, saveEvents, saveRssItems } from '@/lib/db';
import crypto from 'crypto';
import { fetchResearch, logToVault } from '@/lib/researchFunnel';
import { scrapeAllRss } from '@/lib/rssParser';
import { verifyLink, findAlternativeLink } from '@/lib/verification';
import { geocodeText, decodeHtmlEntities } from '@/lib/geocoder';

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
    
    return NextResponse.json({ 
      success: true, 
      count: verifiedEvents.length,
      osint: osintEvents.length,
      research: researchEvents.length,
      rssIngested: newRssCount
    });
  } catch (error) {
    console.error('Scheduled ingestion error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
