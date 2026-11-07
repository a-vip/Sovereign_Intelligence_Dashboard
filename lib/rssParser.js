import crypto from 'crypto';
import { geocodeText, decodeHtmlEntities } from './geocoder.js';
import { classifyTechPolicySignal } from './policyClassifier.js';
import { getCustomSources } from './db.js';

/**
 * Built-in International AI, Cyber & Tech Policy Sources
 */
export const RSS_SOURCES = [
  {
    id: 'cisa',
    name: 'CISA Cyber Advisories',
    url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml',
    region: 'Americas',
    pillar: 'Cyber & Espionage'
  },
  {
    id: 'thn',
    name: 'The Hacker News',
    url: 'https://feeds.feedburner.com/TheHackersNews',
    region: 'Global',
    pillar: 'Cyber & Espionage'
  },
  {
    id: 'row',
    name: 'Rest of World Tech',
    url: 'https://restofworld.org/feed/latest/',
    region: 'Global South',
    pillar: 'AI Governance & Policy'
  },
  {
    id: 'mittr',
    name: 'MIT Tech Review AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    region: 'Global',
    pillar: 'AI Governance & Policy'
  },
  {
    id: 'wired',
    name: 'Wired Security & Policy',
    url: 'https://www.wired.com/feed/category/security/latest/rss',
    region: 'Global',
    pillar: 'Cyber & Espionage'
  },
  {
    id: 'eff',
    name: 'EFF Digital Rights',
    url: 'https://www.eff.org/rss/updates.xml',
    region: 'Global',
    pillar: 'Digital Rights & Surveillance'
  },
  {
    id: 'arxiv',
    name: 'arXiv Computers & Society',
    url: 'https://export.arxiv.org/rss/cs.CY',
    region: 'Academic',
    pillar: 'AI Governance & Policy'
  },
  {
    id: 'nature',
    name: 'Nature Machine Intelligence',
    url: 'https://www.nature.com/natmachintell.rss',
    region: 'Academic',
    pillar: 'AI Governance & Policy'
  },
  {
    id: 'hrw',
    name: 'HRW Tech & Rights',
    url: 'https://www.hrw.org/rss/news',
    region: 'Global',
    pillar: 'Digital Rights & Surveillance'
  },
  {
    id: 'aje',
    name: 'Al Jazeera Tech Wire',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    region: 'Global',
    pillar: 'Global Wire (Filtered)'
  },
  {
    id: 'un',
    name: 'UN Global Tech & Peace',
    url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
    region: 'Multilateral',
    pillar: 'Multilateral Policy'
  }
];

/**
 * One-Click Curated International Tech Policy & Cyber Directory
 * Operators can add any of these (or any custom RSS/Atom URL) via the Source Manager UI.
 */
export const CURATED_SOURCE_CATALOG = [
  {
    sid: 'uk-ncsc',
    name: 'UK NCSC Threat Advisories',
    url: 'https://www.ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml',
    categoryHint: 'Surveillance',
    description: 'Official UK National Cyber Security Centre threat intelligence, APT advisories, and sovereign AI security guidance.',
    region: 'UK / Europe'
  },
  {
    sid: 'citizenlab',
    name: 'The Citizen Lab (Toronto)',
    url: 'https://citizenlab.ca/feed/',
    categoryHint: 'Surveillance',
    description: 'Academic investigations into commercial spyware (Pegasus/Predator), transnational digital repression, and censorship.',
    region: 'Academic / Global'
  },
  {
    sid: 'theregister-sec',
    name: 'The Register Cyber & Policy',
    url: 'https://www.theregister.com/security/headlines.atom',
    categoryHint: 'Political',
    description: 'International AI regulation, semiconductor geopolitics, sovereign cloud policy, and cyber operations.',
    region: 'Europe / Global'
  },
  {
    sid: 'bleepingcomputer',
    name: 'BleepingComputer Security',
    url: 'https://www.bleepingcomputer.com/feed/',
    categoryHint: 'Surveillance',
    description: 'Real-time ransomware disclosures, state APT campaigns, and critical zero-day advisories.',
    region: 'Global'
  },
  {
    sid: 'accessnow',
    name: 'Access Now Digital Rights',
    url: 'https://www.accessnow.org/feed/',
    categoryHint: 'Humanitarian',
    description: 'Internet shutdown tracker, biometric surveillance resistance, and Global South digital rights.',
    region: 'Global South'
  },
  {
    sid: 'darkreading',
    name: 'Dark Reading Threat Intel',
    url: 'https://www.darkreading.com/rss.xml',
    categoryHint: 'Surveillance',
    description: 'Enterprise & critical infrastructure cyber threat intelligence and nation-state espionage.',
    region: 'Global'
  },
  {
    sid: 'arstechnica-policy',
    name: 'Ars Technica Tech Policy',
    url: 'https://feeds.arstechnica.com/arstechnica/tech-policy',
    categoryHint: 'Political',
    description: 'Antitrust litigation, telecom & spectrum policy, encryption law, and AI copyright rulings.',
    region: 'Americas / Europe'
  },
  {
    sid: 'krebsonsecurity',
    name: 'Krebs on Security',
    url: 'https://krebsonsecurity.com/feed/',
    categoryHint: 'Surveillance',
    description: 'In-depth cybercrime investigations, telecom breaches, and international threat actor attribution.',
    region: 'Global'
  }
];

