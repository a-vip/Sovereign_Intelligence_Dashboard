import { NextResponse } from 'next/server';
import { resolveApiAccess } from '@/lib/apiAuth';
import { getEvents } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { getJurisdictionBySlug, eventMatchesJurisdiction } from '@/lib/jurisdictions';
import { computeAdmiraltyGrade, computeContentHash, normalizeSignalId } from '@/lib/provenance';
import { classifyMitRiskDomain } from '@/lib/mitRiskTaxonomy';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(request) {
  try {
    const access = await resolveApiAccess(request);
    const { searchParams } = new URL(request.url);

    const jurisdictionParam = (searchParams.get('jurisdiction') || '').trim();
    const pillarParam = (searchParams.get('pillar') || '').trim().toLowerCase();
    const minSeverity = Math.min(Math.max(parseInt(searchParams.get('minSeverity') || '1', 10) || 1, 1), 5);
    const requestedTimespan = (searchParams.get('timespan') || '21d').toLowerCase();
    const validTimespans = new Set(['7d', '21d', '90d', 'all']);
    const cleanTimespan = validTimespans.has(requestedTimespan) ? requestedTimespan : '21d';
    const effectiveTimespan =
      !access.allowFullHistory && (cleanTimespan === '90d' || cleanTimespan === 'all')
        ? '21d'
        : cleanTimespan;

    const requestedLimit = parseInt(searchParams.get('limit') || '15', 10) || 15;
    const limit = Math.min(Math.max(requestedLimit, 1), access.maxLimit);
    const format = (searchParams.get('format') || 'json').toLowerCase() === 'geojson' ? 'geojson' : 'json';

    const [dbEvents, curatedEvents] = await Promise.all([
      getEvents(effectiveTimespan).catch(() => []),
      Promise.resolve(getStopKillerRobotsSignals() || [])
    ]);

    const seen = new Set();
    const merged = [];
    for (const ev of [...(curatedEvents || []), ...(dbEvents || [])]) {
      const cleanId = normalizeSignalId(ev?.id);
      if (!cleanId || seen.has(cleanId)) continue;
      seen.add(cleanId);
      merged.push({ ...ev, cleanId });
    }

    const jurisdictionObj = jurisdictionParam ? getJurisdictionBySlug(jurisdictionParam) : null;

    const filtered = merged.filter((ev) => {
      const sev = Number(ev.severity) || 2;
      if (sev < minSeverity) return false;

      if (jurisdictionParam) {
        if (jurisdictionObj) {
          if (!eventMatchesJurisdiction(ev, jurisdictionObj)) return false;
        } else {
          const hay = `${ev.location || ''} ${ev.title || ''} ${ev.details?.summary || ''}`.toLowerCase();
          if (!hay.includes(jurisdictionParam.toLowerCase())) return false;
        }
      }

      if (pillarParam) {
        const pillarHay = `${ev.details?.domainPillar || ''} ${ev.category || ''}`.toLowerCase();
        if (!pillarHay.includes(pillarParam)) return false;
      }

      return true;
    });

    filtered.sort(
      (a, b) =>
        new Date(b.original_post_time || b.timestamp || 0).getTime() -
        new Date(a.original_post_time || a.timestamp || 0).getTime()
    );

    const sliced = filtered.slice(0, limit).map((ev) => {
      const adm = computeAdmiraltyGrade(ev);
      const mit = classifyMitRiskDomain(ev.title || '', ev.details?.summary || '', ev.details?.domainPillar || '');
      const sha256 = computeContentHash(ev);
      const lat = ev.lat !== null && ev.lat !== undefined ? Number(ev.lat) : null;
      const lon = ev.lon !== null && ev.lon !== undefined ? Number(ev.lon) : null;
      const isoTimestamp = ev.original_post_time || ev.timestamp
        ? new Date(ev.original_post_time || ev.timestamp).toISOString()
        : null;

      return {
        id: ev.cleanId,
        title: ev.title,
        category: ev.category || 'Political',
        pillar: ev.details?.domainPillar || ev.category || 'AI Governance & Policy',
        severity: Number(ev.severity) || 2,
        location: ev.location || 'Global / Multilateral',
        coordinates: {
          lat: Number.isFinite(lat) ? lat : null,
          lon: Number.isFinite(lon) ? lon : null
        },
        timestamp: isoTimestamp,
        source: ev.details?.source || ev.source || 'Sovereign OSINT',
        url: ev.url || null,
        permalink: `https://app.sovdash.com/signal/${encodeURIComponent(ev.cleanId)}`,
        lifecycleState: ev.lifecycle_state || 'active',
        admiralty: {
          grade: adm.grade,
          label: adm.label
        },
        mitRisk: {
          code: mit.code,
          domain: mit.domain
        },
        sha256,
        summary: ev.details?.summary || ''
      };
    });

    const meta = {
      apiVersion: '1.0',
      tier: access.tier,
      timespan: effectiveTimespan,
      requestedTimespan: cleanTimespan,
      totalMatched: filtered.length,
      returned: sliced.length,
      maxLimit: access.maxLimit,
      generatedAt: new Date().toISOString()
    };

    if (!access.allowFullHistory && (cleanTimespan === '90d' || cleanTimespan === 'all')) {
      meta.tierNotice =
        'Upgrade with a Sovereign Pro/Enterprise license key (Authorization: Bearer SOV-...) for 90d/all archive access and up to 250 records per call.';
    }

    if (format === 'geojson') {
      const features = sliced
        .filter((item) => Number.isFinite(item.coordinates.lat) && Number.isFinite(item.coordinates.lon))
        .map((item) => ({
          type: 'Feature',
          id: item.id,
          geometry: {
            type: 'Point',
            coordinates: [item.coordinates.lon, item.coordinates.lat]
          },
          properties: {
            id: item.id,
            title: item.title,
            category: item.category,
            pillar: item.pillar,
            severity: item.severity,
            location: item.location,
            timestamp: item.timestamp,
            source: item.source,
            url: item.url,
            permalink: item.permalink,
            lifecycleState: item.lifecycleState,
            admiraltyGrade: item.admiralty.grade,
            mitRiskCode: item.mitRisk.code,
            mitRiskDomain: item.mitRisk.domain,
            sha256: item.sha256
          }
        }));

      return NextResponse.json(
        {
          type: 'FeatureCollection',
          metadata: meta,
          features
        },
        { headers: access.responseHeaders }
      );
    }

    return NextResponse.json(
      {
        meta,
        signals: sliced
      },
      { headers: access.responseHeaders }
    );
  } catch (error) {
    console.error('[/api/v1/signals] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal API error' }, { status: 500 });
  }
}
