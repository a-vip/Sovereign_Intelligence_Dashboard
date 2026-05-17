import { NextResponse } from 'next/server';
import { initDb, saveEvents } from '@/lib/db';
import crypto from 'crypto';
import { fetchResearch, logToVault } from '@/lib/researchFunnel';

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
    const mainQuery = '(artificial intelligence OR autonomous weapons OR drone OR AI military OR surveillance OR "facial recognition" OR cyber OR OSINT OR "state violations" OR "corporate complicity" OR "human rights AI" OR Palantir OR ICE OR DHS OR NEST OR "surveillance tech" OR earthquake OR tsunami OR flood OR hurricane OR "natural disaster" OR "refugee crisis" OR "humanitarian aid" OR "global trade" OR tariff OR sanction)';
    const docUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(mainQuery)}&mode=artlist&maxrecords=250&format=json&sourcelang=english&timespan=12h`;
    
    const gdeltRes = await fetch(docUrl, { signal: AbortSignal.timeout(10000) });
    const gdeltData = gdeltRes.ok ? await gdeltRes.json() : { articles: [] };
    
    // 2. Fetch Verified Research/News from Funnel
    const research = await fetchResearch();
    
    const osintEvents = (gdeltData.articles || []).map(a => ({
      id: generateId(a.url, a.title),
      title: a.title || 'Untitled',
      url: a.url,
      source: a.domain || 'Unknown',
      timestamp: a.seendate || new Date().toISOString(),
      category: categorize(a.title || ''),
      severity: scoreSeverity(a.title || ''),
      location: a.sourcecountry || null,
      details: { 
        ...a, 
        media: extractMedia(a),
        probability: getEscalationProb(a.title || '', scoreSeverity(a.title || ''))
      }
    }));

    const researchEvents = research.map(r => ({
      ...r,
      id: generateId(r.url, r.title),
      details: { 
        ...r.details, 
        probability: getEscalationProb(r.title, r.severity),
        isResearch: true 
      }
    }));

    const newEvents = [...osintEvents, ...researchEvents];

    if (newEvents.length > 0) {
      await saveEvents(newEvents);
      // Log new events to vault
      await logToVault(newEvents);
    }
    
    return NextResponse.json({ 
      success: true, 
      count: newEvents.length,
      osint: osintEvents.length,
      research: researchEvents.length
    });
  } catch (error) {
    console.error('Scheduled ingestion error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