/**
 * SSRF Guard — Rejects loopback, private RFC1918, cloud metadata, and non-HTTP(S) URLs.
 */
export function isSafeFeedUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || '').trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: 'Only http:// and https:// feed URLs are permitted.' };
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '[::1]' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host.endsWith('.localhost')
    ) {
      return { safe: false, reason: 'Local or internal hostnames are blocked.' };
    }

    // Block private IPv4 blocks
    const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      if (
        a === 10 ||
        a === 127 ||
        a === 0 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 100 && b >= 64 && b <= 127)
      ) {
        return { safe: false, reason: 'Private or link-local IP ranges are blocked.' };
      }
    }

    return { safe: true, url: parsed.toString() };
  } catch {
    return { safe: false, reason: 'Invalid URL syntax.' };
  }
}

export const RSS_FALLBACK = [
  {
    id: 'fb-eu-ai-office-brussels',
    title: 'European AI Office Enforces General-Purpose AI Code of Practice Under EU AI Act',
    url: 'https://digital-strategy.ec.europa.eu/en/policies/ai-office',
    source: 'EU AI Office',
    sid: 'eff',
    location: 'Brussels, Belgium',
    latitude: 50.8503,
    longitude: 4.3517,
    category: 'Political',
    severity: 3,
    summary: 'European Commission regulators in Brussels establish binding transparency, systemic-risk evaluation, and copyright compliance obligations for frontier AI providers.',
    published_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'fb-un-laws-geneva',
    title: 'UN Group of Governmental Experts Advances Binding Instrument on Lethal Autonomous Weapons',
    url: 'https://disarmament.unoda.org/the-convention-on-certain-conventional-weapons/background-on-laws-in-the-ccw/',
    source: 'UN Global Tech & Peace',
    sid: 'un',
    location: 'Geneva, Switzerland',
    latitude: 46.2044,
    longitude: 6.1432,
    category: 'Conflict',
    severity: 4,
    summary: 'Diplomatic delegations in Geneva negotiate two-tier prohibitions and meaningful human control mandates over AI-enabled battlefield targeting systems.',
    published_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'fb-cisa-telecom-washington',
    title: 'CISA Issues Emergency Directive on State-Sponsored Telecom Infrastructure Intrusions',
    url: 'https://www.cisa.gov/cybersecurity-advisories',
    source: 'CISA Cyber Advisories',
    sid: 'cisa',
    location: 'Washington D.C., USA',
    latitude: 38.9072,
    longitude: -77.0369,
    category: 'Surveillance',
    severity: 4,
    summary: 'US federal cybersecurity officials warn telecom carriers to harden routing infrastructure and lawful-intercept interfaces against persistent APT espionage.',
    published_at: new Date(Date.now() - 3600000 * 7).toISOString()
  },
  {
    id: 'fb-uk-aisi-london',
    title: 'UK AI Security Institute Publishes Pre-Deployment Frontier Model Red-Teaming Protocol',
    url: 'https://www.aisi.gov.uk/',
    source: 'MIT Tech Review AI',
    sid: 'mittr',
    location: 'London, UK',
    latitude: 51.5074,
    longitude: -0.1278,
    category: 'Political',
    severity: 3,
    summary: 'Researchers in London and Cambridge evaluate autonomous cyber-offense capabilities and bio-risk safeguards across next-generation reasoning models.',
    published_at: new Date(Date.now() - 3600000 * 9).toISOString()
  },
  {
    id: 'fb-tsmc-hsinchu-export',
    title: 'Taiwan Tightens Advanced 2nm Semiconductor Foundry Controls Amid Compute Rivalry',
    url: 'https://restofworld.org/',
    source: 'Rest of World Tech',
    sid: 'row',
    location: 'Hsinchu, Taiwan',
    latitude: 24.8138,
    longitude: 120.9675,
    category: 'Economic',
    severity: 3,
    summary: 'Export compliance screening expands across Hsinchu wafer fabrication supply chains to prevent unauthorized diversion of frontier AI accelerators.',
    published_at: new Date(Date.now() - 3600000 * 11).toISOString()
  },
  {
    id: 'fb-seoul-ai-basic-act',
    title: 'South Korea Implements National AI Basic Act and High-Impact Algorithmic Audit Rules',
    url: 'https://restofworld.org/',
    source: 'Rest of World Tech',
    sid: 'row',
    location: 'Seoul, South Korea',
    latitude: 37.5665,
    longitude: 126.9780,
    category: 'Political',
    severity: 3,
    summary: 'Legislators in Seoul mandate watermarking for generative AI outputs and safety oversight for high-impact public-sector and healthcare algorithms.',
    published_at: new Date(Date.now() - 3600000 * 14).toISOString()
  },
  {
    id: 'fb-brasilia-ai-bill',
    title: 'Brazil Federal Senate Advances Risk-Based AI Governance & Algorithmic Rights Framework',
    url: 'https://www.eff.org/',
    source: 'EFF Digital Rights',
    sid: 'eff',
    location: 'Brasília, Brazil',
    latitude: -15.7975,
    longitude: -47.8919,
    category: 'Political',
    severity: 3,
    summary: 'Lawmakers in Brasília debate strict restrictions on real-time public facial recognition alongside statutory remuneration for copyrighted AI training datasets.',
    published_at: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'fb-nairobi-data-sovereignty',
    title: 'Kenya Data Protection Commissioner Audits Biometric Identity & Sovereign Cloud Providers',
    url: 'https://restofworld.org/',
    source: 'Rest of World Tech',
    sid: 'row',
    location: 'Nairobi, Kenya',
    latitude: -1.2921,
    longitude: 36.8219,
    category: 'Humanitarian',
    severity: 3,
    summary: 'Regulators in Nairobi enforce strict biometric consent and cross-border data transfer safeguards following civil-society challenges to digital ID rollouts.',
    published_at: new Date(Date.now() - 3600000 * 21).toISOString()
  }
];

