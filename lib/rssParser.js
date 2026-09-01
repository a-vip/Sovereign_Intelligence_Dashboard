import crypto from 'crypto';
import { geocodeText, decodeHtmlEntities } from './geocoder';

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
  },
  {
    id: 'un',
    name: 'UN News',
    url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
    kw: ['Gaza', 'West Bank', 'refugee', 'human rights', 'treaty', 'conflict', 'sanctions', 'casualties', 'ceasefire', 'starvation', 'famine', 'displaced']
  },
  {
    id: 'wired',
    name: 'Wired AI & Security',
    url: 'https://www.wired.com/feed/tag/ai/latest/rss',
    kw: ['surveillance', 'facial', 'hacker', 'exploit', 'cyber', 'privacy', 'biometric', 'drones', 'targeting', 'pentagon', 'autonomous', 'spyware', 'pegasus']
  },
  {
    id: 'eff',
    name: 'EFF Updates',
    url: 'https://www.eff.org/rss/updates.xml',
    kw: ['surveillance', 'privacy', 'facial recognition', 'biometric', 'encryption', 'patriot act', 'nsa', 'police tech', 'tracking', 'biometrics', 'algorithm', 'spyware']
  }
];

// Generate a dynamic recent date for fallback items (N hours ago from now)
function recentDate(hoursAgo) {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

export const RSS_FALLBACK = [
  { 
    title: 'Autonomous weapons and meaningful human control — legal framework analysis', 
    url: 'https://arxiv.org/search/?query=autonomous+weapons+IHL', 
    get published_at() { return recentDate(6); }, 
    source: 'arXiv cs.AI', 
    sid: 'arxiv', 
    location: 'Stanford / Silicon Valley', 
    latitude: 37.4275, 
    longitude: -122.1697, 
    category: 'Political', 
    severity: 2,
    summary: 'This computer science research paper analyzes the legal and ethical boundaries of meaningful human control in autonomous weapon systems. It maps accountability gaps under International Humanitarian Law (IHL) and designs algorithmic frameworks for policy enforcement.'
  },
  { 
    title: 'Machine learning ethics in military targeting: accountability gaps', 
    url: 'https://arxiv.org/search/?query=military+AI+ethics+targeting', 
    get published_at() { return recentDate(12); }, 
    source: 'arXiv cs.AI', 
    sid: 'arxiv', 
    location: 'Stanford / Silicon Valley', 
    latitude: 37.4275, 
    longitude: -122.1697, 
    category: 'Conflict', 
    severity: 3,
    summary: 'An exploration of algorithmic decision-making systems used in high-risk military targeting, detailing systemic failures, statistical biases, and ethical challenges. The paper calls for binding global regulations to address critical accountability gaps.'
  },
  { 
    title: 'Reinforcement learning bias and discriminatory outcomes in law enforcement AI', 
    url: 'https://arxiv.org/search/?query=algorithmic+bias+law+enforcement', 
    get published_at() { return recentDate(24); }, 
    source: 'arXiv cs.AI', 
    sid: 'arxiv', 
    location: 'Stanford / Silicon Valley', 
    latitude: 37.4275, 
    longitude: -122.1697, 
    category: 'Surveillance', 
    severity: 2,
    summary: 'This analysis assesses reinforcement learning agents applied within crime prediction and sentencing systems. The authors prove that unchecked training objectives yield severely discriminatory outcomes against minority populations.'
  },
  { 
    title: 'Israel\'s AI-directed strike systems in Gaza: what we know', 
    url: 'https://www.aljazeera.com/news/2024/4/3/israel-ai-artificial-intelligence-gaza', 
    get published_at() { return recentDate(18); }, 
    source: 'Al Jazeera', 
    sid: 'aje', 
    location: 'Gaza Strip', 
    latitude: 31.3547, 
    longitude: 34.3088, 
    category: 'Conflict', 
    severity: 4,
    summary: 'Detailed journalistic reporting on Israel\'s implementation of automated intelligence processing platforms like Lavender and Habsora (The Gospel). The systems automatically identify targets with limited human oversight, raising massive international concern.'
  },
  { 
    title: 'UN calls for international treaty on killer robots', 
    url: 'https://www.aljazeera.com/news/2024/5/10/un-calls-for-regulation-of-killer-robots', 
    get published_at() { return recentDate(36); }, 
    source: 'Al Jazeera', 
    sid: 'aje', 
    location: 'Geneva, UN Office', 
    latitude: 46.2044, 
    longitude: 6.1432, 
    category: 'Political', 
    severity: 3,
    summary: 'At a summit in Geneva, UN agencies and human rights activists urge state parties to draft a binding international treaty to restrict the development and deployment of fully autonomous lethal weapon systems (LAWS).'
  },
  { 
    title: 'How ICE uses artificial intelligence to track and arrest immigrants', 
    url: 'https://www.hrw.org/news/2024/03/14/us-using-predictive-algorithms-target-immigrants', 
    get published_at() { return recentDate(30); }, 
    source: 'HRW', 
    sid: 'hrw', 
    location: 'United States', 
    latitude: 38.9072, 
    longitude: -77.0369, 
    category: 'Surveillance', 
    severity: 3,
    summary: 'Human Rights Watch documents predictive surveillance algorithms and data mining software employed by Immigration and Customs Enforcement (ICE) to automate tracking, profiling, and targeted arrests at border checkpoints.'
  },
  { 
    title: 'Automated apartheid: facial recognition at West Bank checkpoints', 
    url: 'https://www.hrw.org/report/2021/04/27/threshold-crossed/israeli-authorities-and-crimes-apartheid-and-persecution', 
    get published_at() { return recentDate(48); }, 
    source: 'HRW', 
    sid: 'hrw', 
    location: 'West Bank', 
    latitude: 31.9522, 
    longitude: 35.2332, 
    category: 'Humanitarian', 
    severity: 4,
    summary: 'An investigation into Israeli biometric scanning platforms (Red Wolf and Blue Wolf) deployed across West Bank checkposts. The algorithms automatically cross-reference Palestinian residents without consent, restricting movement.'
  },
  { 
    title: 'UN General Assembly adopts landmark resolution on autonomous weapon systems regulation', 
    url: 'https://news.un.org/en/story/2024/05/un-resolution-killer-robots', 
    get published_at() { return recentDate(42); }, 
    source: 'UN News', 
    sid: 'un', 
    location: 'UN Headquarters NY', 
    latitude: 40.7489, 
    longitude: -73.9680, 
    category: 'Political', 
    severity: 3,
    summary: 'The UN General Assembly passes a historic resolution emphasizing the urgent need for the international community to regulate lethal autonomous weapons, citing high risks of algorithmic warfare escalation.'
  },
  { 
    title: 'Pegasus spyware detected on phones of state department officials', 
    url: 'https://www.wired.com/story/pegasus-spyware-state-department-detection', 
    get published_at() { return recentDate(54); }, 
    source: 'Wired AI & Security', 
    sid: 'wired', 
    location: 'San Francisco HQ', 
    latitude: 37.7749, 
    longitude: -122.4194, 
    category: 'Surveillance', 
    severity: 4,
    summary: 'Forensic researchers identify active installations of NSO Group\'s Pegasus spyware on the personal devices of US State Department personnel. The zero-click exploit allows full telemetry extraction and microphone activation.'
  },
  { 
    title: 'EFF sues DHS over illegal biometric face scanning at regional border checkpoints', 
    url: 'https://www.eff.org/press/releases/eff-sues-dhs-over-illegal-biometric-face-scanning', 
    get published_at() { return recentDate(60); }, 
    source: 'EFF Updates', 
    sid: 'eff', 
    location: 'EFF SF Office', 
    latitude: 37.7749, 
    longitude: -122.4194, 
    category: 'Surveillance', 
    severity: 3,
    summary: 'The Electronic Frontier Foundation files a federal lawsuit against the Department of Homeland Security, challenging the constitutionality of biometric facial recognition surveillance gates deployed at entry points.'
  },
  { 
    title: 'Bias in criminal sentencing algorithms: a systematic review', 
    url: 'https://arxiv.org/search/?query=sentencing+algorithm+racial+bias', 
    get published_at() { return recentDate(72); }, 
    source: 'arXiv cs.AI', 
    sid: 'arxiv', 
    location: 'Stanford / Silicon Valley', 
    latitude: 37.4275, 
    longitude: -122.1697, 
    category: 'Political', 
    severity: 2,
    summary: 'A critical review of algorithmic recidivism scoring tools used in judicial courtrooms. The paper exposes substantial statistical skew, showing artificial inflation of risk profiles for marginalized groups.'
  },
  { 
    title: 'DARPA\'s autonomous swarm programmes and the absence of legal review', 
    url: 'https://arxiv.org/search/?query=DARPA+autonomous+swarm+LAWS', 
    get published_at() { return recentDate(96); }, 
    source: 'arXiv cs.AI', 
    sid: 'arxiv', 
    location: 'United States', 
    latitude: 38.9072, 
    longitude: -77.0369, 
    category: 'Conflict', 
    severity: 3,
    summary: 'An operational audit of the Pentagon\'s collaborative drone swarm testbeds. The author highlights the total absence of formal Article 36 weapons reviews, warn of sudden escalatory risks in air defense.'
  },
  { 
    title: 'Social credit systems and their impact on fundamental rights', 
    url: 'https://www.hrw.org/news/2022/07/26/china-social-media-surveillance-minorities', 
    get published_at() { return recentDate(108); }, 
    source: 'HRW', 
    sid: 'hrw', 
    location: 'China', 
    latitude: 39.9042, 
    longitude: 116.4074, 
    category: 'Surveillance', 
    severity: 2,
    summary: 'Human Rights Watch reports on digital social credit pilot projects, detailing continuous metadata collection, algorithmic tracking of minor behavior infractions, and severe restrictions on citizen travel.'
  },
  { 
    title: 'Lethal autonomous weapons: the case for a binding international prohibition', 
    url: 'https://www.aljazeera.com/news/2023/10/12/killer-robots-campaign-against-lethal-autonomous-weapons', 
    get published_at() { return recentDate(120); }, 
    source: 'Al Jazeera', 
    sid: 'aje', 
    location: 'Geneva, UN Office', 
    latitude: 46.2044, 
    longitude: 6.1432, 
    category: 'Political', 
    severity: 3,
    summary: 'A call to action for international diplomats to establish a binding UN treaty on killer robots, arguing that delegating life-and-death decisions to autonomous targeting systems violates human dignity.'
  },
  { 
    title: 'Deep learning approaches to target identification: ethical constraints', 
    url: 'https://arxiv.org/search/?query=deep+learning+target+identification+ethics', 
    get published_at() { return recentDate(144); }, 
    source: 'arXiv cs.AI', 
    sid: 'arxiv', 
    location: 'Stanford / Silicon Valley', 
    latitude: 37.4275, 
    longitude: -122.1697, 
    category: 'Political', 
    severity: 2,
    summary: 'This computer science paper models deep neural networks trained for target verification. The authors construct adversarial scenarios showing extreme sensitivity and call for strict operational human containment.'
  }
];

export function geotagRssItem(title, sid) {
  const cleanedTitle = decodeHtmlEntities(title);
  const geo = geocodeText(cleanedTitle, '', sid);
  
  // Categorize based on standard dashboard metrics
  const text = cleanedTitle.toLowerCase();
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
    location: geo.name,
    latitude: geo.lat,
    longitude: geo.lon,
    category,
    severity
  };
}

