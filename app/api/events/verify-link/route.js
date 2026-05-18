import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

// Path for local database files (used only in local dev environment when POSTGRES_URL is missing)
const LOCAL_EVENTS_FILE = path.resolve('events-local.json');

function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error(`Failed to read local file: ${filePath}`, e);
  }
  return [];
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Failed to write local file: ${filePath}`, e);
  }
}

const SCRAPER_BLOCKING_DOMAINS = [
  'reuters.com',
  'bloomberg.com',
  'nytimes.com',
  'wsj.com',
  'theguardian.com',
  'economist.com',
  'ft.com'
];

function isScraperBlockingDomain(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return SCRAPER_BLOCKING_DOMAINS.some(domain => hostname.includes(domain));
  } catch (e) {
    return false;
  }
}

async function verifyLink(url, title = '', source = '') {
  if (!url) return { active: false };
  
  // Strategy for domains protected by Datadome/Cloudflare
  if (isScraperBlockingDomain(url)) {
    console.log(`[Google News Verification Check]: ${url} matches CDN-protected publisher. Querying search index...`);
    try {
      const words = title.split(/\s+/).filter(Boolean);
      const keyPhrase = words.slice(0, 6).join(' ');
      const cleanPhrase = keyPhrase.replace(/[^\w\s-]/g, '').trim();
      
      if (cleanPhrase) {
        const query = `${cleanPhrase} ${source || ''}`;
        const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
        const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) });
        
        if (searchRes.ok) {
          const xml = await searchRes.text();
          const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
          
          for (const item of items) {
            const linkMatch = item.match(/<link>(.*?)<\/link>/);
            if (linkMatch) {
              const googleLink = linkMatch[1].trim();
              const resolvedUrl = await resolveGoogleNewsLink(googleLink);
              
              const origHost = new URL(url).hostname.toLowerCase().replace('www.', '');
              const newHost = new URL(resolvedUrl).hostname.toLowerCase().replace('www.', '');
              
              if (origHost === newHost || newHost.includes(origHost) || origHost.includes(newHost)) {
                console.log(`[Google News Verified]: Matching healthy article on ${newHost} -> ${resolvedUrl}`);
                return { active: true, url: resolvedUrl };
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Google News verification search failed, falling back to direct check:', e);
    }
    
    // Fallback: direct check but ignore 403 blocks since they could be active under real browsers
    try {
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(3000) });
      if (res.status === 404 || res.status === 410) return { active: false };
      return { active: true, url };
    } catch (e) {
      return { active: false };
    }
  }
  
  // Strategy for standard domains (direct fetch with soft-404 parsing)
  try {
    const res = await fetch(url, { 
      method: 'GET', 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(4000) 
    });
    
    if (res.status === 404 || res.status === 410) {
      return { active: false };
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
          console.warn(`Soft 404 indicator matched: "${indicator}" for url: ${url}. Marking as broken.`);
          return { active: false };
        }
      }
    }
    
    return { active: true, url };
  } catch (e) {
    return { active: false };
  }
}

async function resolveGoogleNewsLink(googleUrl) {
  try {
    const res = await fetch(googleUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(3000)
    });
    return res.url; // Following redirect automatically retrieves the direct canonical news publisher url
  } catch (e) {
    return googleUrl;
  }
}

async function findAlternativeLink(title, source) {
  const words = title.split(/\s+/).filter(Boolean);
  const keyPhrase = words.slice(0, 6).join(' ');
  const cleanPhrase = keyPhrase.replace(/[^\w\s-]/g, '').trim();
  
  // STRATEGY A: Google News RSS Search (High-authority news syndication index)
  try {
    if (cleanPhrase) {
      const query = `${cleanPhrase} ${source || ''}`;
      const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
      
      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) });
      if (searchRes.ok) {
        const xml = await searchRes.text();
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
        
        for (const item of items) {
          const linkMatch = item.match(/<link>(.*?)<\/link>/);
          if (linkMatch) {
            const googleLink = linkMatch[1].trim();
            console.log(`Resolving Google News search candidate: ${googleLink}`);
            const resolvedUrl = await resolveGoogleNewsLink(googleLink);
            const status = await verifyLink(resolvedUrl, title, source);
            if (status.active) {
              console.log(`Successfully verified alternative Google News source link: ${status.url}`);
              return status.url;
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Google News backup crawler error:', e);
  }

  // STRATEGY B: DuckDuckGo HTML Search Fallback
  try {
    if (cleanPhrase) {
      const query = `${cleanPhrase} ${source || ''}`;
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
        
        for (const link of links.slice(0, 5)) {
          const status = await verifyLink(link, title, source);
          if (status.active) {
            console.log(`Successfully verified alternative DuckDuckGo fallback link: ${status.url}`);
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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const url = searchParams.get('url');
  const title = searchParams.get('title');
  const source = searchParams.get('source');

  if (!url) {
    return NextResponse.json({ status: 'invalid', error: 'Missing URL parameter' }, { status: 400 });
  }

  try {
    const verification = await verifyLink(url, title || '', source || '');
    
    if (verification.active) {
      // If the link was resolved/healed to a healthy redirect URL on the same domain
      if (verification.url !== url) {
        if (id) {
          if (process.env.POSTGRES_URL) {
            await sql`UPDATE sigint_events SET url = ${verification.url} WHERE id = ${id}`;
          } else {
            const localEvents = readJsonFile(LOCAL_EVENTS_FILE);
            const updated = localEvents.map(e => e.id === id ? { ...e, url: verification.url } : e);
            writeJsonFile(LOCAL_EVENTS_FILE, updated);
          }
        }
        return NextResponse.json({ 
          status: 'healed', 
          originalUrl: url,
          url: verification.url, 
          message: 'Path pattern updated and self-healed successfully!' 
        });
      }
      
      return NextResponse.json({ 
        status: 'active', 
        url, 
        message: 'Link verified successfully' 
      });
    }

    // Link is broken, trigger self-healing backup finder!
    console.warn(`Link verification failed for: ${url}. Initiating self-healing search for title: ${title}`);
    const alternativeUrl = await findAlternativeLink(title || '', source || '');

    if (alternativeUrl) {
      // Update database row to persist the healed link!
      if (id) {
        if (process.env.POSTGRES_URL) {
          await sql`UPDATE sigint_events SET url = ${alternativeUrl} WHERE id = ${id}`;
        } else {
          const localEvents = readJsonFile(LOCAL_EVENTS_FILE);
          const updated = localEvents.map(e => e.id === id ? { ...e, url: alternativeUrl } : e);
          writeJsonFile(LOCAL_EVENTS_FILE, updated);
        }
      }

      return NextResponse.json({
        status: 'healed',
        originalUrl: url,
        url: alternativeUrl,
        message: 'Original link was broken (404/dead). Successfully self-healed and retrieved working press wire backup!'
      });
    }

    return NextResponse.json({
      status: 'broken',
      url,
      message: 'Original link is broken, and no automated alternative source could be verified at this time.'
    });

  } catch (error) {
    console.error('Link verification API error:', error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
