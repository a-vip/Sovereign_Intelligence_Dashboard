import { JURISDICTIONS } from '@/lib/jurisdictions';
import { getEvents } from '@/lib/db';
import { getStopKillerRobotsSignals } from '@/lib/researchFunnel';
import { normalizeSignalId } from '@/lib/provenance';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const baseUrl = 'https://app.sovdash.com';
  const now = new Date();

  const staticRoutes = [
    { url: baseUrl, lastModified: now, changeFrequency: 'hourly', priority: 1.0 },
    { url: `${baseUrl}/jurisdictions`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/compare`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/index`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/labs`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/compute`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/methodology`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 }
  ];

  const jurisdictionRoutes = JURISDICTIONS.map((j) => ({
    url: `${baseUrl}/jurisdiction/${j.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.85
  }));

  let signalRoutes = [];
  try {
    const [dbEvents, curated] = await Promise.all([
      getEvents('90d').catch(() => []),
      Promise.resolve(getStopKillerRobotsSignals() || [])
    ]);
    const seen = new Set();
    for (const ev of [...curated, ...(dbEvents || [])]) {
      const cleanId = normalizeSignalId(ev?.id);
      if (!cleanId || seen.has(cleanId)) continue;
      seen.add(cleanId);
      const ts = new Date(ev.original_post_time || ev.timestamp || now);
      signalRoutes.push({
        url: `${baseUrl}/signal/${encodeURIComponent(cleanId)}`,
        lastModified: isNaN(ts.getTime()) ? now : ts,
        changeFrequency: 'weekly',
        priority: 0.7
      });
      if (signalRoutes.length >= 80) break;
    }
  } catch (e) {
    console.warn('Sitemap signal enumeration fallback:', e.message);
  }

  return [...staticRoutes, ...jurisdictionRoutes, ...signalRoutes];
}
