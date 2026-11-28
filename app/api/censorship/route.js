import { NextResponse } from 'next/server';

export const revalidate = 1800;

// 180+ sovereign country & territory land centroids for live OONI Explorer + Georgia Tech IODA telemetry
const COUNTRY_COORDS = {
  AD: { name: 'Andorra', lat: 42.5063, lon: 1.5218 },
  AE: { name: 'United Arab Emirates', lat: 24.4539, lon: 54.3773 },
  AF: { name: 'Afghanistan', lat: 34.5553, lon: 69.2075 },
  AL: { name: 'Albania', lat: 41.3275, lon: 19.8187 },
  AM: { name: 'Armenia', lat: 40.1792, lon: 44.4991 },
  AO: { name: 'Angola', lat: -8.8390, lon: 13.2894 },
  AR: { name: 'Argentina', lat: -34.6037, lon: -58.3816 },
  AT: { name: 'Austria', lat: 48.2082, lon: 16.3738 },
  AU: { name: 'Australia', lat: -35.2809, lon: 149.1300 },
  AZ: { name: 'Azerbaijan', lat: 40.4093, lon: 49.8671 },
  BA: { name: 'Bosnia & Herzegovina', lat: 43.8563, lon: 18.4131 },
  BD: { name: 'Bangladesh', lat: 23.8103, lon: 90.4125 },
  BE: { name: 'Belgium', lat: 50.8503, lon: 4.3517 },
  BF: { name: 'Burkina Faso', lat: 12.3714, lon: -1.5197 },
  BG: { name: 'Bulgaria', lat: 42.6977, lon: 23.3219 },
  BH: { name: 'Bahrain', lat: 26.2285, lon: 50.5860 },
  BI: { name: 'Burundi', lat: -3.3614, lon: 29.3599 },
  BJ: { name: 'Benin', lat: 6.4969, lon: 2.6289 },
  BN: { name: 'Brunei', lat: 4.9031, lon: 114.9398 },
  BO: { name: 'Bolivia', lat: -16.4897, lon: -68.1193 },
  BR: { name: 'Brazil', lat: -15.7975, lon: -47.8919 },
  BS: { name: 'Bahamas', lat: 25.0343, lon: -77.3963 },
  BT: { name: 'Bhutan', lat: 27.4728, lon: 89.6390 },
  BW: { name: 'Botswana', lat: -24.6282, lon: 25.9231 },
  BY: { name: 'Belarus', lat: 53.9006, lon: 27.5590 },
  BZ: { name: 'Belize', lat: 17.2510, lon: -88.7590 },
  CA: { name: 'Canada', lat: 45.4215, lon: -75.6972 },
  CD: { name: 'DR Congo', lat: -4.4419, lon: 15.2663 },
  CF: { name: 'Central African Republic', lat: 4.3947, lon: 18.5582 },
  CG: { name: 'Republic of Congo', lat: -4.2634, lon: 15.2429 },
  CH: { name: 'Switzerland', lat: 46.9480, lon: 7.4474 },
  CI: { name: "Côte d'Ivoire", lat: 6.8276, lon: -5.2893 },
  CL: { name: 'Chile', lat: -33.4489, lon: -70.6693 },
  CM: { name: 'Cameroon', lat: 3.8480, lon: 11.5021 },
  CN: { name: 'China', lat: 39.9042, lon: 116.4074 },
  CO: { name: 'Colombia', lat: 4.7110, lon: -74.0721 },
  CR: { name: 'Costa Rica', lat: 9.9281, lon: -84.0907 },
  CU: { name: 'Cuba', lat: 23.1136, lon: -82.3666 },
  CV: { name: 'Cape Verde', lat: 14.9330, lon: -23.5133 },
  CY: { name: 'Cyprus', lat: 35.1856, lon: 33.3823 },
  CZ: { name: 'Czechia', lat: 50.0755, lon: 14.4378 },
  DE: { name: 'Germany', lat: 52.5200, lon: 13.4050 },
  DJ: { name: 'Djibouti', lat: 11.5721, lon: 43.1456 },
  DK: { name: 'Denmark', lat: 55.6761, lon: 12.5683 },
  DO: { name: 'Dominican Republic', lat: 18.4861, lon: -69.9312 },
  DZ: { name: 'Algeria', lat: 36.7538, lon: 3.0588 },
  EC: { name: 'Ecuador', lat: -0.1807, lon: -78.4678 },
  EE: { name: 'Estonia', lat: 59.4370, lon: 24.7536 },
  EG: { name: 'Egypt', lat: 30.0444, lon: 31.2357 },
  ER: { name: 'Eritrea', lat: 15.3229, lon: 38.9251 },
  ES: { name: 'Spain', lat: 40.4168, lon: -3.7038 },
  ET: { name: 'Ethiopia', lat: 9.0054, lon: 38.7636 },
  FI: { name: 'Finland', lat: 60.1699, lon: 24.9384 },
  FJ: { name: 'Fiji', lat: -18.1416, lon: 178.4419 },
  FR: { name: 'France', lat: 48.8566, lon: 2.3522 },
  GA: { name: 'Gabon', lat: 0.4162, lon: 9.4673 },
  GB: { name: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
  GE: { name: 'Georgia', lat: 41.7151, lon: 44.8271 },
  GH: { name: 'Ghana', lat: 5.6037, lon: -0.1870 },
  GM: { name: 'Gambia', lat: 13.4549, lon: -16.5790 },
  GN: { name: 'Guinea', lat: 9.6412, lon: -13.5784 },
  GP: { name: 'Guadeloupe', lat: 16.2650, lon: -61.5510 },
  GR: { name: 'Greece', lat: 37.9838, lon: 23.7275 },
  GT: { name: 'Guatemala', lat: 14.6349, lon: -90.5069 },
  GW: { name: 'Guinea-Bissau', lat: 11.8817, lon: -15.6178 },
  GY: { name: 'Guyana', lat: 6.8013, lon: -58.1551 },
  HK: { name: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
  HN: { name: 'Honduras', lat: 14.0723, lon: -87.1921 },
  HR: { name: 'Croatia', lat: 45.8150, lon: 15.9819 },
  HT: { name: 'Haiti', lat: 18.5944, lon: -72.3074 },
  HU: { name: 'Hungary', lat: 47.4979, lon: 19.0402 },
  ID: { name: 'Indonesia', lat: -6.2088, lon: 106.8456 },
  IE: { name: 'Ireland', lat: 53.3498, lon: -6.2603 },
  IL: { name: 'Israel', lat: 31.7683, lon: 35.2137 },
  IN: { name: 'India', lat: 28.6139, lon: 77.2090 },
  IQ: { name: 'Iraq', lat: 33.3152, lon: 44.3661 },
  IR: { name: 'Iran', lat: 35.6892, lon: 51.3890 },
  IS: { name: 'Iceland', lat: 64.1466, lon: -21.9426 },
  IT: { name: 'Italy', lat: 41.9028, lon: 12.4964 },
  JM: { name: 'Jamaica', lat: 17.9714, lon: -76.7931 },
  JO: { name: 'Jordan', lat: 31.9454, lon: 35.9284 },
  JP: { name: 'Japan', lat: 35.6762, lon: 139.6503 },
  KE: { name: 'Kenya', lat: -1.2921, lon: 36.8219 },
  KG: { name: 'Kyrgyzstan', lat: 42.8746, lon: 74.5698 },
  KH: { name: 'Cambodia', lat: 11.5564, lon: 104.9282 },
  KM: { name: 'Comoros', lat: -11.7172, lon: 43.2473 },
  KP: { name: 'North Korea', lat: 39.0392, lon: 125.7625 },
  KR: { name: 'South Korea', lat: 37.5665, lon: 126.9780 },
  KW: { name: 'Kuwait', lat: 29.3759, lon: 47.9774 },
  KZ: { name: 'Kazakhstan', lat: 51.1694, lon: 71.4491 },
  LA: { name: 'Laos', lat: 17.9757, lon: 102.6331 },
  LB: { name: 'Lebanon', lat: 33.8886, lon: 35.4955 },
  LK: { name: 'Sri Lanka', lat: 6.9271, lon: 79.8612 },
  LR: { name: 'Liberia', lat: 6.3156, lon: -10.8074 },
  LS: { name: 'Lesotho', lat: -29.3151, lon: 27.4869 },
  LT: { name: 'Lithuania', lat: 54.6872, lon: 25.2797 },
  LU: { name: 'Luxembourg', lat: 49.6116, lon: 6.1319 },
  LV: { name: 'Latvia', lat: 56.9496, lon: 24.1052 },
  LY: { name: 'Libya', lat: 32.8872, lon: 13.1913 },
  MA: { name: 'Morocco', lat: 34.0209, lon: -6.8241 },
  MD: { name: 'Moldova', lat: 47.0105, lon: 28.8638 },
  ME: { name: 'Montenegro', lat: 42.4304, lon: 19.2594 },
  MG: { name: 'Madagascar', lat: -18.8792, lon: 47.5079 },
  MK: { name: 'North Macedonia', lat: 41.9981, lon: 21.4254 },
  ML: { name: 'Mali', lat: 12.6392, lon: -8.0029 },
  MM: { name: 'Myanmar', lat: 19.7633, lon: 96.0785 },
  MN: { name: 'Mongolia', lat: 47.8864, lon: 106.9057 },
  MO: { name: 'Macao', lat: 22.1987, lon: 113.5439 },
  MR: { name: 'Mauritania', lat: 18.0735, lon: -15.9582 },
  MT: { name: 'Malta', lat: 35.8989, lon: 14.5146 },
  MU: { name: 'Mauritius', lat: -20.1609, lon: 57.5012 },
  MV: { name: 'Maldives', lat: 4.1755, lon: 73.5093 },
  MW: { name: 'Malawi', lat: -13.9626, lon: 33.7741 },
  MX: { name: 'Mexico', lat: 19.4326, lon: -99.1332 },
  MY: { name: 'Malaysia', lat: 3.1390, lon: 101.6869 },
  MZ: { name: 'Mozambique', lat: -25.9692, lon: 32.5732 },
  NA: { name: 'Namibia', lat: -22.5609, lon: 17.0658 },
  NC: { name: 'New Caledonia', lat: -22.2758, lon: 166.4580 },
  NE: { name: 'Niger', lat: 13.5116, lon: 2.1254 },
  NG: { name: 'Nigeria', lat: 9.0765, lon: 7.3986 },
  NI: { name: 'Nicaragua', lat: 12.1150, lon: -86.2362 },
  NL: { name: 'Netherlands', lat: 52.3676, lon: 4.9041 },
  NO: { name: 'Norway', lat: 59.9139, lon: 10.7522 },
  NP: { name: 'Nepal', lat: 27.7172, lon: 85.3240 },
  NZ: { name: 'New Zealand', lat: -41.2865, lon: 174.7762 },
  OM: { name: 'Oman', lat: 23.5880, lon: 58.3829 },
  PA: { name: 'Panama', lat: 8.9824, lon: -79.5199 },
  PE: { name: 'Peru', lat: -12.0464, lon: -77.0428 },
  PG: { name: 'Papua New Guinea', lat: -9.4438, lon: 147.1803 },
  PH: { name: 'Philippines', lat: 14.5995, lon: 120.9842 },
  PK: { name: 'Pakistan', lat: 33.6844, lon: 73.0479 },
  PL: { name: 'Poland', lat: 52.2297, lon: 21.0122 },
  PR: { name: 'Puerto Rico', lat: 18.4655, lon: -66.1057 },
  PS: { name: 'Palestine / Gaza', lat: 31.5017, lon: 34.4668 },
  PT: { name: 'Portugal', lat: 38.7223, lon: -9.1393 },
  PY: { name: 'Paraguay', lat: -25.2637, lon: -57.5759 },
  QA: { name: 'Qatar', lat: 25.2854, lon: 51.5150 },
  RO: { name: 'Romania', lat: 44.4268, lon: 26.1025 },
  RS: { name: 'Serbia', lat: 44.7866, lon: 20.4489 },
  RU: { name: 'Russia', lat: 55.7558, lon: 37.6173 },
  RW: { name: 'Rwanda', lat: -1.9441, lon: 30.0619 },
  SA: { name: 'Saudi Arabia', lat: 24.7136, lon: 46.6753 },
  SD: { name: 'Sudan', lat: 15.5007, lon: 32.5599 },
  SE: { name: 'Sweden', lat: 59.3293, lon: 18.0686 },
  SG: { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  SI: { name: 'Slovenia', lat: 46.0569, lon: 14.5058 },
  SK: { name: 'Slovakia', lat: 48.1486, lon: 17.1077 },
  SL: { name: 'Sierra Leone', lat: 8.4657, lon: -13.2317 },
  SN: { name: 'Senegal', lat: 14.7167, lon: -17.4677 },
  SO: { name: 'Somalia', lat: 2.0469, lon: 45.3182 },
  SR: { name: 'Suriname', lat: 5.8520, lon: -55.2038 },
  SS: { name: 'South Sudan', lat: 4.8594, lon: 31.5713 },
  SV: { name: 'El Salvador', lat: 13.6929, lon: -89.2182 },
  SY: { name: 'Syria', lat: 33.5138, lon: 36.2765 },
  SZ: { name: 'Eswatini', lat: -26.3054, lon: 31.1367 },
  TD: { name: 'Chad', lat: 12.1348, lon: 15.0557 },
  TG: { name: 'Togo', lat: 6.1725, lon: 1.2314 },
  TH: { name: 'Thailand', lat: 13.7563, lon: 100.5018 },
  TJ: { name: 'Tajikistan', lat: 38.5598, lon: 68.7870 },
  TM: { name: 'Turkmenistan', lat: 37.9601, lon: 58.3261 },
  TN: { name: 'Tunisia', lat: 36.8065, lon: 10.1815 },
  TR: { name: 'Turkey', lat: 39.9334, lon: 32.8597 },
  TT: { name: 'Trinidad & Tobago', lat: 10.6549, lon: -61.5019 },
  TW: { name: 'Taiwan', lat: 25.0330, lon: 121.5654 },
  TZ: { name: 'Tanzania', lat: -6.7924, lon: 39.2083 },
  UA: { name: 'Ukraine', lat: 50.4501, lon: 30.5234 },
  UG: { name: 'Uganda', lat: 0.3476, lon: 32.5825 },
  US: { name: 'United States', lat: 38.9072, lon: -77.0369 },
  UY: { name: 'Uruguay', lat: -34.9011, lon: -56.1645 },
  UZ: { name: 'Uzbekistan', lat: 41.2995, lon: 69.2401 },
  VE: { name: 'Venezuela', lat: 10.4806, lon: -66.9036 },
  VN: { name: 'Vietnam', lat: 21.0285, lon: 105.8542 },
  YE: { name: 'Yemen', lat: 15.3694, lon: 44.1910 },
  ZA: { name: 'South Africa', lat: -25.7479, lon: 28.2293 },
  ZM: { name: 'Zambia', lat: -15.3875, lon: 28.3228 },
  ZW: { name: 'Zimbabwe', lat: -17.8252, lon: 31.0335 }
};

export async function GET() {
  const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const untilSec = Math.floor(Date.now() / 1000);
  const fromSec = untilSec - 7 * 86400; // 7-day IODA window keeps Georgia Tech responses fast & reliable

  const fetchHeaders = {
    'User-Agent': 'SovereignIntelligenceObservatory/2.0 (https://app.sovdash.com)',
    Accept: 'application/json'
  };

  const [ooniWebRes, ooniImRes, iodaAlertsRes, iodaEventsRes] = await Promise.all([
    fetch(
      `https://api.ooni.io/api/v1/aggregation?since=${since}&axis_x=probe_cc&test_name=web_connectivity`,
      { headers: fetchHeaders, signal: AbortSignal.timeout(7500), next: { revalidate: 1800 } }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(
      `https://api.ooni.io/api/v1/aggregation?since=${since}&axis_x=probe_cc&test_name=signal,telegram,whatsapp,tor,psiphon`,
      { headers: fetchHeaders, signal: AbortSignal.timeout(7500), next: { revalidate: 1800 } }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(
      `https://api.ioda.inetintel.cc.gatech.edu/v2/outages/alerts?entityType=country&from=${fromSec}&until=${untilSec}&limit=150`,
      { headers: fetchHeaders, signal: AbortSignal.timeout(8500), next: { revalidate: 1800 } }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(
      `https://api.ioda.inetintel.cc.gatech.edu/v2/outages/events?entityType=country&from=${fromSec}&until=${untilSec}&limit=100`,
      { headers: fetchHeaders, signal: AbortSignal.timeout(8500), next: { revalidate: 1800 } }
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
  ]);

  // Index OONI Web Connectivity by CC
  const webByCc = {};
  const webRows = Array.isArray(ooniWebRes?.result) ? ooniWebRes.result : [];
  for (const row of webRows) {
    const cc = String(row.probe_cc || '').toUpperCase();
    if (!COUNTRY_COORDS[cc]) continue;
    webByCc[cc] = {
      confirmed: Number(row.confirmed_count) || 0,
      anomalies: Number(row.anomaly_count) || 0,
      measurements: Number(row.measurement_count) || 0
    };
  }

  // Index OONI Instant Messaging & Circumvention (Signal, Telegram, WhatsApp, Tor, Psiphon) by CC
  const imByCc = {};
  const imRows = Array.isArray(ooniImRes?.result) ? ooniImRes.result : [];
  for (const row of imRows) {
    const cc = String(row.probe_cc || '').toUpperCase();
    if (!COUNTRY_COORDS[cc]) continue;
    imByCc[cc] = {
      imAnomalies: (Number(row.anomaly_count) || 0) + (Number(row.confirmed_count) || 0),
      imMeasurements: Number(row.measurement_count) || 0
    };
  }

  // Index IODA country BGP / Active-Probing / Ping outages (alerts + outage events fallback)
  const iodaByCc = {};
  const iodaAlertsRaw = Array.isArray(iodaAlertsRes?.data) ? iodaAlertsRes.data : [];
  for (const al of iodaAlertsRaw) {
    const code = String(al?.entity?.code || '').toUpperCase();
    const level = String(al?.level || '').toLowerCase();
    if (al?.entity?.type === 'country' && COUNTRY_COORDS[code] && (level === 'critical' || level === 'warning')) {
      if (!iodaByCc[code]) iodaByCc[code] = { count: 0, datasources: new Set() };
      iodaByCc[code].count += 1;
      if (al.datasource) iodaByCc[code].datasources.add(al.datasource);
    }
  }
  const iodaEventsRaw = Array.isArray(iodaEventsRes?.data) ? iodaEventsRes.data : [];
  for (const ev of iodaEventsRaw) {
    const code = String(ev?.location || ev?.entity?.code || '').replace(/^country\./i, '').toUpperCase();
    if (COUNTRY_COORDS[code] && (!iodaByCc[code] || iodaByCc[code].count === 0)) {
      if (!iodaByCc[code]) iodaByCc[code] = { count: 0, datasources: new Set() };
      iodaByCc[code].count += 1;
      if (ev.datasource) iodaByCc[code].datasources.add(ev.datasource);
    }
  }

  const allCcs = new Set([...Object.keys(webByCc), ...Object.keys(imByCc), ...Object.keys(iodaByCc)]);
  const items = [];

  for (const cc of allCcs) {
    const meta = COUNTRY_COORDS[cc];
    if (!meta) continue;

    const web = webByCc[cc] || { confirmed: 0, anomalies: 0, measurements: 0 };
    const im = imByCc[cc] || { imAnomalies: 0, imMeasurements: 0 };
    const ioda = iodaByCc[cc] || { count: 0, datasources: new Set() };

    const confirmed = web.confirmed;
    const anomalies = web.anomalies;
    const measurements = web.measurements;
    const blockRatePct = measurements > 0 ? Number((((confirmed + anomalies) / measurements) * 100).toFixed(1)) : 0;
    const imAnomalies = im.imAnomalies;
    const imMeasurements = im.imMeasurements;
    const iodaAlerts = ioda.count;
    const iodaDatasources = Array.from(ioda.datasources);

    const qualifies =
      confirmed >= 1 ||
      iodaAlerts >= 1 ||
      imAnomalies >= 15 ||
      (anomalies >= 120 && blockRatePct >= 8);

    if (!qualifies) continue;

    const severity =
      confirmed >= 500 || iodaAlerts >= 4
        ? 5
        : confirmed >= 80 || iodaAlerts >= 2 || imAnomalies >= 250
          ? 4
          : confirmed >= 10 || iodaAlerts >= 1 || imAnomalies >= 40
            ? 3
            : 2;
    const color = severity >= 5 ? '#f43f5e' : severity >= 4 ? '#f97316' : severity === 3 ? '#facc15' : '#a855f7';

    const ooniExplorerUrl = `https://explorer.ooni.org/chart/mat?probe_cc=${cc}&since=${since}`;
    const iodaUrl = `https://ioda.inetintel.cc.gatech.edu/country/${cc}`;

    items.push({
      id: `ooni-${cc.toLowerCase()}`,
      cc,
      country: meta.name,
      ethicsKind: 'censorship',
      name: `${meta.name} (${cc}) — Internet Censorship & Outage Telemetry`,
      title: `${meta.name}: ${confirmed.toLocaleString()} Web Blocks${imAnomalies ? ` · ${imAnomalies.toLocaleString()} IM/Tor Anomalies` : ''}${iodaAlerts ? ` · ${iodaAlerts} IODA Outage Alerts` : ''}`,
      lat: meta.lat,
      lon: meta.lon,
      confirmedBlocks: confirmed,
      anomalies,
      measurements,
      blockRatePct,
      imAnomalies,
      imMeasurements,
      iodaAlerts,
      iodaDatasources,
      severity,
      color,
      category: 'Surveillance',
      source: iodaAlerts > 0 ? 'OONI Explorer & Georgia Tech IODA' : 'OONI Explorer Live Telemetry',
      url: ooniExplorerUrl,
      ooniExplorerUrl,
      iodaUrl,
      summary: `Live 14-day OONI measurements in ${meta.name} (${cc}) logged ${confirmed.toLocaleString()} confirmed web blocks and ${anomalies.toLocaleString()} anomalies across ${measurements.toLocaleString()} probes (${blockRatePct}% disruption rate)${imAnomalies ? `, plus ${imAnomalies.toLocaleString()} messaging/circumvention (Signal, Telegram, WhatsApp, Tor, Psiphon) anomalies across ${imMeasurements.toLocaleString()} tests` : ''}${iodaAlerts ? `. Georgia Tech IODA simultaneously flagged ${iodaAlerts} BGP/active-probing outage alert(s) (${iodaDatasources.join(', ') || 'BGP/ping'})` : ''}.`
    });
  }

  items.sort((a, b) => (b.confirmedBlocks + b.iodaAlerts * 350 + b.imAnomalies * 0.6) - (a.confirmedBlocks + a.iodaAlerts * 350 + a.imAnomalies * 0.6));

  return NextResponse.json({
    items: items.slice(0, 130),
    meta: {
      totalCountries: items.length,
      ooniLive: Boolean(webRows.length),
      ooniImLive: Boolean(imRows.length),
      iodaLive: Boolean(iodaAlertsRaw.length || iodaEventsRaw.length),
      since
    }
  });
}