export async function crawlArticleSummary(url, fallbackDesc) {
  if (fallbackDesc && fallbackDesc.length > 100 && !fallbackDesc.includes('cookie') && !fallbackDesc.includes('javascript') && !fallbackDesc.includes('browser')) {
    return decodeHtmlEntities(fallbackDesc).substring(0, 400);
  }
  try {
    const res = await fetch(url, { 
      signal: AbortSignal.timeout(4000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return decodeHtmlEntities(fallbackDesc) || 'Tactical monitoring feed entry. Direct link secured.';
    const html = await res.text();
    
    // Extract meta description
    const metaMatch = html.match(/<meta\s+[^>]*name=["']description["']\s+content=["']([^"']+)["']/i) || 
                      html.match(/<meta\s+[^>]*content=["']([^"']+)["']\s+name=["']description["']/i) ||
                      html.match(/<meta\s+[^>]*property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (metaMatch && metaMatch[1]) {
      const cleanMeta = decodeHtmlEntities(metaMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' '));
      if (cleanMeta.length > 25) {
        return cleanMeta.substring(0, 400);
      }
    }
    
    // Fallback: extract first body paragraph
    const paragraphs = html.match(/<p>([\s\S]*?)<\/p>/g);
    if (paragraphs) {
      for (const p of paragraphs) {
        const cleanP = decodeHtmlEntities(p.replace(/<[^>]+>/g, '').replace(/\s+/g, ' '));
        if (cleanP.length > 80 && !/cookie|privacy|javascript|browser|support|subscribe|newsletter|sign up/i.test(cleanP)) {
          return cleanP.substring(0, 350) + '...';
        }
      }
    }
    
    return decodeHtmlEntities(fallbackDesc) || 'Tactical monitoring feed entry. Direct link secured.';
  } catch (err) {
    return decodeHtmlEntities(fallbackDesc) || 'Tactical monitoring feed entry. Direct link secured.';
  }
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
    
    // Extract description/summary from XML
    const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/) || itemContent.match(/<summary>([\s\S]*?)<\/summary>/);
    let summaryText = descMatch ? descMatch[1] : '';
    summaryText = decodeHtmlEntities(
      summaryText
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
    );

    const decodedTitle = decodeHtmlEntities(title);
    const lc = decodedTitle.toLowerCase();
    
    // Blocklist for sports, entertainment, or general generic news
    const isBlocklisted = /(cricket|football|soccer|baseball|rugby|tennis|olympics|stadium|batting|bowler|innings|celebrity|hollywood|bollywood|pop star|concert|album|actors|actress|theatre|box office|super bowl|ipl match|championship|premier league|tournament|cricket match)/i.test(lc) ||
      (summaryText && /(cricket|football|soccer|baseball|rugby|tennis|olympics|stadium|batting|bowler|innings|celebrity|hollywood|bollywood|pop star|concert|album|actors|actress|theatre|box office|super bowl|ipl match|championship|premier league|tournament|cricket match)/i.test(summaryText.toLowerCase()));

    // Keyword matching
    const matchesKeyword = src.kw.some(k => lc.includes(k.toLowerCase()));
    
    if (matchesKeyword && !isBlocklisted) {
      let isoDate = new Date().toISOString();
      if (date) {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          isoDate = parsed.toISOString();
        }
      }
      
      const id = crypto.createHash('md5').update(link).digest('hex');
      const geotagInfo = geotagRssItem(decodedTitle, src.id);
      
      items.push({
        id,
        title: decodedTitle.substring(0, 200),
        url: link,
        source: src.name,
        sid: src.id,
        published_at: isoDate,
        summary: summaryText.substring(0, 400),
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
    const parsed = parseRssXml(xml, src);
    
    // Enrich top 4 items per source with dynamic webpage crawl summaries in parallel
    const enriched = await Promise.all(parsed.map(async (item, idx) => {
      if (idx < 4) {
        const crawledSummary = await crawlArticleSummary(item.url, item.summary);
        return { ...item, summary: crawledSummary };
      }
      return item;
    }));
    
    return enriched;
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
