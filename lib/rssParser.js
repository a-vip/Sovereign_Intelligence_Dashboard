import crypto from 'crypto';

export const RSS_SOURCES = [
  {
    id: 'arxiv',
    name: 'arXiv cs.AI',
    url: 'https://export.arxiv.org/rss/cs.AI',
    kw: ['autonomous weapon', 'surveillance', 'military', 'ethics', 'lethal', 'targeting', 'warfare', 'kill chain', 'accountability', 'bias', 'governance', 'harm', 'rights', 'drone']
  },
  {
    id: 'aje',
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    kw: ['AI', 'artificial intelligence', 'autonomous', 'drone', 'Gaza', 'surveillance', 'algorithm', 'facial recognition', 'deportation', 'military', 'weapon', 'kill', 'targeting']
  },
  {
    id: 'hrw',
    name: 'HRW',
    url: 'https://www.hrw.org/rss.xml',
    kw: ['AI', 'algorithm', 'surveillance', 'facial', 'weapon', 'autonomous', 'technology', 'discrimination', 'detention', 'deportation', 'armed', 'military', 'targeting']
  },
  {
    id: 'nature',
    name: 'Nature MI',
    url: 'https://www.nature.com/subjects/machine-intelligence.rss',
    kw: ['ethics', 'autonomous', 'weapon', 'surveillance', 'bias', 'military', 'accountability', 'warfare', 'harm', 'rights', 'governance', 'facial']
  }
];

export const RSS_FALLBACK = [
  { title: 'Autonomous weapons and meaningful human control — legal framework analysis', url: 'https://arxiv.org/search/?query=autonomous+weapons+IHL', published_at: '2026-05-15T12:00:00.000Z', source: 'arXiv cs.AI', sid: 'arxiv', location: 'Stanford / Silicon Valley', latitude: 37.4275, longitude: -122.1697, category: 'Political', severity: 2 },
  { title: 'Machine learning ethics in military targeting: accountability gaps', url: 'https://arxiv.org/search/?query=military+AI+ethics+targeting', published_at: '2026-05-14T12:00:00.000Z', source: 'arXiv cs.AI', sid: 'arxiv', location: 'Stanford / Silicon Valley', latitude: 37.4275, longitude: -122.1697, category: 'Conflict', severity: 3 },
  { title: 'Reinforcement learning bias and discriminatory outcomes in law enforcement AI', url: 'https://arxiv.org/search/?query=algorithmic+bias+law+enforcement', published_at: '2026-05-13T12:00:00.000Z', source: 'arXiv cs.AI', sid: 'arxiv', location: 'Stanford / Silicon Valley', latitude: 37.4275, longitude: -122.1697, category: 'Surveillance', severity: 2 },
  { title: 'Israel\'s AI-directed strike systems in Gaza: what we know', url: 'https://www.aljazeera.com/news/2024/4/3/israel-ai-artificial-intelligence-gaza', published_at: '2026-05-15T12:00:00.000Z', source: 'Al Jazeera', sid: 'aje', location: 'Gaza Strip', latitude: 31.3547, longitude: 34.3088, category: 'Conflict', severity: 4 },
  { title: 'UN calls for international treaty on killer robots', url: 'https://www.aljazeera.com/news/2024/5/10/un-calls-for-regulation-of-killer-robots', published_at: '2026-05-12T12:00:00.000Z', source: 'Al Jazeera', sid: 'aje', location: 'Geneva, UN Office', latitude: 46.2044, longitude: 6.1432, category: 'Political', severity: 3 },
  { title: 'How ICE uses artificial intelligence to track and arrest immigrants', url: 'https://www.hrw.org/news/2024/03/14/us-using-predictive-algorithms-target-immigrants', published_at: '2026-05-14T12:00:00.000Z', source: 'HRW', sid: 'hrw', location: 'United States', latitude: 38.9072, longitude: -77.0369, category: 'Surveillance', severity: 3 },
  { title: 'Automated apartheid: facial recognition at West Bank checkpoints', url: 'https://www.hrw.org/report/2021/04/27/threshold-crossed/israeli-authorities-and-crimes-apartheid-and-persecution', published_at: '2026-05-10T12:00:00.000Z', source: 'HRW', sid: 'hrw', location: 'West Bank', latitude: 31.9522, longitude: 35.2332, category: 'Humanitarian', severity: 4 },
  { title: 'Bias in criminal sentencing algorithms: a systematic review', url: 'https://arxiv.org/search/?query=sentencing+algorithm+racial+bias', published_at: '2026-05-09T12:00:00.000Z', source: 'arXiv cs.AI', sid: 'arxiv', location: 'Stanford / Silicon Valley', latitude: 37.4275, longitude: -122.1697, category: 'Political', severity: 2 },
  { title: 'DARPA\'s autonomous swarm programmes and the absence of legal review', url: 'https://arxiv.org/search/?query=DARPA+autonomous+swarm+LAWS', published_at: '2026-05-08T12:00:00.000Z', source: 'arXiv cs.AI', sid: 'arxiv', location: 'United States', latitude: 38.9072, longitude: -77.0369, category: 'Conflict', severity: 3 },
  { title: 'Social credit systems and their impact on fundamental rights', url: 'https://www.hrw.org/news/2022/07/26/china-social-media-surveillance-minorities', published_at: '2026-05-07T12:00:00.000Z', source: 'HRW', sid: 'hrw', location: 'China', latitude: 39.9042, longitude: 116.4074, category: 'Surveillance', severity: 2 },
  { title: 'Lethal autonomous weapons: the case for a binding international prohibition', url: 'https://www.aljazeera.com/news/2023/10/12/killer-robots-campaign-against-lethal-autonomous-weapons', published_at: '2026-05-06T12:00:00.000Z', source: 'Al Jazeera', sid: 'aje', location: 'Geneva, UN Office', latitude: 46.2044, longitude: 6.1432, category: 'Political', severity: 3 },
  { title: 'Deep learning approaches to target identification: ethical constraints', url: 'https://arxiv.org/search/?query=deep+learning+target+identification+ethics', published_at: '2026-05-05T12:00:00.000Z', source: 'arXiv cs.AI', sid: 'arxiv', location: 'Stanford / Silicon Valley', latitude: 37.4275, longitude: -122.1697, category: 'Political', severity: 2 }
];

