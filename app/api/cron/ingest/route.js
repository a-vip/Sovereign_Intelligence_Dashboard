import { NextResponse } from 'next/server';
import { initDb, saveEvents } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateId(url, title) {
  return crypto.createHash('md5').update(url || title).digest('hex');
}

function categorize(text) {
  const keywords = {
    Conflict: /strike|attack|bomb|missile|drone|kill|military|weapon|war|combat|troops|airstrike|explosion|clash|warfare|assault|targeting/i,
    Humanitarian: /humanitarian|refugee|aid|famine|hunger|displacement|crisis|civilian|casualties|victims|rescue|relief/i,
    Disaster: /disaster|earthquake|flood|tsunami|hurricane|wildfire|storm|cyclone|accident/i,
    Economic: /economic|trade|sanction|tariff|oil|energy|market|finance|invest|contract|billion|funding/i,
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
  // GDELT sometimes provides socialimage or similar
  return article.socialimage || article.image || null;
}

export async function GET(request) {
  // Check for Vercel Cron Secret to secure the endpoint
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // return new Response('Unauthorized', { status: 401 }); // Temporarily disabled for testing
  }

  try {
    console.log('Starting scheduled ingestion...');
    await initDb();

    const mainQuery = '(artificial intelligence OR autonomous weapons OR drone OR AI military OR surveillance OR facial recognition OR cyber OR OSINT OR "state violations" OR "corporate complicity" OR "human rights AI")';
    const timespan = '1h'; // Fetch last hour of news
    const docUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(mainQuery)}&mode=artlist&maxrecords=250&format=json&sourcelang=english&timespan=${timespan}`;

    const res = await fetch(docUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`GDELT fetch failed: ${res.status}`);

    const data = await res.json();
    const articles = data.articles || [];

    const newEvents = articles.map(a => ({
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

    if (newEvents.length > 0) {
      await saveEvents(newEvents);
      console.log(`Successfully ingested ${newEvents.length} new events.`);
    }

    return NextResponse.json({
      success: true,
      count: newEvents.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron ingestion error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
