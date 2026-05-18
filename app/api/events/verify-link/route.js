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

async function verifyLink(url) {
  if (!url) return false;
  try {
    // Some websites block HEAD requests, so we fall back to GET
    const res = await fetch(url, { 
      method: 'GET', 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(3000) 
    });
    
    // 404 is a definitive failure. 403 or 401 might mean paywall or anti-scraping but link is active
    const okStatuses = new Set([200, 301, 302, 403, 401]);
    return okStatuses.has(res.status);
  } catch (e) {
    return false;
  }
}

async function findAlternativeLink(title, source) {
  try {
    // Construct search query
    const cleanTitle = title.replace(/[^\w\s-]/g, '').trim();
    const query = `${cleanTitle} ${source || ''}`;
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(4000)
    });
    
    if (!searchRes.ok) return null;
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
    
    // Test alternative links to find first active one
    for (const link of links.slice(0, 5)) {
      const isWorking = await verifyLink(link);
      if (isWorking) {
        return link;
      }
    }
  } catch (e) {
    console.error('Alternative link search error:', e);
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
    const isLinkActive = await verifyLink(url);
    
    if (isLinkActive) {
      return NextResponse.json({ 
        status: 'active', 
        url, 
        message: 'Link verified successfully' 
      });
    }

    // Link is 404 or dead, trigger self-healing backup finder!
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