export function geotagRssItem(title, sid) {
  const text = title.toLowerCase();
  
  // High-fidelity Geopolitical Location coordinates dictionary
  const locations = [
    { name: 'Gaza Strip', lat: 31.3547, lon: 34.3088, keys: ['gaza', 'rafah', 'khan younis', 'jabalia'] },
    { name: 'West Bank', lat: 31.9522, lon: 35.2332, keys: ['west bank', 'ramallah', 'hebron', 'jenin', 'nablus', 'checkpoints'] },
    { name: 'Israel', lat: 32.0853, lon: 34.7818, keys: ['israel', 'tel aviv', 'jerusalem', 'idf'] },
    { name: 'Ukraine', lat: 50.4501, lon: 30.5234, keys: ['ukraine', 'kyiv', 'donbas', 'kharkiv', 'crimea'] },
    { name: 'Russia', lat: 55.7558, lon: 37.6173, keys: ['russia', 'moscow', 'kremlin'] },
    { name: 'China', lat: 39.9042, lon: 116.4074, keys: ['china', 'beijing', 'shanghai', 'xinjiang', 'uyghur'] },
    { name: 'Taiwan', lat: 25.0330, lon: 121.5654, keys: ['taiwan', 'taipei'] },
    { name: 'Geneva, UN Office', lat: 46.2044, lon: 6.1432, keys: ['geneva', 'un treaty', 'international treaty', 'un general assembly', 'killer robots campaign', 'binding prohibition', 'human rights council'] },
    { name: 'United States', lat: 38.9072, lon: -77.0369, keys: ['us ', 'united states', 'washington', 'ice', 'dhs', 'nsa', 'cia', 'fbi', 'darpa', 'pentagon', 'silicon valley'] },
    { name: 'United Kingdom', lat: 51.5074, lon: -0.1278, keys: ['uk ', 'united kingdom', 'london', 'gchq'] },
    { name: 'European Union', lat: 50.8503, lon: 4.3517, keys: ['eu ', 'european union', 'brussels', 'strasbourg'] },
    { name: 'Iran', lat: 35.6892, lon: 51.3890, keys: ['iran', 'tehran'] },
    { name: 'North Korea', lat: 39.0392, lon: 125.7625, keys: ['north korea', 'pyongyang'] },
    { name: 'Syria', lat: 33.5138, lon: 36.2765, keys: ['syria', 'damascus'] },
    { name: 'Yemen', lat: 15.3694, lon: 44.1910, keys: ['yemen', 'sanaa', 'houthi'] },
    { name: 'Lebanon', lat: 33.8938, lon: 35.5018, keys: ['lebanon', 'beirut', 'hezbollah'] },
    { name: 'Sudan', lat: 15.5007, lon: 32.5599, keys: ['sudan', 'khartoum'] }
  ];

  let matchedLoc = null;
  for (const loc of locations) {
    if (loc.keys.some(k => text.includes(k))) {
      matchedLoc = loc;
      break;
    }
  }

  // Context-aware fallback centers based on the publisher
  if (!matchedLoc) {
    if (sid === 'arxiv') {
      matchedLoc = { name: 'Stanford / Silicon Valley', lat: 37.4275, lon: -122.1697 };
    } else if (sid === 'aje') {
      matchedLoc = { name: 'Doha HQ', lat: 25.2854, lon: 51.5310 };
    } else if (sid === 'hrw') {
      matchedLoc = { name: 'Geneva Office', lat: 46.2044, lon: 6.1432 };
    } else {
      matchedLoc = { name: 'London Research Hub', lat: 51.5074, lon: -0.1278 };
    }
  }

  // Categorize based on standard dashboard metrics
  let category = 'Political';
  if (/strike|attack|bomb|missile|drone|kill|military|weapon|war|combat|troops|airfield|airstrike|targeting|fortress|swarms/i.test(text)) {
    category = 'Conflict';
  } else if (/surveillance|palantir|ice|nest|dhs|facial recognition|biometric|tracking|border control|police tech|cia|fbi|nsa|monitoring|spying|gchq|pegasus/i.test(text)) {
    category = 'Surveillance';
  } else if (/humanitarian|refugee|aid|famine|hunger|displacement|crisis|civilian|casualties|victims|rescue|discrimination|apartheid|deportation/i.test(text)) {
    category = 'Humanitarian';
  } else if (/sanction|tariff|trade|embargo|finance|economic|billion|subsidy|funding/i.test(text)) {
    category = 'Economic';
  }

  // Score Severity 1-5
  let severity = 1;
  if (/massacre|genocide|nuclear|wmd|chemical|assassination|fatal/i.test(text)) {
    severity = 5;
  } else if (/strike|bomb|kill|dead|airstrike|lethal|weaponized/i.test(text)) {
    severity = 4;
  } else if (/autonomous|drone|military|surveillance|facial recognition|ice|dhs/i.test(text)) {
    severity = 3;
  } else if (/ethics|bias|governance|treaty|un calls|accountability/i.test(text)) {
    severity = 2;
  }

  return {
    location: matchedLoc.name,
    latitude: parseFloat(matchedLoc.lat),
    longitude: parseFloat(matchedLoc.lon),
    category,
    severity
  };
}