/**
 * Extracts <item> (RSS 2.0 / RDF) or <entry> (Atom) blocks from XML feed text.
 */
function parseXmlEntries(xmlText) {
  const entries = [];
  if (!xmlText || typeof xmlText !== 'string') return entries;

  const itemBlocks = xmlText.match(/<(item|entry)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi) || [];

  for (const block of itemBlocks) {
    const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const rawTitle = titleMatch ? decodeHtmlEntities(titleMatch[1]) : '';
    if (!rawTitle) continue;

    // Resolve link: Atom <link href="..."/> or RSS <link>...</link> or <guid isPermaLink="true">
    let link = '';
    const atomHrefMatch = block.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i) ||
                          block.match(/<link[^>]+href=["']([^"']+)["']/i);
    const rssLinkMatch = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const guidMatch = block.match(/<guid[^>]*>(https?:\/\/[^<\s]+)<\/guid>/i);

    if (atomHrefMatch && atomHrefMatch[1]) {
      link = decodeHtmlEntities(atomHrefMatch[1]);
    } else if (rssLinkMatch && rssLinkMatch[1]) {
      link = decodeHtmlEntities(rssLinkMatch[1]);
    } else if (guidMatch && guidMatch[1]) {
      link = decodeHtmlEntities(guidMatch[1]);
    }

    if (!link || !/^https?:\/\//i.test(link)) continue;

    const descMatch =
      block.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ||
      block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) ||
      block.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i) ||
      block.match(/<content[^>]*>([\s\S]*?)<\/content>/i);

    const cleanSummary = descMatch ? decodeHtmlEntities(descMatch[1]).slice(0, 380) : '';

    const pubMatch =
      block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
      block.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i) ||
      block.match(/<published[^>]*>([\s\S]*?)<\/published>/i) ||
      block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i);

    let publishedAt = new Date().toISOString();
    if (pubMatch && pubMatch[1]) {
      const parsedDate = new Date(decodeHtmlEntities(pubMatch[1]));
      if (!isNaN(parsedDate.getTime())) {
        const now = Date.now();
        publishedAt = parsedDate.getTime() > now + 3600000 ? new Date(now).toISOString() : parsedDate.toISOString();
      }
    }

    entries.push({
      title: rawTitle,
      url: link.trim(),
      summary: cleanSummary,
      published_at: publishedAt
    });
  }

  return entries;
}

