import { NextResponse } from 'next/server';
import { extractSessionPayload } from '@/lib/adminAuth';
import { getWatchlists, saveWatchlist, deleteWatchlist, getEvents } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { matchEventsAgainstWatchlist, validateWebhookDestination } from '@/lib/watchlistMatcher';
import { normalizeSignalId } from '@/lib/provenance';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseKeywords(input) {
  if (Array.isArray(input)) {
    return input.map((k) => String(k).trim()).filter(Boolean).slice(0, 15);
  }
  return String(input || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 15);
}

function parseJurisdictions(input) {
  if (!Array.isArray(input)) return [];
  return input.map((j) => String(j).trim()).filter(Boolean).slice(0, 10);
}

export async function GET(request) {
  try {
    const session = extractSessionPayload(request);
    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get('scope') || '').toLowerCase();
    const queryEmail = (searchParams.get('email') || '').trim().toLowerCase();

    if (session?.role === 'admin' && scope === 'all') {
      const watchlists = await getWatchlists(null);
      return NextResponse.json({ success: true, watchlists });
    }

    const resolvedEmail = (session?.email || queryEmail || '').trim().toLowerCase();
    if (!resolvedEmail || !EMAIL_RE.test(resolvedEmail)) {
      return NextResponse.json({ success: true, watchlists: [] });
    }

    const watchlists = await getWatchlists(resolvedEmail);
    return NextResponse.json({ success: true, email: resolvedEmail, watchlists });
  } catch (error) {
    console.error('[/api/watchlists GET] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = extractSessionPayload(request);
    const body = await request.json().catch(() => ({}));

    const jurisdictions = parseJurisdictions(body.jurisdictions);
    const keywords = parseKeywords(body.keywords);
    const minSeverity = Math.min(Math.max(Number(body.minSeverity) || 3, 1), 5);

    if (body.action === 'test') {
      const [dbEvents, curatedEvents] = await Promise.all([
        getEvents('90d').catch(() => []),
        Promise.resolve(getStopKillerRobotsSignals() || [])
      ]);
      const seen = new Set();
      const pool = [];
      for (const ev of [...(curatedEvents || []), ...(dbEvents || [])]) {
        const cid = normalizeSignalId(ev?.id);
        if (!cid || seen.has(cid)) continue;
        seen.add(cid);
        pool.push({ ...ev, cleanId: cid });
      }
      const matches = matchEventsAgainstWatchlist({ jurisdictions, keywords, minSeverity }, pool);
      return NextResponse.json({
        success: true,
        matchedCount: matches.length,
        matches: matches.slice(0, 12).map((m) => ({
          id: m.cleanId || normalizeSignalId(m.id),
          title: m.title,
          severity: Number(m.severity) || 2,
          location: m.location || 'Global',
          source: m.details?.source || m.source || 'OSINT',
          timestamp: m.original_post_time || m.timestamp || null,
          permalink: `/signal/${encodeURIComponent(m.cleanId || normalizeSignalId(m.id))}`
        }))
      });
    }

    const name = String(body.name || '').trim();
    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { success: false, error: 'Watchlist name must be between 2 and 80 characters.' },
        { status: 400 }
      );
    }

    const ownerEmail = String(session?.email || body.ownerEmail || '').trim().toLowerCase();
    if (!EMAIL_RE.test(ownerEmail)) {
      return NextResponse.json(
        { success: false, error: 'A valid recipient email address is required.' },
        { status: 400 }
      );
    }

    const webhookUrl = String(body.webhookUrl || '').trim();
    if (webhookUrl) {
      const webhookCheck = validateWebhookDestination(webhookUrl);
      if (!webhookCheck.safe) {
        return NextResponse.json(
          { success: false, error: `Unsafe webhook URL rejected: ${webhookCheck.reason}` },
          { status: 400 }
        );
      }
    }

    if (session?.role !== 'admin' && !body.id) {
      const existing = await getWatchlists(ownerEmail);
      if (existing.length >= 5) {
        return NextResponse.json(
          { success: false, error: 'Free/guest watchlists are limited to 5 rules per email. Delete an existing rule first.' },
          { status: 400 }
        );
      }
    }

    const saved = await saveWatchlist({
      id: body.id || undefined,
      ownerEmail,
      name,
      jurisdictions,
      keywords,
      minSeverity,
      webhookUrl,
      emailAlerts: body.emailAlerts !== false,
      enabled: body.enabled !== false
    });

    const [dbEvents, curatedEvents] = await Promise.all([
      getEvents('90d').catch(() => []),
      Promise.resolve(getStopKillerRobotsSignals() || [])
    ]);
    const initialMatchesCount = matchEventsAgainstWatchlist(saved, [...(curatedEvents || []), ...(dbEvents || [])]).length;

    return NextResponse.json({
      success: true,
      watchlist: saved,
      initialMatchesCount
    });
  } catch (error) {
    console.error('[/api/watchlists POST] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = extractSessionPayload(request);
    const { searchParams } = new URL(request.url);
    const id = (searchParams.get('id') || '').trim();
    const emailParam = (searchParams.get('email') || '').trim().toLowerCase();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing watchlist id.' }, { status: 400 });
    }

    const ownerEmail = session?.role === 'admin' ? null : (session?.email || emailParam || null);
    if (session?.role !== 'admin' && !ownerEmail) {
      return NextResponse.json({ success: false, error: 'Owner email or session required to delete watchlist.' }, { status: 400 });
    }

    const result = await deleteWatchlist(id, ownerEmail);
    return NextResponse.json({ success: true, deleted: result.deleted });
  } catch (error) {
    console.error('[/api/watchlists DELETE] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
