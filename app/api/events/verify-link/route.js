import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';
import { verifyLink, findAlternativeLink } from '@/lib/verification';

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

async function updateEventStatus(id, finalUrl, status, originalUrl = null) {
  if (!id) return;
  try {
    if (process.env.POSTGRES_URL) {
      const dbRes = await sql`SELECT details FROM sigint_events WHERE id = ${id}`;
      if (dbRes.rows && dbRes.rows.length > 0) {
        const existingDetails = dbRes.rows[0].details || {};
        existingDetails.verificationStatus = status;
        if (originalUrl) {
          existingDetails.originalUrl = originalUrl;
        }
        await sql`UPDATE sigint_events SET url = ${finalUrl}, details = ${existingDetails} WHERE id = ${id}`;
      }
    } else {
      const localEvents = readJsonFile(LOCAL_EVENTS_FILE);
      const updated = localEvents.map(e => {
        if (e.id === id) {
          const details = e.details || {};
          details.verificationStatus = status;
          if (originalUrl) {
            details.originalUrl = originalUrl;
          }
          return { ...e, url: finalUrl, details };
        }
        return e;
      });
      writeJsonFile(LOCAL_EVENTS_FILE, updated);
    }
  } catch (err) {
    console.error(`Failed to cache verification status for event id ${id}:`, err);
  }
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
    // 1. Check cache first to avoid slow HTTP calls on subsequent clicks!
    let cachedStatus = null;
    let cachedUrl = null;
    
    if (id) {
      if (process.env.POSTGRES_URL) {
        const dbRes = await sql`SELECT url, details FROM sigint_events WHERE id = ${id}`;
        if (dbRes.rows && dbRes.rows.length > 0) {
          const row = dbRes.rows[0];
          cachedStatus = row.details?.verificationStatus;
          cachedUrl = row.url;
        }
      } else {
        const localEvents = readJsonFile(LOCAL_EVENTS_FILE);
        const ev = localEvents.find(e => e.id === id);
        if (ev) {
          cachedStatus = ev.details?.verificationStatus;
          cachedUrl = ev.url;
        }
      }
    }

    if (cachedStatus && cachedStatus !== 'pending') {
      console.log(`[Cache Hit] Serving pre-verified link status: ${cachedStatus} for id: ${id}`);
      return NextResponse.json({
        status: cachedStatus,
        url: cachedUrl || url,
        message: 'Link verification served directly from persistent secure database cache.'
      });
    }

    // 2. Perform live verification check
    const verification = await verifyLink(url, title || '', source || '');
    
    if (verification.active) {
      const isHealed = verification.url !== url;
      const finalStatus = isHealed ? 'healed' : 'active';
      
      if (id) {
        await updateEventStatus(id, verification.url, finalStatus, isHealed ? url : null);
      }

      return NextResponse.json({ 
        status: finalStatus, 
        originalUrl: url,
        url: verification.url, 
        message: isHealed ? 'Path pattern updated and self-healed successfully!' : 'Link verified successfully'
      });
    }

    // 3. Link is broken, trigger self-healing backup finder!
    console.warn(`Link verification failed for: ${url}. Initiating self-healing search for title: ${title}`);
    const alternativeUrl = await findAlternativeLink(title || '', source || '');

    if (alternativeUrl) {
      if (id) {
        await updateEventStatus(id, alternativeUrl, 'healed', url);
      }

      return NextResponse.json({
        status: 'healed',
        originalUrl: url,
        url: alternativeUrl,
        message: 'Original link was broken (404/dead). Successfully self-healed and retrieved working press wire backup!'
      });
    }

    // 4. Broken and unhealable
    if (id) {
      await updateEventStatus(id, url, 'broken');
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