/**
 * Fetches, parses, strictly filters for AI/Cyber/Tech Policy relevance, and geocodes a single RSS/Atom source.
 */
export async function fetchAndParseFeedSource(source, maxItems = 18) {
  const sid = source.sid || source.id || 'custom';
  const sourceName = source.name || 'Custom OSINT Feed';
  const safety = isSafeFeedUrl(source.url);
  if (!safety.safe) {
    throw new Error(safety.reason);
  }

  const response = await fetch(safety.url, {
    headers: {
      'User-Agent': 'SovereignIntelligence/2.4 (+https://app.sovdash.com; Academic & Policy OSINT Aggregator)',
      'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
    },
    signal: AbortSignal.timeout(6500),
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Feed HTTP ${response.status}`);
  }

  const xmlText = await response.text();
  const rawEntries = parseXmlEntries(xmlText);

  const relevantItems = [];
  const geoPinnedEvents = [];

  for (const entry of rawEntries) {
    if (relevantItems.length >= maxItems) break;

    // 1. Strict International AI, Cyber & Tech Policy Gate
    const cls = classifyTechPolicySignal(entry.title, entry.summary, sid, source.keywords || []);
    if (!cls.isRelevant) continue;

    // 2. Position-Aware International Geocoding (NO fake publisher HQ coordinates!)
    const geo = geocodeText(entry.title, entry.summary, sid);
    const idHash = crypto.createHash('md5').update(entry.url).digest('hex');

    const category = cls.category || source.categoryHint || 'Political';
    const rssRecord = {
      id: idHash,
      title: entry.title,
      url: entry.url,
      source: sourceName,
      sid,
      location: geo.hasExplicitLocation ? geo.name : 'Global / Multilateral',
      latitude: geo.hasExplicitLocation ? geo.lat : null,
      longitude: geo.hasExplicitLocation ? geo.lon : null,
      category,
      severity: cls.severity,
      summary: entry.summary,
      domainPillar: cls.domainPillar,
      hasExplicitLocation: geo.hasExplicitLocation,
      published_at: entry.published_at
    };

    relevantItems.push(rssRecord);

    // 3. Auto-Pin to Globe ONLY when a genuine international/sovereign location is verified!
    if (geo.hasExplicitLocation && geo.lat !== null && geo.lon !== null) {
      geoPinnedEvents.push({
        id: `rss-${idHash}`,
        title: entry.title,
        category,
        severity: cls.severity,
        location: geo.name,
        lat: geo.lat,
        lon: geo.lon,
        timestamp: entry.published_at,
        original_post_time: entry.published_at,
        url: entry.url,
        source: sourceName,
        details: {
          summary: entry.summary || `Verified ${cls.domainPillar} signal from ${sourceName}.`,
          source: sourceName,
          sid,
          domainPillar: cls.domainPillar,
          region: geo.region,
          isRssAutoPin: true,
          verificationStatus: 'active'
        }
      });
    }
  }

  return {
    fetchedCount: rawEntries.length,
    relevantItems,
    geoPinnedEvents
  };
}

/**
 * Scrapes all built-in international AI/Cyber/Tech Policy sources PLUS all operator-added custom sources.
 */
export async function scrapeAllRss() {
  let customSources = [];
  try {
    const dbCustom = await getCustomSources();
    customSources = (dbCustom || []).filter(s => s.enabled !== false);
  } catch (e) {
    console.warn('Could not load custom_sources during scrapeAllRss:', e.message);
  }

  // Merge built-in + custom sources (deduplicating by URL)
  const seenUrls = new Set();
  const allSources = [];
  for (const s of [...RSS_SOURCES, ...customSources]) {
    const normUrl = String(s.url || '').trim().toLowerCase();
    if (!normUrl || seenUrls.has(normUrl)) continue;
    seenUrls.add(normUrl);
    allSources.push(s);
  }

  const settled = await Promise.allSettled(
    allSources.map(source => fetchAndParseFeedSource(source, 14))
  );

  const mergedRss = [];
  const seenArticleUrls = new Set();

  for (const res of settled) {
    if (res.status === 'fulfilled' && res.value?.relevantItems) {
      for (const item of res.value.relevantItems) {
        if (!seenArticleUrls.has(item.url)) {
          seenArticleUrls.add(item.url);
          mergedRss.push(item);
        }
      }
    }
  }

  mergedRss.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  return mergedRss;
}
