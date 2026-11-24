import { NextResponse } from 'next/server';

export const revalidate = 1800;

// Land-verified sovereign centroids for OONI ISO-2 country codes & IODA region mapping
const COUNTRY_COORDS = {
  AF: { name: 'Afghanistan', lat: 34.5553, lon: 69.2075 },
  AE: { name: 'United Arab Emirates', lat: 24.4539, lon: 54.3773 },
  AR: { name: 'Argentina', lat: -34.6037, lon: -58.3816 },
  AU: { name: 'Australia', lat: -35.2809, lon: 149.1300 },
  AZ: { name: 'Azerbaijan', lat: 40.4093, lon: 49.8671 },
  BD: { name: 'Bangladesh', lat: 23.8103, lon: 90.4125 },
  BR: { name: 'Brazil', lat: -15.7975, lon: -47.8919 },
  BY: { name: 'Belarus', lat: 53.9006, lon: 27.5590 },
  CA: { name: 'Canada', lat: 45.4215, lon: -75.6972 },
  CD: { name: 'DR Congo', lat: -4.4419, lon: 15.2663 },
  CL: { name: 'Chile', lat: -33.4489, lon: -70.6693 },
  CN: { name: 'China', lat: 39.9042, lon: 116.4074 },
  CO: { name: 'Colombia', lat: 4.7110, lon: -74.0721 },
  CU: { name: 'Cuba', lat: 23.1136, lon: -82.3666 },
  DE: { name: 'Germany', lat: 52.5200, lon: 13.4050 },
  DZ: { name: 'Algeria', lat: 36.7538, lon: 3.0588 },
  EG: { name: 'Egypt', lat: 30.0444, lon: 31.2357 },
  ER: { name: 'Eritrea', lat: 15.3229, lon: 38.9251 },
  ET: { name: 'Ethiopia', lat: 9.0054, lon: 38.7636 },
  FR: { name: 'France', lat: 48.8566, lon: 2.3522 },
  GB: { name: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
  GE: { name: 'Georgia', lat: 41.7151, lon: 44.8271 },
  GH: { name: 'Ghana', lat: 5.6037, lon: -0.1870 },
  ID: { name: 'Indonesia', lat: -6.2088, lon: 106.8456 },
  IN: { name: 'India', lat: 28.6139, lon: 77.2090 },
  IQ: { name: 'Iraq', lat: 33.3152, lon: 44.3661 },
  IR: { name: 'Iran', lat: 35.6892, lon: 51.3890 },
  JO: { name: 'Jordan', lat: 31.9454, lon: 35.9284 },
  KE: { name: 'Kenya', lat: -1.2921, lon: 36.8219 },
  KG: { name: 'Kyrgyzstan', lat: 42.8746, lon: 74.5698 },
  KH: { name: 'Cambodia', lat: 11.5564, lon: 104.9282 },
  KZ: { name: 'Kazakhstan', lat: 51.1694, lon: 71.4491 },
  LB: { name: 'Lebanon', lat: 33.8886, lon: 35.4955 },
  LY: { name: 'Libya', lat: 32.8872, lon: 13.1913 },
  MA: { name: 'Morocco', lat: 34.0209, lon: -6.8241 },
  MM: { name: 'Myanmar', lat: 19.7633, lon: 96.0785 },
  MX: { name: 'Mexico', lat: 19.4326, lon: -99.1332 },
  MY: { name: 'Malaysia', lat: 3.1390, lon: 101.6869 },
  MZ: { name: 'Mozambique', lat: -25.9692, lon: 32.5732 },
  NG: { name: 'Nigeria', lat: 9.0765, lon: 7.3986 },
  NP: { name: 'Nepal', lat: 27.7172, lon: 85.3240 },
  OM: { name: 'Oman', lat: 23.5880, lon: 58.3829 },
  PE: { name: 'Peru', lat: -12.0464, lon: -77.0428 },
  PH: { name: 'Philippines', lat: 14.5995, lon: 120.9842 },
  PK: { name: 'Pakistan', lat: 33.6844, lon: 73.0479 },
  PS: { name: 'Palestine / Gaza', lat: 31.5017, lon: 34.4668 },
  QA: { name: 'Qatar', lat: 25.2854, lon: 51.5150 },
  RU: { name: 'Russia', lat: 55.7558, lon: 37.6173 },
  RW: { name: 'Rwanda', lat: -1.9441, lon: 30.0619 },
  SA: { name: 'Saudi Arabia', lat: 24.7136, lon: 46.6753 },
  SD: { name: 'Sudan', lat: 15.5007, lon: 32.5599 },
  SG: { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  SN: { name: 'Senegal', lat: 14.7167, lon: -17.4677 },
  SY: { name: 'Syria', lat: 33.5138, lon: 36.2765 },
  TH: { name: 'Thailand', lat: 13.7563, lon: 100.5018 },
  TJ: { name: 'Tajikistan', lat: 38.5598, lon: 68.7870 },
  TM: { name: 'Turkmenistan', lat: 37.9601, lon: 58.3261 },
  TN: { name: 'Tunisia', lat: 36.8065, lon: 10.1815 },
  TR: { name: 'Turkey', lat: 39.9334, lon: 32.8597 },
  TZ: { name: 'Tanzania', lat: -6.7924, lon: 39.2083 },
  UA: { name: 'Ukraine', lat: 50.4501, lon: 30.5234 },
  UG: { name: 'Uganda', lat: 0.3476, lon: 32.5825 },
  US: { name: 'United States', lat: 38.9072, lon: -77.0369 },
  UZ: { name: 'Uzbekistan', lat: 41.2995, lon: 69.2401 },
  VE: { name: 'Venezuela', lat: 10.4806, lon: -66.9036 },
  VN: { name: 'Vietnam', lat: 21.0285, lon: 105.8542 },
  YE: { name: 'Yemen', lat: 15.3694, lon: 44.1910 },
  ZA: { name: 'South Africa', lat: -25.7479, lon: 28.2293 },
  ZW: { name: 'Zimbabwe', lat: -17.8252, lon: 31.0335 }
};

export async function GET() {
  const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const untilSec = Math.floor(Date.now() / 1000);
  const fromSec = untilSec - 7 * 86400;

  const [ooniRes, iodaRes] = await Promise.all([
    fetch(
      `https://api.ooni.io/api/v1/aggregation?since=${since}&axis_x=probe_cc&test_name=web_connectivity`,
      { signal: AbortSignal.timeout(4500), next: { revalidate: 1800 } }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(
      `https://api.ioda.inetintel.cc.gatech.edu/v2/outages/alerts?from=${fromSec}&until=${untilSec}&limit=80`,
      { signal: AbortSignal.timeout(4500), next: { revalidate: 1800 } }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
  ]);

  // Index IODA active BGP / Active-Probing outage alerts by ISO-2 code when entityCode matches
  const iodaByCc = {};
  const iodaAlertsRaw = iodaRes?.data || [];
  if (Array.isArray(iodaAlertsRaw)) {
    for (const al of iodaAlertsRaw) {
      const code = String(al?.entity?.code || '').toUpperCase();
      if (al?.entity?.type === 'country' && COUNTRY_COORDS[code]) {
        iodaByCc[code] = (iodaByCc[code] || 0) + 1;
      }
    }
  }

  const items = [];
  const rows = ooniRes?.result || [];

  for (const row of rows) {
    const cc = String(row.probe_cc || '').toUpperCase();
    const meta = COUNTRY_COORDS[cc];
    if (!meta) continue;

    const confirmed = Number(row.confirmed_count) || 0;
    const anomalies = Number(row.anomaly_count) || 0;
    const measurements = Number(row.measurement_count) || 0;
    const iodaAlerts = iodaByCc[cc] || 0;

    if (confirmed < 10 && iodaAlerts === 0) continue;

    const blockRatePct = measurements > 0 ? Number((((confirmed + anomalies) / measurements) * 100).toFixed(1)) : 0;
    const severity = confirmed >= 500 || iodaAlerts >= 3 ? 5 : confirmed >= 100 || iodaAlerts >= 1 ? 4 : confirmed >= 25 ? 3 : 2;
    const color = severity >= 5 ? '#f43f5e' : severity >= 4 ? '#f97316' : '#a855f7';

    items.push({
      id: `ooni-${cc.toLowerCase()}`,
      cc,
      country: meta.name,
      name: `${meta.name} (${cc}) — Internet Censorship & Blocking`,
      title: `${meta.name}: ${confirmed.toLocaleString()} Confirmed Web Blocks${iodaAlerts ? ` & ${iodaAlerts} IODA Outage Alerts` : ''} (OONI 14d)`,
      lat: meta.lat,
      lon: meta.lon,
      confirmedBlocks: confirmed,
      anomalies,
      measurements,
      blockRatePct,
      iodaAlerts,
      severity,
      color,
      category: 'Surveillance',
      source: iodaAlerts > 0 ? 'OONI Explorer & Georgia Tech IODA' : 'OONI Explorer Live Telemetry',
      url: `https://explorer.ooni.org/chart/mat?probe_cc=${cc}&since=${since}`,
      summary: `Live OONI measurements over the past 14 days recorded ${confirmed.toLocaleString()} confirmed blocks and ${anomalies.toLocaleString()} network anomalies across ${measurements.toLocaleString()} probes in ${meta.name} (${blockRatePct}% disruption rate)${iodaAlerts ? `, paired with ${iodaAlerts} active IODA BGP/ping outage alerts` : ''}.`
    });
  }

  items.sort((a, b) => (b.confirmedBlocks + b.iodaAlerts * 300) - (a.confirmedBlocks + a.iodaAlerts * 300));

  return NextResponse.json({
    items: items.slice(0, 48),
    meta: {
      totalCountries: items.length,
      ooniLive: Boolean(rows.length),
      iodaLive: Array.isArray(iodaAlertsRaw),
      since
    }
  });
}