export function parseRssXml(xmlText, src) {
  const items = [];
  const itemRegex = /<(item|entry)>([\s\S]*?)<\/\1>/g;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[2];
    
    // Extract title
    const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
    let title = titleMatch ? titleMatch[1] : '';
    title = title.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
    
    if (title.length < 10) continue;
    
    // Extract link
    let link = '#';
    const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
    if (linkMatch) {
      link = linkMatch[1].trim();
    } else {
      const linkHrefMatch = itemContent.match(/<link\s+[^>]*href=["']([^"']+)["']/);
      if (linkHrefMatch) {
        link = linkHrefMatch[1].trim();
      }
    }
    link = link.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
    if (link === '#' || !link.startsWith('http')) continue;
    
    // Extract date
    const dateMatch = itemContent.match(/<(pubDate|published|updated|dc:date)>([\s\S]*?)<\/\1>/);
    let date = dateMatch ? dateMatch[2].trim() : '';
    date = date.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
    
    // Keyword matching
    const lc = title.toLowerCase();
    const matchesKeyword = src.kw.some(k => lc.includes(k.toLowerCase()));
    
    if (matchesKeyword) {
      let isoDate = new Date().toISOString();
      if (date) {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          isoDate = parsed.toISOString();
        }
      }
      
      const id = crypto.createHash('md5').update(link).digest('hex');
      const geotagInfo = geotagRssItem(title, src.id);
      
      items.push({
        id,
        title: title.substring(0, 200),
        url: link,
        source: src.name,
        sid: src.id,
        published_at: isoDate,
        ...geotagInfo
      });
    }
  }
  
  return items.slice(0, 15);
}

export async function fetchRssSource(src) {
  try {
    const res = await fetch(src.url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return parseRssXml(xml, src);
  } catch (error) {
    console.warn(`Failed to fetch RSS source [${src.name}]:`, error.message);
    return [];
  }
}

export async function scrapeAllRss() {
  const results = await Promise.all(RSS_SOURCES.map(fetchRssSource));
  const merged = results.flat();
  return merged.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
}
