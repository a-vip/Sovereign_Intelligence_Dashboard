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
  { title: 'Autonomous weapons and meaningful human control — legal framework analysis', url: 'https://arxiv.org/search/?query=autonomous+weapons+IHL', published_at: '2026-05-15T12:00:00.000Z', source: 'arXiv cs.AI', sid: 'arxiv' },
  { title: 'Machine learning ethics in military targeting: accountability gaps', url: 'https://arxiv.org/search/?query=military+AI+ethics+targeting', published_at: '2026-05-14T12:00:00.000Z', source: 'arXiv cs.AI', sid: 'arxiv' },
  { title: 'Reinforcement learning bias and discriminatory outcomes in law enforcement AI', url: 'https://arxiv.org/search/?query=algorithmic+bias+law+enforcement', published_at: '2026-05-13T12:00:00.000Z', source: 'arXiv cs.AI', sid: 'arxiv' },
  { title: 'Israel\'s AI-directed strike systems in Gaza: what we know', url: 'https://www.aljazeera.com/news/2024/4/3/israel-ai-artificial-intelligence-gaza', published_at: '2026-05-15T12:00:00.000Z', source: 'Al Jazeera', sid: 'aje' },
  { title: 'UN calls for international treaty on killer robots', url: 'https://www.aljazeera.com/news/2024/5/10/un-calls-for-regulation-of-killer-robots', published_at: '2026-05-12T12:00:00.000Z', source: 'Al Jazeera', sid: 'aje' },
  { title: 'How ICE uses artificial intelligence to track and arrest immigrants', url: 'https://www.hrw.org/news/2024/03/14/us-using-predictive-algorithms-target-immigrants', published_at: '2026-05-14T12:00:00.000Z', source: 'HRW', sid: 'hrw' },
  { title: 'Automated apartheid: facial recognition at West Bank checkpoints', url: 'https://www.hrw.org/report/2021/04/27/threshold-crossed/israeli-authorities-and-crimes-apartheid-and-persecution', published_at: '2026-05-10T12:00:00.000Z', source: 'HRW', sid: 'hrw' },
  { title: 'Bias in criminal sentencing algorithms: a systematic review', url: 'https://arxiv.org/search/?query=sentencing+algorithm+racial+bias', published_at: '2026-05-09T12:00:00.000Z', source: 'arXiv cs.AI', sid: 'arxiv' },
  { title: 'DARPA\'s autonomous swarm programmes and the absence of legal review', url: 'https://arxiv.org/search/?query=DARPA+autonomous+swarm+LAWS', published_at: '2026-05-08T12:00:00.000Z', source: 'arXiv cs.AI', sid: 'arxiv' },
  { title: 'Social credit systems and their impact on fundamental rights', url: 'https://www.hrw.org/news/2022/07/26/china-social-media-surveillance-minorities', published_at: '2026-05-07T12:00:00.000Z', source: 'HRW', sid: 'hrw' },
  { title: 'Lethal autonomous weapons: the case for a binding international prohibition', url: 'https://www.aljazeera.com/news/2023/10/12/killer-robots-campaign-against-lethal-autonomous-weapons', published_at: '2026-05-06T12:00:00.000Z', source: 'Al Jazeera', sid: 'aje' },
  { title: 'Deep learning approaches to target identification: ethical constraints', url: 'https://arxiv.org/search/?query=deep+learning+target+identification+ethics', published_at: '2026-05-05T12:00:00.000Z', source: 'arXiv cs.AI', sid: 'arxiv' }
];

export function parseRssXml(xmlText, src) {
  const items = [];
  // Match <item>...</item> or <entry>...</entry>
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
      
      items.push({
        id,
        title: title.substring(0, 200),
        url: link,
        source: src.name,
        sid: src.id,
        published_at: isoDate
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
