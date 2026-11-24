const SCRAPER_BLOCKING_DOMAINS = [
  'reuters.com',
  'bloomberg.com',
  'nytimes.com',
  'wsj.com',
  'theguardian.com',
  'economist.com',
  'ft.com'
];

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'over', 'under', 'after', 'amid',
  'new', 'law', 'act', 'policy', 'national', 'global', 'state', 'public', 'high',
  'risk', 'based', 'artificial', 'intelligence', 'governance', 'strategy', 'framework',
  'system', 'systems', 'model', 'models', 'data', 'digital', 'report', 'update',
  'news', 'home', 'welcome', 'portal', 'official', 'website', 'ministry', 'government'
]);

export function isGenericHomepageUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.hostname.includes('news.google.com')) return true;
    if (rawUrl.includes('?ref=')) return true;
    const cleanPath = u.pathname.replace(/\/+$/, '').toLowerCase();
    if (
      !cleanPath ||
      cleanPath === '' ||
      cleanPath === '/en' ||
      cleanPath === '/eng' ||
      cleanPath === '/pt-br' ||
      cleanPath === '/en/tech' ||
      cleanPath === '/news' ||
      cleanPath === '/resources' ||
      cleanPath === '/get-involved' ||
      cleanPath === '/eng/index.do' ||
      cleanPath === '/radar'
    ) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

function extractSubstantiveTokens(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

function extractHtmlTitle(html) {
  if (!html) return '';
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (og?.[1]) return og[1].trim();
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return t?.[1] ? t[1].replace(/\s+/g, ' ').trim() : '';
}

export function hasTopicalRelevance(candidateUrl, candidatePageTitle, expectedTitle) {
  if (!candidateUrl || isGenericHomepageUrl(candidateUrl)) return false;
  const expectedTokens = extractSubstantiveTokens(expectedTitle);
  if (expectedTokens.length === 0) return true;

  let slugText = '';
  try {
    slugText = new URL(candidateUrl).pathname.replace(/[^a-z0-9]+/gi, ' ').toLowerCase();
  } catch {}
  const hay = `${String(candidatePageTitle || '').toLowerCase()} ${slugText}`;
  let hits = 0;
  for (const tok of expectedTokens) {
    if (hay.includes(tok)) hits++;
  }
  const minRequired = Math.min(2, expectedTokens.length);
  return hits >= minRequired;
}

function isScraperBlockingDomain(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return SCRAPER_BLOCKING_DOMAINS.some(domain => hostname.includes(domain));
  } catch (e) {
    return false;
  }
}

export async function resolveGoogleNewsLink(googleUrl) {
  try {
    const res = await fetch(googleUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(3500)
    });
    if (res.url && !res.url.includes('news.google.com') && !res.url.includes('consent.google.com')) {
      return res.url;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function verifyLink(url, title = '', source = '') {
  if (!url) return { active: false };
  if (isGenericHomepageUrl(url)) {
    return { active: false, reason: 'generic_homepage' };
  }

  // Strategy for domains protected by Datadome/Cloudflare
  if (isScraperBlockingDomain(url)) {
    try {
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(3500) });
      if (res.status === 404 || res.status === 410) return { active: false };
      return { active: true, url };
    } catch (e) {
      return { active: false };
    }
  }

  // Strategy for standard domains (direct fetch with soft-404 + topical title check)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(4500)
    });

    if (res.status === 404 || res.status === 410 || res.status >= 500) {
      return { active: false };
    }

    const finalUrl = res.url || url;
    if (isGenericHomepageUrl(finalUrl)) {
      return { active: false, reason: 'redirected_to_homepage' };
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const htmlText = await res.text();
      const lowerText = htmlText.toLowerCase();

      const soft404Indicators = [
        "we can't find that page",
        "page not found",
        "404 page not found",
        "article not found",
        "404 error",
        "page not exist",
        "page could not be found",
        "error-404",
        "soft 404",
        "reuters.com/errors/404"
      ];

      for (const indicator of soft404Indicators) {
        if (lowerText.includes(indicator)) {
          return { active: false };
        }
      }

      const pageTitle = extractHtmlTitle(htmlText);
      return { active: true, url: finalUrl, pageTitle };
    }

    return { active: true, url: finalUrl };
  } catch (e) {
    return { active: false };
  }
}

export async function findAlternativeLink(title, source) {
  if (!title || String(title).trim().length < 12) return null;
  const words = title.split(/\s+/).filter(Boolean);
  const keyPhrase = words.slice(0, 8).join(' ');
  const cleanPhrase = keyPhrase.replace(/[^\w\s-]/g, '').trim();

  // STRATEGY A: Google News RSS Search — STRICTLY verified for topical overlap & real publisher redirect
  try {
    if (cleanPhrase) {
      const query = `${cleanPhrase} ${source || ''}`.trim();
      const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) });
      if (searchRes.ok) {
        const xml = await searchRes.text();
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

        for (const item of items.slice(0, 5)) {
          const linkMatch = item.match(/<link>(.*?)<\/link>/);
          const itemTitleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
          const rssTitle = itemTitleMatch ? itemTitleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
          if (linkMatch) {
            const googleLink = linkMatch[1].trim();
            const resolvedUrl = await resolveGoogleNewsLink(googleLink);
            if (!resolvedUrl) continue;
            const status = await verifyLink(resolvedUrl, title, source);
            if (status.active && hasTopicalRelevance(status.url, status.pageTitle || rssTitle, title)) {
              return status.url;
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Google News backup crawler error:', e);
  }

  // STRATEGY B: DuckDuckGo HTML Search Fallback — STRICTLY verified for topical keyword overlap
  try {
    if (cleanPhrase) {
      const query = `${cleanPhrase} ${source || ''}`.trim();
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

      const searchRes = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(4000)
      });

      if (searchRes.ok) {
        const html = await searchRes.text();
        const links = [];
        const regex = /uddg=([^&"]+)/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
          try {
            const decoded = decodeURIComponent(match[1]);
            if (decoded.startsWith('http') && !decoded.includes('duckduckgo.com') && !decoded.includes('wikipedia.org')) {
              links.push(decoded);
            }
          } catch (e) {}
        }

        for (const link of links.slice(0, 6)) {
          const status = await verifyLink(link, title, source);
          if (status.active && hasTopicalRelevance(status.url, status.pageTitle, title)) {
            return status.url;
          }
        }
      }
    }
  } catch (e) {
    console.error('DuckDuckGo fallback search error:', e);
  }

  return null;
}
